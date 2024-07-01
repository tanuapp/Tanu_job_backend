express = require("express");
const upload = require("../middleware/fileUpload");

const {
  create,
  update,
  detail,
  findDelete,
  getAll,
} = require("../controller/itemController");
const router = express.Router();
// const { getSubcategorySortItem } = require("../controller/serviceController");

// upload.single("file"),

router.route("/").post(upload.single("file"), create).get(getAll);
router
  .route("/:id")
  .put(upload.single("file"), update)
  .delete(findDelete)
  .get(detail);

// router.route("/:subcategory_id/item").get(getSubcategorySortItem);

module.exports = router;
