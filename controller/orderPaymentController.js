const asyncHandler = require("../middleware/asyncHandler.js");
const OrderInvoice = require("../models/orderInvoice.js");
const Order = require("../models/order.js");
const Wallet = require("../models/wallet.js");
const qpay = require("../middleware/qpay");
const { sendNotification } = require("../utils/apnService.js");
const axios = require("axios");

exports.createOrderQpay = asyncHandler(async (req, res) => {
  try {
    const qpay_token = await qpay.makeRequest();

    // Find the order
    const order = await Order.findById(req.params.id)
      .populate("user", "first_name last_name phone")
      .populate("freelancer", "first_name last_name phone")
      .populate("service", "serviceName price hourlyRate");

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // Calculate amount
    let amount = order.price;

    // Create or find existing invoice
    let invoice = await OrderInvoice.findOne({ order: req.params.id });

    if (!invoice) {
      invoice = await OrderInvoice.create({
        order: order._id,
        user: order.user._id,
        freelancer: order.freelancer._id,
        service: order.service?._id,
        amount: amount,
        price: amount,
        discount: order.discount || 0,
      });
    }

    if (invoice.status === "paid") {
      return res
        .status(400)
        .json({ success: false, message: "Invoice already paid" });
    }

    if (amount <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid order amount" });
    }

    // ✅ Sender invoice ID
    const currentDateTime = new Date();
    const randomToo = Math.floor(Math.random() * 99999);
    const sender_invoice_no = `ORDER-${currentDateTime
      .toISOString()
      .replace(/[:.]/g, "-")}-${randomToo}`;

    const serviceName =
      order.service?.serviceName || order.serviceName || "Үйлчилгээ";

    const invoicePayload = {
      invoice_code: process.env.invoice_code,
      sender_invoice_no,
      sender_branch_code: "ORDER_BRANCH",
      invoice_receiver_code: "terminal",
      invoice_receiver_data: {
        phone: `${order.user?.phone || ""}`,
        name: `${order.user?.first_name || ""} ${order.user?.last_name || ""}`,
      },
      invoice_description: `${serviceName}_ЗАХИАЛГА`,
      callback_url: `${process.env.AppRentCallBackUrl}order/${sender_invoice_no}`,
      lines: [
        {
          tax_product_code: `ORDER-${randomToo}`,
          line_description: `${serviceName} үйлчилгээ`,
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
      // Update invoice with QPay details
      invoice.sender_invoice_id = sender_invoice_no;
      invoice.qpay_invoice_id = response.data.invoice_id;
      await invoice.save();

      return res.status(200).json({
        success: true,
        invoice: invoice,
        data: response.data,
        order: {
          id: order._id,
          amount: amount,
          serviceName: serviceName,
        },
      });
    } else {
      console.log("❌ QPay responded with unexpected status:", response.status);
      return res
        .status(500)
        .json({ success: false, message: "QPay error", data: response.data });
    }
  } catch (error) {
    console.error("❌ createOrderQpay error:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

exports.orderCallback = asyncHandler(async (req, res) => {
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

    // Find invoice by sender_invoice_id
    const invoice = await OrderInvoice.findOne({
      sender_invoice_id: senderInvoiceId,
    })
      .populate("order")
      .populate("user", "first_name last_name phone email deviceToken")
      .populate("freelancer", "first_name last_name deviceToken");

    if (!invoice) {
      return res
        .status(404)
        .json({ success: false, message: "Invoice not found" });
    }

    if (invoice.status === "paid") {
      return res.status(200).json({
        success: true,
        message: "Төлбөр аль хэдийн хийгдсэн байна",
        order: invoice.order,
      });
    }

    // Check payment status with QPay
    const checkResponse = await axios.post(
      `${process.env.qpayUrl}payment/check`,
      {
        object_type: "INVOICE",
        object_id: invoice.qpay_invoice_id,
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

    // Update order status
    const order = await Order.findById(invoice.order._id);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // Mark invoice as paid
    invoice.status = "paid";
    await invoice.save();

    // Update order status
    order.status = "paid";
    order.paymentStatus = "completed";
    order.paidAt = new Date();
    await order.save();

    // 💰 Add money to freelancer's wallet using your existing Wallet model
    const commissionRate = 0.1; // 10% commission
    const freelancerAmount = Math.round(invoice.amount * (1 - commissionRate));
    const commissionAmount = invoice.amount - freelancerAmount;

    // Find or create freelancer's wallet
    let freelancerWallet = await Wallet.findOne({
      freelancerId: invoice.freelancer._id,
    });

    if (!freelancerWallet) {
      freelancerWallet = await Wallet.create({
        freelancerId: invoice.freelancer._id,
        balance: 0,
        currency: "MNT",
        status: "active",
        isActive: true,
      });
    }

    // Add transaction to freelancer's wallet for the payment
    const transactionData = {
      type: "credit",
      amount: freelancerAmount,
      description: `Захиалга #${order._id} - ${invoice.serviceName}`,
      appointmentId: order._id, // Using order ID since it's similar to appointment
      invoiceId: invoice._id,
      status: "completed",
    };

    await freelancerWallet.addTransaction(transactionData);

    // Add commission transaction separately
    const commissionTransactionData = {
      type: "commission",
      amount: commissionAmount,
      description: `Захиалга #${order._id} - Коммисс`,
      appointmentId: order._id,
      invoiceId: invoice._id,
      status: "completed",
    };

    await freelancerWallet.addTransaction(commissionTransactionData);

    console.log(`✅ ${freelancerAmount}₮ added to freelancer's wallet`);
    console.log(`💰 ${commissionAmount}₮ commission deducted`);

    // Send notifications
    if (invoice.user?.deviceToken) {
      try {
        await sendNotification(
          [invoice.user.deviceToken],
          "Таны захиалгын төлбөр амжилттай хийгдлээ!"
        );
      } catch (err) {
        console.error("🚫 User push илгээхэд алдаа:", err.message);
      }
    }

    if (invoice.freelancer?.deviceToken) {
      try {
        await sendNotification(
          [invoice.freelancer.deviceToken],
          `Таны хэтэвчинд ${freelancerAmount}₮ шилжүүллээ!`
        );
      } catch (err) {
        console.error("🚫 Freelancer push илгээхэд алдаа:", err.message);
      }
    }

    // Emit socket event
    io.emit("orderPaymentDone", {
      orderId: order._id,
      freelancerId: order.freelancer._id,
      userId: order.user._id,
      amount: invoice.amount,
      freelancerAmount: freelancerAmount,
      commissionAmount: commissionAmount,
      invoiceId: invoice.sender_invoice_id,
    });

    return res.status(200).json({
      success: true,
      message: "Захиалгын төлбөр амжилттай хийгдлээ",
      order: order,
      invoice: invoice,
      freelancerAmount: freelancerAmount,
      commissionAmount: commissionAmount,
      invoiceId: invoice.sender_invoice_id,
    });
  } catch (error) {
    console.error(
      "❌ Order Callback Error:",
      error.response?.data || error.message
    );
    return res.status(500).json({
      success: false,
      message: "Системийн алдаа",
      error: error.message,
    });
  }
});

// Get order payment status
exports.getOrderPaymentStatus = asyncHandler(async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    const invoice = await OrderInvoice.findOne({ order: req.params.id });

    return res.status(200).json({
      success: true,
      order: {
        id: order._id,
        status: order.status,
        paymentStatus: order.paymentStatus,
        amount: order.fixedPrice || order.hourlyRate,
      },
      invoice: invoice
        ? {
            status: invoice.status,
            sender_invoice_id: invoice.sender_invoice_id,
            qpay_invoice_id: invoice.qpay_invoice_id,
            price: invoice.price,
          }
        : null,
    });
  } catch (error) {
    console.error("❌ getOrderPaymentStatus error:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Get freelancer wallet balance
exports.getFreelancerWallet = asyncHandler(async (req, res) => {
  try {
    const freelancerId = req.params.freelancerId;

    const wallet = await Wallet.findOne({
      freelancerId: freelancerId,
    }).populate("freelancerId", "first_name last_name phone");

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Хэтэвч олдсонгүй",
      });
    }

    return res.status(200).json({
      success: true,
      wallet: {
        balance: wallet.balance,
        currency: wallet.currency,
        status: wallet.status,
        totalEarnings: wallet.totalEarnings,
        totalWithdrawals: wallet.totalWithdrawals,
        freelancer: wallet.freelancerId,
      },
    });
  } catch (error) {
    console.error("❌ getFreelancerWallet error:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});
