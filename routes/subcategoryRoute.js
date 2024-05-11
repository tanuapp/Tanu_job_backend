express = require("express");
const upload = require("../middleware/fileUpload");
const { protect } = require("../middleware/protect");
const {
  create,
  update,
  detail,
  findDelete,
  getAll,
} = require("../controller/subcategoryController");
const router = express.Router();
const {
  getSubcategorySortItem,
  getSubCategoryByService,
} = require("../controller/serviceController");
const { getSubCategoryByCompany } = require("../controller/companyController");
// upload.single("file"),
const cpUploads = upload.fields([{ name: "files", maxCount: 10 }]);
router.route("/").post(protect, cpUploads, create).get(getAll);
router
  .route("/:id")
  .put(upload.single("file"), update)
  .delete(findDelete)
  .get(detail);

router.route("/:subcategory_id/item").get(getSubcategorySortItem);
router.route("/:subcategory_id/company").post(getSubCategoryByCompany);
router.route("/:subcategory_id/service").get(getSubCategoryByService);

module.exports = router;
