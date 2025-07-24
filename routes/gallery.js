express = require("express");
const upload = require("../middleware/fileUpload");

const {
  createModel,
  getAllModel,
  deletePhoto ,
  updateModel,
} = require("../controller/gallery");
const router = express.Router();

router
  .route("/")
  .post(upload.fields([{ name: "gallery", maxCount: 20 }]), createModel)
  .get(getAllModel);

router
  .route("/:id")
  .put(upload.fields([{ name: "gallery", maxCount: 20 }]), updateModel)
  .get(getAllModel);
router.delete("/:id/:filename", deletePhoto);
module.exports = router;
