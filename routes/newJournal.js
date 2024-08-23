const express = require("express");
const upload = require("../middleware/fileUpload");

const { createModel, getAllModel } = require("../controller/newJournal");
const router = express.Router();

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

// router.route("/:id").put(protect, update).delete(findDelete).get(detail);

// router.route("/:category_id/item").get(getCategorySortItem);

module.exports = router;
