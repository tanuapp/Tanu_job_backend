const express = require("express");
const upload = require("../middleware/fileUpload");

const {
  createModel,
  deleteModel,
  getAllModel,
  getModel,
  updateModel,
  getBannerByFreelancer,
} = require("../controller/banner");
const router = express.Router();

router.route("/").post(upload.single("photo"), createModel).get(getAllModel);
router.route("/freelancer").get(getBannerByFreelancer);
router
  .route("/:id")
  .put(upload.single("photo"), updateModel)
  .delete(deleteModel)
  .get(getModel);

module.exports = router;
