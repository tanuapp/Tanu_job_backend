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
const { generateCredential } = require("../middleware/khan");
const { sendNotification } = require("../utils/apnService.js");

exports.createqpay = asyncHandler(async (req, res) => {
  try {
    const qpay_token = await qpay.makeRequest();
    console.log("🔐 access_token:", qpay_token.access_token);

    const invoice = await invoiceModel.findById(req.params.id).populate({
      path: "appointment",
    });

    if (!invoice) {
      return res
        .status(404)
        .json({ success: false, message: "Invoice not found" });
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
        return res
          .status(400)
          .json({ success: false, message: "Package not found" });
      }
      const durationInMonths = durationMap[invoice.appointment.duration];
      amount = Number(opt.price * durationInMonths * (1 - invoice.discount));
      packageName = (opt.name || "Багц").toUpperCase();
    }

    // 🎯 Appointment-based invoice (service)
    else {
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
        return res
          .status(400)
          .json({ success: false, message: "Appointment not found" });
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

      // ✅ ШИНЭ: Хэрэв appointment status === "completed" бол үлдэгдэл дүн ашиглана
      if (appointment.status === "completed") {
        amount = parseFloat(invoice.amount); // Урьдчилгаа төлсөн, үлдэгдэлд төлж буй
      } else {
        amount = invoice.isAdvance
          ? Math.floor((servicePrice * advancePercent) / 100)
          : servicePrice;
      }
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
          line_description: `Үйлчилгээ`,
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
          Authorization: `Bearer ${qpay_token.access_token}`,
        },
      }
    );

    if (response.status === 200) {
      const invoiceUpdate = await invoiceModel.findByIdAndUpdate(
        req.params.id,
        {
          sender_invoice_id: sender_invoice_no,
          qpay_invoice_id: response.data.invoice_id,
          price: amount, // Always save what was actually used
        },
        { new: true }
      );

      return res.status(200).json({
        success: true,
        invoice: invoiceUpdate,
        data: response.data,
      });
    }
  } catch (error) {
    console.error("❌ createqpay error:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

exports.callback = asyncHandler(async (req, res) => {
  console.log("📥 [CALLBACK] QPay webhook ирлээ");
  const senderInvoiceId = req.params.id;

  try {
    const io = req.app.get("io");

    const qpay_token = await qpay.makeRequest();
    const qpayAccessToken = qpay_token?.access_token;
    if (!qpayAccessToken) {
      return res
        .status(500)
        .json({ success: false, message: "QPay токен олдсонгүй" });
    }

    const record = await invoiceModel.findOne({
      sender_invoice_id: senderInvoiceId,
    });
    if (!record) {
      return res
        .status(404)
        .json({ success: false, message: "Invoice not found" });
    }

    if (record.status === "paid" || record.status === "done") {
      return res.status(200).json({
        success: true,
        message: "Төлбөр аль хэдийн хийгдсэн байна",
        order: record.appointment,
      });
    }

    // QPay төлбөр шалгах
    const checkResponse = await axios.post(
      `${process.env.qpayUrl}payment/check`,
      {
        object_type: "INVOICE",
        object_id: record.qpay_invoice_id,
        offset: { page_number: 1, page_limit: 100 },
      },
      {
        headers: {
          Authorization: `Bearer ${qpayAccessToken}`,
        },
      }
    );

    const isPaid =
      checkResponse.data.count >= 1 &&
      checkResponse.data.rows[0]?.payment_status === "PAID";

    if (!isPaid) {
      return res.status(402).json({
        success: false,
        message: "Төлбөр амжилттай хийгдээгүй байна",
      });
    }

    const app = await Appointment.findById(
      record.appointment._id || record.appointment
    )
      .select("status schedule user")
      .populate({
        path: "user",
        select: "deviceToken", // push token
      })
      .populate({
        path: "schedule",
        populate: {
          path: "serviceId",
          populate: {
            path: "companyId",
            select: "name bankNumber commissionRate done bankOwner bankCode",
          },
        },
      });

    if (!app) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }

    const originalStatus = app.status;
    if (originalStatus === "completed") {
      app.status = "done";
      record.status = "done";

      // ✅ Push мэдэгдэл
      if (app.user?.deviceToken) {
        try {
          await sendNotification(
            [app.user.deviceToken],
            "Таны үйлчилгээ амжилттай дууслаа!"
          );
        } catch (err) {
          console.error("🚫 Push илгээхэд алдаа гарлаа:", err.message);
        }
      }
    } else {
      app.status = "paid";
      record.status = "paid";
    }

    await app.save();
    await record.save();

    const service = app.schedule.serviceId;
    const company = service.companyId;

    service.done++;
    await service.save();

    company.done++;
    await company.save();

    // 💰 Шимтгэл тооцоолол
    const originalAmount = Number(record.price);
    const commissionPercent = 1; // 1%
    const commission = Math.floor(originalAmount * (commissionPercent / 100));
    const payout = originalAmount - commission;

    if (!payout || isNaN(payout) || payout <= 0) {
      return res
        .status(500)
        .json({ success: false, message: "Шилжүүлэх дүн алдаатай байна" });
    }

    const khanToken = await generateCredential();
    if (!khanToken) {
      return res
        .status(500)
        .json({ success: false, message: "Khan токен олдсонгүй" });
    }

    const transferType =
      company.bankCode === "050000" ? "domestic" : "interbank";

    await axios.post(
      `${process.env.corporateEndPoint}transfer/${transferType}`,
      {
        fromAccount: process.env.corporateAccountNumber,
        toAccount: company.bankNumber,
        toAccountName: company.bankOwner,
        toBank: company.bankCode || "050000",
        amount: payout,
        description: `Шилжүүлэг: ${
          company.name
        } ${new Date().toLocaleDateString("mn-MN")}`,
        toCurrency: "MNT",
        currency: "MNT",
        loginName: process.env.corporateEmail,
        tranPassword: process.env.corporateTranPass,
        transferid: "001",
      },
      {
        headers: {
          Authorization: `Bearer ${khanToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    io.emit("paymentDone");

    return res.status(200).json({
      success: true,
      message: "Төлбөр амжилттай хийгдэж, мөнгө Khan-д шилжүүллээ",
      order: app,
    });
  } catch (error) {
    console.error("❌ Callback Error:", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: "Системийн алдаа",
      error: error.message,
    });
  }
});
