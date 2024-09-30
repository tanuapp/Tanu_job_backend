const express = require("express");
const upload = require("../middleware/fileUpload");
const { protect } = require("../middleware/protect");
const { authorize } = require("../middleware/protect");
const {
  create,
  deleteModel,
  get,
  getAll,
  update,
} = require("../controller/dayoff");
const router = express.Router();

router.route("/").post(protect, create).get(getAll);

router.route("/:id").put(protect, update).delete(protect, deleteModel).get(get);

module.exports = router;
