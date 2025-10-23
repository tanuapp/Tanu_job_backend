const express = require("express");
const router = express.Router();
const {
  createOrderQpay,
  orderCallback,
  getOrderPaymentStatus,
  getFreelancerWallet,
} = require("../controllers/orderPaymentController");

router.post("/create/:id", createOrderQpay);
router.get("/callback/:id", orderCallback);
router.get("/status/:id", getOrderPaymentStatus);
router.get("/wallet/:freelancerId", getFreelancerWallet);

module.exports = router;
