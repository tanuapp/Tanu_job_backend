const express = require("express");
const upload = require("../middleware/fileUpload");
const { protect } = require("../middleware/protect");
const { authorize }=require("../middleware/protect")
const {
  create,
  update,
  detail,
  findDelete,
  getAll,
} = require("../controller/categoryController");
const router = express.Router();
const { getCategorySortItem } = require("../controller/serviceController");
const {
  getCategorySortBySubCategory,
  userCompanySubCategory,
} = require("../controller/subcategoryController");

router.route("/").post(protect,authorize("admin"),upload.single("file"), create).get(getAll);

router
  .route("/:id")
  .put(protect,authorize("admin"),upload.single("file"), update)
  .delete(protect,authorize("admin"),findDelete)
  .get(detail);

router.route("/:category_id/item").get(getCategorySortItem);
router.route("/:categoryId/Subcategory").get(getCategorySortBySubCategory);
router.route("/userCompanySubCategory").post(userCompanySubCategory);

module.exports = router;
