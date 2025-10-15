const express = require("express");
const { protect } = require("../middleware/protect");

const {
  createOrder,
  assignProvider,
  acceptOrder,
  declineOrder,
  updateStatus,
  getMyOrders,
  getAllModel,
  getNearbyFreelancers,
  getOrderByIds,
} = require("../controller/order");

const router = express.Router();

// POST = create, GET = all orders

router.post("/:orderId/assign", protect, assignProvider);
router.post("/:orderId/accept", protect, acceptOrder);
router.post("/:orderId/decline", protect, declineOrder);
router.patch("/:orderId/status", protect, updateStatus);
router.get("/:orderId/", getOrderByIds);
router.get("/me", protect, getMyOrders);
router.get("/nearby", getNearbyFreelancers);
router.post("/call/:id", protect, sendCallNotification);
router.route("/").post(protect, createOrder).get(getAllModel);

module.exports = router;
