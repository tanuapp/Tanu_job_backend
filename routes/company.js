const express = require("express");
const upload = require("../middleware/fileUpload");
const { protect } = require("../middleware/protect");
const { authorize } = require("../middleware/protect");
const {
  createModel,
  get,
  getAll,
  update,
  getAllPopulated,
  getCompanyPopulate,
  getCompanyBanner,
  deleteModel,
  addContract,
} = require("../controller/company");
const router = express.Router();

// const isActive = false;s

router.route("/contract").post(upload.single("file"), addContract);

router
  .route("/")
  .post(
    upload.fields([
      { name: "logo", maxCount: 1 },
      { name: "sliderIMG", maxCount: 8 },
    ]),
    createModel
  )
  .get(protect, getAll);

router
  .route("/:id")
  .put(
    // isActive && protect,
    // isActive && authorize("admin"),
    upload.fields([
      { name: "logo", maxCount: 1 },
      { name: "sliderIMG", maxCount: 8 },
    ]),
    update
  )
  .delete(
    // isActive && protect, isActive && authorize("admin"),
    deleteModel
  )
  .get(protect,getCompanyPopulate);

module.exports = router;
