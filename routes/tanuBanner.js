const express = require("express");
const upload = require("../middleware/fileUpload");

const {
  createModel,
  deleteModel,
  getAllModel,
  getModel,
  updateModel,
} = require("../controller/tanuBanner");
const router = express.Router();

router.route("/").post(upload.single("file"), createModel).get(getAllModel);
router
  .route("/:id")
  .put(upload.single("file"), updateModel)
  .delete(deleteModel)
  .get(getModel);

module.exports = router;
