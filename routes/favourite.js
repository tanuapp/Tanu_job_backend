const express = require("express");
const { protect } = require("../middleware/protect");
const {
  getUserSavedCompany,
  removeCompany,
  saveCompany,
} = require("../controller/favourite");
const router = express.Router();

router
  .route("/")
  .post(protect, saveCompany)
  .get(protect, getUserSavedCompany)
  .put(protect, removeCompany);

module.exports = router;
