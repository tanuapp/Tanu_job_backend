const express = require("express");
const upload = require("../middleware/fileUpload");

const {
  create,
  addPage,
  getTopSeries,
  deleteModel,
  viewsIncrement,
  get,
  getAll,

  update,
} = require("../controller/series");
const router = express.Router();

router.route("/:id/add-page").post(
  upload.fields([
    { name: "sliderImg", maxCount: 10 },
    { name: "bodyImg", maxCount: 10 },
    { name: "profile", maxCount: 1 },
    { name: "audio", maxCount: 1 },
  ]),
  addPage
);

router.route("/top").get(getTopSeries);
router.route("/views/:id").post(viewsIncrement);
router.route("/").post(upload.single("file"), create).get(getAll);
router
  .route("/:id")
  .put(upload.single("file"), update)
  .delete(deleteModel)
  .get(get);

module.exports = router;
