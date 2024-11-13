const express = require("express");
const upload = require("../middleware/fileUpload");

const {
  create,
  deleteModel,
  get,
  getAll,
  update,
} = require("../controller/series");
const router = express.Router();

router.route("/").post(upload.single("file"), create).get(getAll);
router
  .route("/:id")
  .put(upload.single("file"), update)
  .delete(deleteModel)
  .get(get);

module.exports = router;
