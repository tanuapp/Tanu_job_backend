const express = require("express");
const { protect } = require("../middleware/protect");

const {
  createOrder,
  assignProvider,
  acceptOrder,
  declineOrder,
  updateStatus,
  getMyOrders,
} = require("../controller/order");

const router = express.Router();

router.post("/", protect, createOrder);
router.post("/:orderId/assign", protect, assignProvider);
router.post("/:orderId/accept", protect, acceptOrder);
router.post("/:orderId/decline", protect, declineOrder);
router.patch("/:orderId/status", protect, updateStatus);
router.get("/me", protect, getMyOrders);

module.exports = router;
