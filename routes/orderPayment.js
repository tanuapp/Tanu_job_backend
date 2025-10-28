const express = require("express");
const router = express.Router();

// ✅ Correct import path (check that your controller filename matches exactly)
const orderPaymentController = require("../controller/orderPaymentController");

// ✅ Destructure only after verifying export exists
const {
  createOrderQpay,
  orderCallback,
  getOrderPaymentStatus,
  getFreelancerWallet,
} = orderPaymentController;

// ✅ Routes
// Create a new QPay invoice for an order
router.post("/create/:id", createOrderQpay);

// Callback endpoint (must be POST for QPay callback)
router.post("/callback/:id", orderCallback);

// Get order payment status
router.get("/status/:id", getOrderPaymentStatus);

// Get freelancer wallet balance
router.get("/wallet/:freelancerId", getFreelancerWallet);

// ✅ Export router
module.exports = router;
