const express = require("express");
const { protect } = require("../middleware/protect");
const {
  create,
  get,
  getAll,
  update,
  deleteModel,
} = require("../controller/calendar");
const router = express.Router();

router.route("/").post(protect, create).get(getAll);

router.route("/:id").put(protect, update).delete(protect, deleteModel).get(get);

module.exports = router;
