const express = require("express");
const upload = require("../middleware/fileUpload");
const { protect } = require("../middleware/protect");
const { authorize } = require("../middleware/protect");
const {
  createModel,
  get,
  getAll,
  update,
  getBranchesByCode,
  getCompanyPopulate,
  generateBranchCode,
  deleteModel,
  addContract,
  updateUserFCM,
  clearFCM,
  getActiveCompanies,
} = require("../controller/company");
const router = express.Router();

// const isActive = false;s
router.route("/contract").post(upload.single("file"), addContract);
router.get("/active", getActiveCompanies);
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
router.post("/fcm/clear", protect, clearFCM);
router.post("/branch-code", generateBranchCode);
router.get("/branch-code/:branchCode", getBranchesByCode);
router.route("/fcm").post(protect, updateUserFCM);

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
