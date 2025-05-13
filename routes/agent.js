const express = require("express");
const upload = require("../middleware/fileUpload");
const {
  create,
  deleteModel,
  get,
  getAll,
  update,
} = require("../controller/agent");
const router = express.Router();

router.route("/").post(create).get(getAll);

router.route("/:id").put(update).delete(deleteModel).get(get);

module.exports = router;
