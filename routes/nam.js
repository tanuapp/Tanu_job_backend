const express = require("express");
const upload = require("../middleware/fileUpload");
const {
  createModel,
  deleteModel,
  getAllModel,
  getModel,
  updateModel,
  generateNam,
} = require("../controller/nam");
const router = express.Router();

router.route("/generate").post(generateNam);
router.route("/").post(createModel).get(getAllModel);
router
  .route("/:id")
  .put(upload.single("file"), updateModel)
  .delete(deleteModel)
  .get(getModel);

module.exports = router;
