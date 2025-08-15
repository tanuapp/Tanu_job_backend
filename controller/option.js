const Model = require("../models/option");
const asyncHandler = require("../middleware/asyncHandler");
const customResponse = require("../utils/customResponse");
const Appointment = require("../models/appointment");
const Invoice = require("../models/invoice");
const Option = require("../models/option");
const Company = require("../models/company");
const qpay = require("../middleware/qpay");
const axios = require("axios");

exports.getAllModel = asyncHandler(async (req, res, next) => {
  try {
    const allUser = await Model.find();

    customResponse.success(res, allUser);
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

exports.createModel = asyncHandler(async (req, res, next) => {
  try {
    const result = await Model.create({
      ...req.body,
    });

    customResponse.success(res, result);
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

exports.updateModel = asyncHandler(async (req, res, next) => {
  try {
    const result = await Model.findByIdAndUpdate(req.params.id, {
      ...req.body,
    });

    customResponse.success(res, result);
  } catch (error) {
    customResponse.error(res, error.message);
  }
});
exports.getModel = asyncHandler(async (req, res, next) => {
  try {
    const result = await Model.findById(req.params.id);

    customResponse.success(res, result);
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

exports.deleteModel = asyncHandler(async (req, res, next) => {
  try {
    const result = await Model.findByIdAndDelete(req.params.id);

    customResponse.success(res, result);
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

exports.createPackageQpay = asyncHandler(async (req, res) => {
  console.log("data", req.body);
  const {
    selectedPackageId,
    selectedDuration,
    discount,
    companyId,
    finalPrice,
  } = req.body;

  try {
    // 1) Trial бол шууд return
    const pkg = await Option.findById(selectedPackageId);
    if (!pkg) {
      return res
        .status(404)
        .json({ success: false, message: "Package not found" });
    }
    if (pkg.name === "trial") {
      return res
        .status(200)
        .json({ success: true, message: "Trial package no payment" });
    }

    // 2) Appointment үүсгэх
    const appointment = await Appointment.create({
      option: selectedPackageId,
      duration: selectedDuration?.duration,
      isOption: true,
      date: new Date(),
    });

    // 3) Invoice үүсгэх
    const invoice = await Invoice.create({
      amount: finalPrice,
      package: selectedPackageId,
      isOption: true,
      appointment: appointment._id,
      discount,
      companyId,
    });

    // 4) QPay token авах
    const qpay_token = await qpay.makeRequest();

    // 5) Sender invoice id
    const sender_invoice_no = `${new Date()
      .toISOString()
      .replace(/[:.]/g, "-")}-${Math.floor(Math.random() * 99999)}`;

    // 6) QPay payload
    const invoicePayload = {
      invoice_code: process.env.invoice_code,
      sender_invoice_no,
      sender_branch_code: "branch",
      invoice_receiver_code: "terminal",
      invoice_receiver_data: {
        phone: `${req.body.phone || ""}`,
      },
      invoice_description: `${pkg.name}_${companyId}`,
      callback_url: `https://booking.tanuweb.cloud/api/v1/option/qpay/callback/${sender_invoice_no}`,

      lines: [
        {
          tax_product_code: `${Math.floor(Math.random() * 99999)}`,
          line_description: `Үйлчилгээ`,
          line_quantity: 1,
          line_unit_price: finalPrice,
        },
      ],
    };

    // 7) QPay API руу илгээх
    const response = await axios.post(
      `${process.env.qpayUrl}invoice`,
      invoicePayload,
      { headers: { Authorization: `Bearer ${qpay_token.access_token}` } }
    );

    // 8) Invoice update
    invoice.sender_invoice_id = sender_invoice_no;
    invoice.qpay_invoice_id = response.data.invoice_id;
    invoice.price = finalPrice;
    await invoice.save();

    // 9) Company update
    let packageEndDate;
    if (selectedDuration?.value === "1") {
      const now = new Date();
      now.setDate(now.getDate() + 30);
      packageEndDate = now.toISOString();
    } else if (selectedDuration?.value === "6") {
      const now = new Date();
      now.setDate(now.getDate() + 180);
      packageEndDate = now.toISOString();
    } else if (selectedDuration?.value === "12") {
      const now = new Date();
      now.setDate(now.getDate() + 365);
      packageEndDate = now.toISOString();
    }

    return res.status(200).json({
      success: true,
      invoice,
      qpay: response.data,
    });
  } catch (err) {
    console.error("❌ createPackageQpay error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// QPay callback
exports.qpayCallback = asyncHandler(async (req, res) => {
  const io = req.app.get("io");

  try {
    const { sender_invoice_no } = req.params;
    const { qpay_payment_id } = req.query;

    console.log("📥 QPay callback:", sender_invoice_no, qpay_payment_id);

    if (!qpay_payment_id) {
      return res
        .status(400)
        .json({ success: false, message: "Missing qpay_payment_id" });
    }

    const qpay_token = await qpay.makeRequest();
    const statusRes = await axios.get(
      `${process.env.qpayUrl}payment/checkPayment/${qpay_payment_id}`,
      {
        headers: { Authorization: `Bearer ${qpay_token.access_token}` },
      }
    );

    if (statusRes.data.payment_status === "PAID") {
      const invoice = await Invoice.findOne({
        qpay_invoice_id: statusRes.data.invoice_id,
      }).populate("companyId");

      if (!invoice) {
        return res
          .status(404)
          .json({ success: false, message: "Invoice not found" });
      }

      await Company.findByIdAndUpdate(invoice.companyId._id, {
        package: [invoice.package],
        packageEndDate: invoice.packageEndDate,
        isPackage: true,
        status: 1,
      });

      invoice.status = "paid";
      await invoice.save();

      io.emit("contractPaymentDone", {
        message: "Төлбөр амжилттай",
        invoiceId: invoice._id,
        companyId: invoice.companyId._id,
      });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error(
      "QPay callback error:",
      error.response?.data || error.message
    );
    res.status(500).json({ success: false, error: error.message });
  }
});
