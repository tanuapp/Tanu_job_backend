const express = require("express");
const { protect } = require("../middleware/protect");
const {
  create,
  getAll,
  getByCompanyId,
  update,
  deleteModel,
} = require("../controller/employeeSchedule");
const router = express.Router();

router.route("/").post(protect, create).get(getAll);
router.get("/company/:companyId", getByCompanyId);

router.route("/:id").put(protect, update).delete(protect, deleteModel);

module.exports = router;
