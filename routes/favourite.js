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
  .post(saveCompany)
  .get(protect, getUserSavedCompany)
  .put(removeCompany);

module.exports = router;
