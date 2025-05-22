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
  deleteSliderImage,
} = require("../controller/company");
const router = express.Router();

// const isActive = false;s

router.route("/contract").post(upload.single("file"), addContract);

router
  .route("/")
  .post(
    upload.fields([
      { name: "logo", maxCount: 1 },
      { name: "sliderImages", maxCount: 8 },
      { name: "gallery", maxCount: 10 },
    ]),
    createModel
  )
  .get(getAll);

router
  .route("/:id")
  .put(
    // isActive && protect,
    // isActive && authorize("admin"),
    upload.fields([
      { name: "logo", maxCount: 1 },
      { name: "sliderImages", maxCount: 10 },
      { name: "gallery", maxCount: 10 },
    ]),
    update
  )
  .delete(
    // isActive && protect, isActive && authorize("admin"),
    deleteModel
   
  )
  
  .get(getCompanyPopulate);

// router.delete("/company/:companyId/banner/:bannerName", deleteSliderImage);

module.exports = router;
