const express = require("express");
const { protect } = require("../middleware/protect");
const {
  create,
  get,
  getAll,
  getAllPopulated,
  update,
  deleteModel,
  declineAppointment,
  getAvailableTimes,
} = require("../controller/appointment");
const router = express.Router();

router.route("/decline/:id").post(declineAppointment);
router.route("/available").post(getAvailableTimes);
router.route("/populated").get(getAllPopulated);
router.route("/").post(protect, create).get(getAll);

router.route("/:id").put(protect, update).delete(protect, deleteModel).get(get);

module.exports = router;
