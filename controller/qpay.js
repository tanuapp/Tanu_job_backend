const axios = require("axios");
const asyncHandler = require("../middleware/asyncHandler.js");
const invoiceModel = require("../models/invoice.js");
const qpay = require("../middleware/qpay");
const customerModel = require("../models/customer.js");
const Appointment = require("../models/appointment.js");
const Service = require("../models/service.js");
// const khan = require("../middleware/khaan");
// const uniqid = require("uniqid");
const schedule = require("../models/schedule.js");

exports.createqpay = asyncHandler(async (req, res) => {
  try {
    const customer = await customerModel.findById(req.userId);
    const qpay_token = await qpay.makeRequest();
    const { phone } = customer;
    const currentDateTime = new Date();
    const randomToo = Math.floor(Math.random() * 99999);
    const sender_invoice_no =
      currentDateTime.getFullYear() +
      "-" +
      ("0" + (currentDateTime.getMonth() + 1)).slice(-2) +
      "-" +
      ("0" + currentDateTime.getDate()).slice(-2) +
      "-" +
      ("0" + currentDateTime.getHours()).slice(-2) +
      "-" +
      ("0" + currentDateTime.getMinutes()).slice(-2) +
      "-" +
      ("0" + currentDateTime.getSeconds()).slice(-2) +
      "-" +
      ("00" + currentDateTime.getMilliseconds()).slice(-3) +
      randomToo;

    const invoice = {
      invoice_code: process.env.invoice_code,
      sender_invoice_no: sender_invoice_no,
      sender_branch_code: "branch",
      invoice_receiver_code: "terminal",
      invoice_receiver_data: {
        phone: `${phone}`,
      },
      invoice_description: process.env.invoice_description,
      callback_url: process.env.AppRentCallBackUrl + sender_invoice_no,
      lines: [],
    };
    const invoiceLine = {
      tax_product_code: `${randomToo}`,
      line_description: `Мөнх-Эрдэнэ`,
      line_quantity: 10,
      line_unit_price: 1,
    };
    invoice.lines.push(invoiceLine);

    const header = {
      headers: { Authorization: `Bearer ${qpay_token.access_token}` },
    };

    const response = await axios.post(
      process.env.qpayUrl + "invoice",
      invoice,
      header
    );

    if (response.status === 200) {
      const invoiceUpdate = await invoiceModel.findByIdAndUpdate(
        req.params.id,
        {
          sender_invoice_id: sender_invoice_no,
          qpay_invoice_id: response.data.invoice_id,
          price: invoiceLine.line_unit_price,
        },
        { new: true }
      );
      return res
        .status(200)
        .json({ success: true, invoice: invoiceUpdate, data: response.data });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.callback = asyncHandler(async (req, res, next) => {
  try {
    const io = req.app.get("io");
    const qpay_token = await qpay.makeRequest();
    const { access_token } = qpay_token;
    var sender_invoice_no = req.params.id;
    const record = await invoiceModel.findOne({
      sender_invoice_id: sender_invoice_no,
    });
    console.log("recorded", record);
    if (record.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }
    const { qpay_invoice_id, _id, appointment, amount } = record;
    const app = await Appointment.findById(appointment);
    const sche = await schedule.findById(app.schedule);
    const services = await Service.findById(sche.serviceId);
    services.done++;
    await services.save();

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

    if (
      result.data.count == 1 &&
      result.data.rows[0].payment_status == "PAID"
    ) {
      io.emit("paymentDone");
      const updateStatusInvoice = await invoiceModel.findByIdAndUpdate(
        rentId,
        { status: "paid" },
        { new: true }
      );
      // const Company = await serviceModel.findById(Service);
      // let input = {
      //   Artist,
      //   Customer,
      //   Service,
      //   start: tsagAwah,
      //   Company: Company?.companyId,
      // };

      // const orderAddToCustomer = await customerOrder.create({
      //   Customer: Customer,
      //   ognoo: tsagAwah,
      //   Service: Service,
      // });
      // console.log("Миний захиалгад ажилттай  нэмэгдлээ", orderAddToCustomer);

      // var khan_token = await khan.makeRequest();
      // const header = {
      //   headers: {
      //     Authorization: "Bearer " + khan_token.access_token,
      //     "Content-Type": "application/json",
      //   },
      // };
      // const transferid = uniqid();
      // const mnaiOrlogo = price / 10;
      // const companyOrlogo = price - mnaiOrlogo;
      // const reqBody = {
      //   fromAccount: "5037820742",
      //   toAccount: "5075778806",
      //   toCurrency: "MNT",
      //   amount: companyOrlogo,
      //   description: "2024-06-08 орлого",
      //   currency: "MNT",
      //   loginName: "info.tanullc@gmail.com",
      //   tranPassword: "lol1234MOLL$$",
      //   transferid: transferid,
      // };

      // await axios.post(
      //   process.env.khanUrl + `transfer/domestic`,
      //   reqBody,
      //   header
      // );

      return res.status(200).json({
        success: true,
        message: "Төлөлт амжилттай",
      });
    } else {
      return res.status(401).json({
        success: false,
        message: "Төлөлт амжилтгүй",
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
