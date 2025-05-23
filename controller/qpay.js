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

      amount = invoice.isAdvance
        ? Math.floor((servicePrice * advancePercent) / 100) // урьдчилгаа
        : servicePrice; // бүрэн төлбөр
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
    }
  } catch (error) {
    console.error("❌ createqpay error:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

exports.callback = asyncHandler(async (req, res, next) => {
  try {
    const io = req.app.get("io");
    const qpay_token = await qpay.makeRequest();
    const { access_token } = qpay_token;

    console.log(req.params.id);

    const record = await invoiceModel.findOne({
      sender_invoice_id: req.params.id,
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }
    const { qpay_invoice_id, _id, appointment, status } = record;
    const ordersLL = await Appointment.findById(appointment);
    if (status == "paid") {
      return res.status(200).json({
        success: true,
        message: "Төлөгдсөн байна",
        order: ordersLL,
      });
    }
    const rentId = _id;
    var request = {
      object_type: "INVOICE",
      object_id: qpay_invoice_id,
      offset: {
        page_number: 1,
        page_limit: 100,
      },
    };

    const header = {
      headers: { Authorization: `Bearer ${access_token}` },
    };

    //  төлбөр төлөглдөж байгааа
    const result = await axios.post(
      process.env.qpayUrl + "payment/check",
      request,
      header
    );
    console.log(result.data);
    if (
      result.data.count == 1 &&
      result.data.rows[0].payment_status == "PAID"
    ) {
      record.status = "paid";
      await record.save();

      console.log("gfgf");

      const app = await Appointment.findById(appointment);
      if (!app) {
        return res
          .status(404)
          .json({ success: false, message: "Appointment not found" });
      }

      app.status = "paid";
      await app.save();

      if (app.isOption) {
      } else {
        const sche = await schedule.findById(app.schedule.toString());

        const services = await Service.findById(sche.serviceId.toString());
        console.log(services);

        console.log("gfgf");
        services.done++;
        await services.save();

        const updatedApp = await Appointment.findByIdAndUpdate(
          appointment,
          { status: "paid" },
          { new: true }
        ).populate("schedule");

        console.log("gfgf");
        const updatedSchedule = await schedule.findById(
          updatedApp.schedule.toString()
        );
        const service = await Service.findById(
          updatedSchedule.serviceId.toString()
        );
        const pcm = await company.findById(service.companyId.toString());

        if (pcm) {
          pcm.done++;
          await pcm.save();
        }
        console.log("irjin");
      }

      io.emit("paymentDone");

      return res.status(200).json({
        success: true,
        message: "Төлөлт амжилттай",
        order: app,
      });
    } else {
      return res.status(401).json({
        success: false,
        message: "Төлөлт амжилтгүй",
      });
    }
  } catch (error) {
    console.log(error.response.data);
    res.status(500).json({ success: false, error: error.message });
  }
});
