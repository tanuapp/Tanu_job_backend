const express = require("express");
const { protect, authorize } = require("../middleware/protect");

const {
  getAll,
  getByFreelancerId,
  getMyWallet,
  create,
  update,
  get,
  deleteModel,
  addTransaction,
  getTransactionHistory,
  topup,
  withdraw,
  getBalance,
  setBankInfo,
  updateBankInfo,
  removeBankInfo,
  updateStatus,
} = require("../controller/wallet");

const router = express.Router();

/**
 * 📌 Protected routes (JWT шаардана)
 */

// Get current user's wallet
router.route("/my").get(protect, getMyWallet);

// Get wallet balance
router.route("/my/balance").get(protect, getBalance);

// Set bank information (first time)
router.route("/my/bank").post(protect, setBankInfo);

// Update bank information
router.route("/my/bank").put(protect, updateBankInfo);

// Remove bank information
router.route("/my/bank").delete(protect, removeBankInfo);

// Top-up wallet
router.route("/my/topup").post(protect, topup);

// Withdraw money
router.route("/my/withdraw").post(protect, withdraw);

// Get transaction history
router.route("/my/transactions").get(protect, getTransactionHistory);

// Add transaction to wallet
router.route("/my/transactions").post(protect, addTransaction);

/**
 * 📌 Admin routes (admin эрх шаардана)
 */

// Get all wallets
router.route("/").get(protect, authorize(["admin"]), getAll);

// Create wallet
router.route("/").post(protect, authorize(["admin"]), create);

// Get wallet by freelancer ID
router.route("/freelancer/:freelancerId").get(protect, authorize(["admin"]), getByFreelancerId);

// Update wallet status
router.route("/:id/status").put(protect, authorize(["admin"]), updateStatus);

// Get wallet by ID
router.route("/:id").get(protect, authorize(["admin"]), get);

// Update wallet
router.route("/:id").put(protect, authorize(["admin"]), update);

// Delete wallet
router.route("/:id").delete(protect, authorize(["admin"]), deleteModel);

module.exports = router;
