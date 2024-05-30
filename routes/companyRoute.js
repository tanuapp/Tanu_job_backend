const express = require("express");
const upload = require("../middleware/fileUpload");
const { protect } = require("../middleware/protect");
const {
  create,
  update,
  detail,
  findDelete,
  getAll,
  getUserCompany,
} = require("../controller/companyController");
const router = express.Router();
const {
  sortByArtist,
  getArtistCompany,
} = require("../controller/artistController");
const {
  postCompanyService,
  getCompanyService,
} = require("../controller/serviceController");
const cpUploads = upload.fields([
  { name: "files", maxCount: 10 },
  { name: "logo" },
]);
const {
  getCompanySubCategory,
} = require("../controller/subcategoryController");
router.route("/").post(protect, upload.single("file"), create).get(getAll);
router.route("/:companyId/artistSorted").get(sortByArtist);

router
  .route("/:id")
  .put(protect, upload.single("file"), update)
  .delete(protect, findDelete)
  .get(detail);
router.route("/getCompanyUser").post(protect, getUserCompany);
router.route("/getArtistCompany").post(protect, getArtistCompany);
router.route("/getCompanyService").post(protect, postCompanyService);
router.route("/:companyid/service").get(getCompanyService);
router.route("/getCompanySubCategory").post(protect, getCompanySubCategory);
module.exports = router;
