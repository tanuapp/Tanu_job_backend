const express = require("express");
const { protect } = require("../middleware/protect");
const {
  create,
  get,
  getByCompanyId,
  update,
  deleteModel,
} = require("../controller/employeeSchedule");
const router = express.Router();

router.route("/").post(protect, create).get(getByCompanyId);

router
  .route("/:id")
  .put(protect, update)
  .delete(protect, deleteModel)
  .get(getByCompanyId);

module.exports = router;
