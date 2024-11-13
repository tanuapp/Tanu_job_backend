const express = require("express");
const upload = require("../middleware/fileUpload");

const {
  createModel,
  getAllModel,
  deleteModel,
  getModel,
  viewsIncrement,
  updateModel,
} = require("../controller/journal");
const router = express.Router();

router.route("/views/:id").post(viewsIncrement);

router
  .route("/")
  .post(
    upload.fields([
      { name: "sliderImg", maxCount: 10 },
      { name: "bodyImg", maxCount: 10 },
      { name: "profile", maxCount: 1 },
      { name: "audio", maxCount: 1 },
    ]),
    createModel
  )
  .get(getAllModel);

router
  .route("/:id")
  .put(
    upload.fields([
      { name: "sliderImg", maxCount: 10 },
      { name: "bodyImg", maxCount: 10 },
      { name: "profile", maxCount: 1 },
      { name: "audio", maxCount: 1 },
    ]),
    updateModel
  )
  .delete(deleteModel)
  .get(getModel);

// router.route("/:category_id/item").get(getCategorySortItem);

module.exports = router;
