const axios = require("axios");
const asyncHandler = require("../middleware/asyncHandler.js");
const invoiceModel = require("../models/invoice.js");
const qpay = require("../middleware/qpay");
const customerModel = require("../models/customer.js");
const companyModel = require("../models/company.js");
const Appointment = require("../models/appointment.js");
const Option = require("../models/option.js");
const Service = require("../models/service.js");
const schedule = require("../models/schedule.js");
const company = require("../models/company.js");
const customResponse = require("../utils/customResponse");

exports.createqpay = asyncHandler(async (req, res) => {
  try {
    const { access_token } = await qpay.makeRequest();
    if (!access_token) {
      return res.status(500).json({
        success: false,
        message: "QPay token авахад алдаа гарлаа",
      });
    }

    const invoice = await invoiceModel.findById(req.params.id).populate({
      path: "appointment",
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    let amount = 0;
    let packageName = "Багц";
    let companyName = "Компани";

    const durationMap = {
      one: 1,
      six: 6,
      year: 12,
    };

    // 🎯 Option-based invoice (package)
    if (invoice.isOption) {
      const opt = await Option.findById(invoice.package);
      if (!opt) {
        return res.status(400).json({
          success: false,
          message: "Package not found",
        });
      }
      const durationInMonths = durationMap[invoice.appointment.duration];
      amount = Number(opt.price * durationInMonths * (1 - invoice.discount));
      packageName = (opt.name || "Багц").toUpperCase();
    } else {
      // 🎯 Appointment-based invoice (service)
      const appointment = await Appointment.findById(
        invoice.appointment._id
      ).populate({
        path: "schedule",
        populate: {
          path: "serviceId",
          populate: {
            path: "companyId",
            model: "Company",
            select: "name advancePayment",
          },
        },
      });

      if (!appointment) {
        return res.status(400).json({
          success: false,
          message: "Appointment not found",
        });
      }

      const schedule = appointment.schedule;
      const service = schedule?.serviceId;
      const company = service?.companyId;

      if (!service || !company) {
        return res.status(400).json({
          success: false,
          message: "Schedule, Service, or Company missing",
        });
      }

      const servicePrice = parseFloat(service.price);
      const advancePercent = parseFloat(company.advancePayment || 0);
      companyName = (company.name || "Компани").toUpperCase();

      amount = invoice.isAdvance
        ? Math.floor((servicePrice * advancePercent) / 100)
        : servicePrice;
    }

    // ✅ Sender invoice ID
    const currentDateTime = new Date();
    const randomToo = Math.floor(Math.random() * 99999);
    const sender_invoice_no = `${currentDateTime
      .toISOString()
      .replace(/[:.]/g, "-")}-${randomToo}`;

    const invoicePayload = {
      invoice_code: process.env.invoice_code,
      sender_invoice_no,
      sender_branch_code: "branch",
      invoice_receiver_code: "terminal",
      invoice_receiver_data: {
        phone: `${req.body.phone || ""}`,
      },
      invoice_description: `${packageName}_${companyName}`,
      callback_url: `${process.env.AppRentCallBackUrl}${sender_invoice_no}`,
      lines: [
        {
          tax_product_code: `${randomToo}`,
          line_description: "Үйлчилгээ",
          line_quantity: 1,
          line_unit_price: amount,
        },
      ],
    };

    const response = await axios.post(
      `${process.env.qpayUrl}invoice`,
      invoicePayload,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    if (response.status === 200) {
      const invoiceUpdate = await invoiceModel.findByIdAndUpdate(
        req.params.id,
        {
          sender_invoice_id: sender_invoice_no,
          qpay_invoice_id: response.data.invoice_id,
          price: amount,
        },
        { new: true }
      );

      return res.status(200).json({
        success: true,
        invoice: invoiceUpdate,
        data: response.data,
      });
    } else {
      throw new Error("QPay invoice үүсгэхэд алдаа гарлаа");
    }
  } catch (error) {
    console.error("❌ createqpay error:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

exports.callback = asyncHandler(async (req, res) => {
  console.log("📥 [CALLBACK] QPay webhook ирлээ:");
  console.log("🔸 req.params:", req.params);
  console.log("🔸 req.query:", req.query);
  console.log("🔸 req.headers:", req.headers);
  console.log("🔸 req.body:", req.body);

  try {
    const io = req.app.get("io");
    const { id: senderInvoiceId } = req.params;

    const record = await invoiceModel.findOne({
      sender_invoice_id: senderInvoiceId,
    });

    if (!record) {
      console.warn("⚠️ Invoice not found:", senderInvoiceId);
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    if (record.status === "paid") {
      console.log("💵 Invoice already paid:", record.qpay_invoice_id);
      return res.status(200).json({
        success: true,
        message: "Төлбөр аль хэдийн амжилттай төлөгдсөн байна",
        order: record.appointment,
      });
    }

    const checkPaymentStatus = async (token) => {
      return await axios.post(
        `${process.env.qpayUrl}payment/check`,
        {
          object_type: "INVOICE",
          object_id: record.qpay_invoice_id,
          offset: {
            page_number: 1,
            page_limit: 100,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    };

    let qpay_token = await qpay.makeRequest();
    let access_token = qpay_token?.access_token;

    if (!access_token) {
      return res.status(500).json({
        success: false,
        message: "QPay access token not received",
      });
    }

    console.log("✅ Access token амжилттай авлаа:", access_token);

    let checkResponse;

    try {
      checkResponse = await checkPaymentStatus(access_token);
    } catch (err) {
      const errData = err.response?.data || {};
      console.warn("⚠️ Initial token error:", errData);

      if (errData.code === "InvalidAccessToken") {
        console.log("🔄 Retrying with force new token...");
        const retryToken = await qpay.makeRequest(true); // 🔥 force:true өгнө
        access_token = retryToken?.access_token;

        if (!access_token) {
          return res.status(500).json({
            success: false,
            message: "QPay retry access_token failed",
          });
        }

        checkResponse = await checkPaymentStatus(access_token);
      } else {
        throw err;
      }
    }
    console.log("access_token:2", access_token);
    console.log("📦 QPay /payment/check хариу:", checkResponse.data);

    const isPaid =
      checkResponse.data.count === 1 &&
      checkResponse.data.rows[0]?.payment_status === "PAID";

    if (!isPaid) {
      console.warn("💳 Төлбөр амжилттай хийгдээгүй байна");
      return res.status(402).json({
        success: false,
        message: "Төлбөр хараахан амжилттай биш байна",
      });
    }

    // ✅ төлөв шинэчлэх
    record.status = "paid";
    await record.save();

    const app = await Appointment.findById(record.appointment).populate({
      path: "schedule",
      populate: {
        path: "serviceId",
        populate: {
          path: "companyId",
          select: "name bankNumber commissionRate done companyOwner",
        },
      },
    });

    if (!app) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }

    app.status = "paid";
    await app.save();

    const service = app.schedule.serviceId;
    const company = service.companyId;

    service.done++;
    await service.save();

    company.done++;
    await company.save();

    const totalAmount = Number(record.price);
    const commission = Number(company.commissionRate || 0);
    const payout = Math.floor(totalAmount * ((100 - commission) / 100));

    console.log("💰 Total price:", totalAmount);
    console.log("📉 Commission rate:", commission, "%");
    console.log("🏦 Khan-д шилжүүлэх дүн (payout):", payout, "MNT");
    console.log("🏦 Компани банкны мэдээлэл:");
    console.log("🔹 companyOwner1:", company.companyOwner);
    console.log("🔹 bankNumber1:", company.bankNumber);

    if (!payout || isNaN(payout) || payout <= 0) {
      console.warn("❌ payout утга буруу байна:", payout);
      return res.status(500).json({
        success: false,
        message: "Шилжүүлэх дүн алдаатай байна",
      });
    }

    await axios.post(
      `${process.env.khanUrl}/transfer`,
      {
        fromAccount: process.env.corporateAccountNumber,
        toAccount: company.bankNumber,
        amount: payout,
        currency: "MNT",
        description: `Шилжүүлэг: ${company.name} `,
      },
      {
        auth: {
          username: process.env.corporateUserName,
          password: process.env.corporateTranPass,
        },
      }
    );

    io.emit("paymentDone");

    return res.status(200).json({
      success: true,
      message: "Төлбөр амжилттай хийгдэж, мөнгө шилжүүллээ",
      order: app,
    });
  } catch (error) {
    console.error(
      "❌ QPay Callback Error:",
      error.response?.data || error.message
    );
    return res.status(500).json({
      success: false,
      message: "Системийн алдаа",
      error: error.message,
    });
  }
});
