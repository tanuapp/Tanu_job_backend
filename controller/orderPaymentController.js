const asyncHandler = require("../middleware/asyncHandler.js");
const OrderInvoice = require("../models/orderInvoice.js");
const Order = require("../models/order.js");
const Wallet = require("../models/wallet.js");
const qpay = require("../middleware/qpay");
const { sendNotification } = require("../utils/apnService.js");
const axios = require("axios");
const mongoose = require("mongoose");

exports.createOrderQpay = asyncHandler(async (req, res) => {
  console.log("🟢 [START createOrderQpay] Order ID:", req.params.id);

  try {
    const qpay_token = await qpay.makeRequest();
    console.log("✅ QPay token received");

    // 🔍 Find the order with full population
    const order = await Order.findById(req.params.id)
      .populate({
        path: "user",
        model: "Customer",
        select: "first_name last_name phone",
      })
      .populate({
        path: "freelancer",
        model: "Freelancer",
        select: "first_name last_name phone",
      })
      .populate({
        path: "service",
        model: "Service",
        select: "serviceName price hourlyRate",
      });

    if (!order) {
      console.log("❌ Order not found:", req.params.id);
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    console.log("📦 Order found:", order._id, "User:", order.user?._id);

    // 🧮 Calculate total amount (sum of all services)
    const totalAmount = order.price;
    if (!totalAmount || totalAmount <= 0) {
      console.log("❌ Invalid order amount:", totalAmount);
      return res
        .status(400)
        .json({ success: false, message: "Invalid order amount" });
    }

    console.log("💰 Order amount:", totalAmount);
    console.log("🔍 Order.user:", order.user);

    // 🔍 Check existing invoice
    let invoice = await OrderInvoice.findOne({ order: order._id });

    if (!invoice) {
      console.log("📄 Creating new invoice");

      const rawOrder = await Order.findById(req.params.id).lean();
      console.log("🧾 Raw Order:", rawOrder);

      const userId = rawOrder.user || rawOrder.customer;
      if (!userId) {
        throw new Error("Order has no user or customer field");
      }

      invoice = await OrderInvoice.create({
        order: rawOrder._id,
        user: userId,
        freelancer: rawOrder.freelancer,
        service: Array.isArray(rawOrder.service) ? rawOrder.service : [],
        amount: rawOrder.price,
        price: rawOrder.price,
        discount: rawOrder.discount || 0,
        status: "pending",
      });

      console.log("✅ Invoice created:", invoice._id);
    } else {
      console.log(
        "📄 Existing invoice found:",
        invoice._id,
        "Status:",
        invoice.status
      );
    }

    if (invoice.status === "paid") {
      return res
        .status(400)
        .json({ success: false, message: "Invoice already paid" });
    }

    // 🧾 Create QPay invoice payload
    const currentDateTime = new Date();
    const randomToo = Math.floor(Math.random() * 99999);
    const sender_invoice_no = `ORDER-${currentDateTime
      .toISOString()
      .replace(/[:.]/g, "-")}-${randomToo}`;

    const serviceNames =
      Array.isArray(order.service) && order.service.length > 0
        ? order.service.map((s) => s.serviceName).join(", ")
        : "Үйлчилгээ";

    const invoicePayload = {
      invoice_code: process.env.invoice_code,
      sender_invoice_no,
      sender_branch_code: "ORDER_BRANCH",
      invoice_receiver_code: "terminal",
      invoice_receiver_data: {
        phone: `${order.user?.phone || ""}`,
        name: `${order.user?.first_name || ""} ${order.user?.last_name || ""}`,
      },
      invoice_description: `${serviceNames}_ЗАХИАЛГА`,
      callback_url: `${process.env.callback_url}order/${sender_invoice_no}`,
      lines: [
        {
          tax_product_code: `ORDER-${randomToo}`,
          line_description: `${serviceNames} үйлчилгээ`,
          line_quantity: 1,
          line_unit_price: totalAmount,
        },
      ],
    };

    console.log("📤 Sending QPay Invoice...");
    console.log(
      "🔗 Callback URL:",
      `${process.env.callback_url}order/${sender_invoice_no}`
    );

    const response = await axios.post(
      `${process.env.qpayUrl}invoice`,
      invoicePayload,
      {
        headers: { Authorization: `Bearer ${qpay_token.access_token}` },
      }
    );

    if (response.status === 200) {
      invoice.sender_invoice_id = sender_invoice_no;
      invoice.qpay_invoice_id = response.data.invoice_id;
      invoice.status = "pending";
      await invoice.save();

      console.log("✅ QPay invoice created:", response.data.invoice_id);

      return res.status(200).json({
        success: true,
        message: "QPay invoice created successfully",
        invoice,
        qpay: response.data,
        order: {
          id: order._id,
          amount: totalAmount,
          serviceNames,
        },
      });
    } else {
      console.log("❌ QPay returned non-200:", response.status);
      return res.status(500).json({
        success: false,
        message: "QPay responded with error",
        data: response.data,
      });
    }
  } catch (error) {
    console.error("❌ createOrderQpay error:", error.message);
    console.error("📦 Error details:", error.response?.data || error.stack);
    return res.status(500).json({ success: false, error: error.message });
  }
});

exports.orderCallback = asyncHandler(async (req, res) => {
  const senderInvoiceId = req.params.id;

  console.log("🎯 CALLBACK HIT! Invoice ID:", senderInvoiceId);
  console.log("📦 Callback Body:", req.body);
  console.log("🔗 Headers:", req.headers);
  console.log("⏰ Time:", new Date().toISOString());

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const io = req.app.get("io");
    console.log("✅ WebSocket io object:", io ? "Found" : "Missing");

    const qpay_token = await qpay.makeRequest();
    const qpayAccessToken = qpay_token?.access_token;
    console.log("🔑 QPay Token:", qpayAccessToken ? "Received" : "Missing");

    if (!qpayAccessToken) {
      await session.abortTransaction();
      return res
        .status(500)
        .json({ success: false, message: "QPay токен олдсонгүй" });
    }

    // Find invoice by sender_invoice_id
    console.log(
      "🔍 Looking for invoice with sender_invoice_id:",
      senderInvoiceId
    );
    const invoice = await OrderInvoice.findOne({
      sender_invoice_id: senderInvoiceId,
    })
      .populate("order")
      .populate("users", "first_name last_name phone", "Customer")

      .populate("freelancer", "first_name last_name deviceToken", "Freelancer")
      .session(session);

    if (!invoice) {
      console.log(
        "❌ Invoice not found for sender_invoice_id:",
        senderInvoiceId
      );
      await session.abortTransaction();
      return res
        .status(404)
        .json({ success: false, message: "Invoice not found" });
    }

    console.log("📄 Invoice found:", invoice._id);
    console.log("💰 Current invoice status:", invoice.status);
    console.log("🆔 QPay Invoice ID:", invoice.qpay_invoice_id);

    if (invoice.status === "paid") {
      console.log("✅ Invoice already paid, skipping...");
      await session.abortTransaction();
      return res.status(200).json({
        success: true,
        message: "Төлбөр аль хэдийн хийгдсэн байна",
        order: invoice.order,
      });
    }

    // Check payment status with QPay
    console.log("🔍 Checking payment status with QPay...");
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

    console.log(
      "💰 QPay Check Response:",
      JSON.stringify(checkResponse.data, null, 2)
    );

    const isPaid =
      checkResponse.data.count >= 1 &&
      checkResponse.data.rows[0]?.payment_status === "PAID";

    console.log("✅ Payment Status:", isPaid ? "PAID" : "NOT PAID");

    if (!isPaid) {
      console.log("❌ Төлбөр хийгдээгүй байна.");

      // Update invoice status to failed
      invoice.status = "failed";
      await invoice.save({ session });
      await session.commitTransaction();

      return res.status(402).json({
        success: false,
        message: "Төлбөр амжилттай хийгдээгүй байна",
      });
    }

    // Update order status
    console.log("🔍 Finding order:", invoice.order._id);
    const order = await Order.findById(invoice.order._id).session(session);
    if (!order) {
      console.log("❌ Order not found:", invoice.order._id);
      await session.abortTransaction();
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    console.log("📦 Order found:", order._id, "Current status:", order.status);

    // Mark invoice as paid
    invoice.status = "paid";
    invoice.paidAt = new Date();
    await invoice.save({ session });
    console.log("✅ Invoice marked as paid");

    // Update order status
    order.status = "paid";
    order.paymentStatus = "completed";
    order.paidAt = new Date();
    await order.save({ session });
    console.log("✅ Order marked as paid");

    // 💰 Add money to freelancer's wallet
    const commissionRate = 0.1; // 10% commission
    const freelancerAmount = Math.round(invoice.amount * (1 - commissionRate));
    const commissionAmount = invoice.amount - freelancerAmount;

    console.log("💰 Payment breakdown:");
    console.log("   Total:", invoice.amount);
    console.log("   Freelancer:", freelancerAmount);
    console.log("   Commission:", commissionAmount);

    // Find or create freelancer's wallet
    let freelancerWallet = await Wallet.findOne({
      freelancerId: invoice.freelancer._id,
    }).session(session);

    if (!freelancerWallet) {
      console.log(
        "👛 Creating new wallet for freelancer:",
        invoice.freelancer._id
      );
      freelancerWallet = await Wallet.create(
        [
          {
            freelancerId: invoice.freelancer._id,
            balance: 0,
            currency: "MNT",
            status: "active",
            isActive: true,
          },
        ],
        { session }
      );
      freelancerWallet = freelancerWallet[0];
    } else {
      console.log("👛 Existing wallet found:", freelancerWallet._id);
    }

    // Add transaction to freelancer's wallet for the payment
    const transactionData = {
      type: "credit",
      amount: freelancerAmount,
      description: `Захиалга #${order._id}`,
      appointmentId: order._id,
      invoiceId: invoice._id,
      status: "completed",
    };

    await freelancerWallet.addTransaction(transactionData, { session });

    // Add commission transaction separately
    const commissionTransactionData = {
      type: "commission",
      amount: commissionAmount,
      description: `Захиалга #${order._id} - Коммисс`,
      appointmentId: order._id,
      invoiceId: invoice._id,
      status: "completed",
    };

    await freelancerWallet.addTransaction(commissionTransactionData, {
      session,
    });

    console.log(`✅ ${freelancerAmount}₮ added to freelancer's wallet`);
    console.log(`💰 ${commissionAmount}₮ commission deducted`);

    // Commit transaction
    await session.commitTransaction();
    console.log("✅ Database transaction committed successfully");

    // Send notifications (outside transaction)
    if (invoice.user?.deviceToken) {
      try {
        await sendNotification(
          [invoice.user.deviceToken],
          "Таны захиалгын төлбөр амжилттай хийгдлээ!"
        );
        console.log("📱 User notification sent");
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
        console.log("📱 Freelancer notification sent");
      } catch (err) {
        console.error("🚫 Freelancer push илгээхэд алдаа:", err.message);
      }
    }

    // Emit socket event
    if (io) {
      io.emit("orderPaymentDone", {
        orderId: order._id,
        freelancerId: order.freelancer._id,
        userId: order.user._id,
        amount: invoice.amount,
        freelancerAmount: freelancerAmount,
        commissionAmount: commissionAmount,
        invoiceId: invoice.sender_invoice_id,
      });
      console.log("📡 Socket event emitted");
    }

    console.log("🎉 Payment process completed successfully");

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
    console.error("❌ Order Callback Error:", error.message);
    console.error("📦 Error details:", error.response?.data || error.stack);

    await session.abortTransaction();

    return res.status(500).json({
      success: false,
      message: "Системийн алдаа",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
});

// Get order payment status
exports.getOrderPaymentStatus = asyncHandler(async (req, res) => {
  try {
    console.log("🔍 Getting payment status for order:", req.params.id);

    const order = await Order.findById(req.params.id);

    if (!order) {
      console.log("❌ Order not found:", req.params.id);
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    const invoice = await OrderInvoice.findOne({ order: req.params.id });

    console.log(
      "📊 Payment status - Order:",
      order.status,
      "Invoice:",
      invoice?.status
    );

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
    console.log("🔍 Getting wallet for freelancer:", freelancerId);

    const wallet = await Wallet.findOne({
      freelancerId: freelancerId,
    }).populate("freelancerId", "first_name last_name phone");

    if (!wallet) {
      console.log("❌ Wallet not found for freelancer:", freelancerId);
      return res.status(404).json({
        success: false,
        message: "Хэтэвч олдсонгүй",
      });
    }

    console.log("💰 Wallet balance:", wallet.balance);

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
