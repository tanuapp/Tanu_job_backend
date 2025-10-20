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
  sendCallToFreelancer,
  sendCallToCustomer,
} = require("../controller/order");

const router = express.Router();

// ✅ STATIC ROUTES FIRST
router.get("/nearby", getNearbyFreelancers);
router.get("/me", protect, getMyOrders);
router.post("/call/freelancer/:id", protect, sendCallToFreelancer);
router.post("/call/customer/:id", protect, sendCallToCustomer);

// ✅ DYNAMIC ROUTES AFTER
router.post("/:orderId/assign", protect, assignProvider);
router.post("/:orderId/accept", protect, acceptOrder);
router.post("/:orderId/decline", protect, declineOrder);
router.patch("/:orderId/status", protect, updateStatus);
router.get("/:orderId", getOrderByIds);

// ✅ ROOT ROUTE LAST
router.route("/").post(protect, createOrder).get(getAllModel);

module.exports = router;
