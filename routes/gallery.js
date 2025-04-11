express = require("express");
const upload = require("../middleware/fileUpload");

const {
  createModel,
  deleteModel,
  getAllModel,
  getModel,
  updateModel,
} = require("../controller/gallery");
const router = express.Router();

router.route("/").post(upload.fields([

  { name: "gallery", maxCount: 10 },

]),createModel)


router.route("/:id").put(upload.fields([

  { name: "gallery", maxCount: 10 },
  
]),updateModel).delete(deleteModel).get(getAllModel);

module.exports = router;
