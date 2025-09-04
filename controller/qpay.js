const asyncHandler = require("../middleware/asyncHandler.js");
const invoiceModel = require("../models/invoice.js");
const qpay = require("../middleware/qpay");
const Appointment = require("../models/appointment.js");
const Option = require("../models/option.js");
const { generateCredential } = require("../middleware/khan");
const { sendNotification } = require("../utils/apnService.js");
const axios = require("axios");

exports.createqpay = asyncHandler(async (req, res) => {
  try {
    const qpay_token = await qpay.makeRequest();

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

    // ✅ Option-based invoice
    if (invoice.isOption) {
      const opt = await Option.findById(invoice.package);

      if (!opt) {
        console.log("❌ Package not found");
        return res
          .status(400)
          .json({ success: false, message: "Package not found" });
      }

      const durationInMonths = durationMap[invoice.appointment.duration];
      amount = Number(opt.price * durationInMonths * (1 - invoice.discount));
      packageName = (opt.name || "Багц").toUpperCase();
    }

    // ✅ Service-based invoice
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
            select: "name advancePayment discount discountStart discountEnd",
          },
        },
      });

      if (!appointment) {
        return res
          .status(400)
          .json({ success: false, message: "Appointment not found" });
      }

      const schedule = appointment.schedule;
      const services = Array.isArray(schedule?.serviceId)
        ? schedule.serviceId
        : [schedule.serviceId];

      if (!services || services.length === 0) {
        console.log("❌ No services found");
        return res.status(400).json({
          success: false,
          message: "Schedule has no services",
        });
      }

      const company = services[0]?.companyId;
      if (!company) {
        console.log("❌ Company missing in service[0]");
        return res.status(400).json({
          success: false,
          message: "Service company not found",
        });
      }

      companyName = (company.name || "Компани").toUpperCase();

      const totalPrice = services.reduce(
        (sum, s) => sum + parseFloat(s.price || 0),
        0
      );
      // ✅ Хямдрал идэвхтэй эсэхийг шалгах
      const discountActive =
        company.discountStart &&
        company.discountEnd &&
        new Date() >= new Date(company.discountStart) &&
        new Date() <= new Date(company.discountEnd);

      let discountedTotalPrice = totalPrice;

      if (discountActive && company.discount) {
        const discountPercent = parseFloat(
          company.discount.replace(/[^0-9]/g, "")
        );
        if (!isNaN(discountPercent) && discountPercent > 0) {
          discountedTotalPrice = totalPrice * (1 - discountPercent / 100);
        }
      }

      const advancePercent = parseFloat(company.advancePayment || 0);

      if (appointment.status === "completed") {
        amount = parseFloat(invoice.amount);
      } else {
        amount = invoice.isAdvance
          ? Math.floor((discountedTotalPrice * advancePercent) / 100)
          : discountedTotalPrice;
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
      console.log("❌ QPay responded with unexpected status:", response.status);
      return res
        .status(500)
        .json({ success: false, message: "QPay error", data: response.data });
    }
  } catch (error) {
    console.error("❌ createqpay error:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

exports.callback = asyncHandler(async (req, res) => {
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
      console.log("❌ Төлбөр хийгдээгүй байна.");
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
        select: "first_name last_name phone email deviceToken", // ✅ нэмэв
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

      if (app.user?.deviceToken) {
        console.log("📲 Push мэдэгдэл илгээж байна...");
        try {
          await sendNotification(
            [app.user.deviceToken],
            "Таны үйлчилгээ амжилттай дууслаа!"
          );
          console.log("✅ Push илгээгдлээ.");
        } catch (err) {
          console.error("🚫 Push илгээхэд алдаа:", err.message);
        }
      }
    } else {
      app.status = "paid";
      record.status = "paid";
      console.log("✅ Төлөв updated to paid");
    }

    await app.save();
    await record.save();

    const serviceList = Array.isArray(app.schedule.serviceId)
      ? app.schedule.serviceId
      : [app.schedule.serviceId];

    const service = serviceList[0]; // эхний service
    const company = service.companyId;

    service.done++;
    await service.save();

    company.done++;
    await company.save();

    // // 💰 Шимтгэл тооцоолол
    const originalAmount = Number(record.price); // жишээ нь: 10
    const commissionPercent = 1;

    const commission = +(originalAmount * (commissionPercent / 100)).toFixed(2); // 0.10
    const payout = +(originalAmount - commission).toFixed(2); // 9.90

    if (!payout || isNaN(payout) || payout <= 0) {
      console.error("❌ Платеж алдаатай:", payout);
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
    const parts = [
      `Захиалга-`, // компанийн нэр байсаар байна
    ];

    if (app.user?.last_name) {
      parts.push(`Нэр: ${app.user.last_name || ""}`.trim());
    }

    if (app.user?.phone) {
      parts.push(`Утас: ${app.user.phone}`);
    }

    if (app.user?.email) {
      parts.push(`Имэйл: ${app.user.email}`);
    }

    const transferPayload = {
      fromAccount: process.env.corporateAccountNumber,
      toAccount: company.bankNumber,
      toAccountName: company.bankOwner,
      toBank: company.bankCode || "050000",
      amount: payout,
      description: parts.join(" "),
      toCurrency: "MNT",
      currency: "MNT",
      loginName: process.env.corporateEmail,
      tranPassword: process.env.corporateTranPass,
      transferid: "001",
    };
    console.log("📤 Transfer Payload:", transferPayload);

    const transferResponse = await axios.post(
      `${process.env.corporateEndPoint}transfer/${transferType}`,
      transferPayload,
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
