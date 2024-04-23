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
router.route("/").post(protect, upload.single("file"), create).get(getAll);
router.route("/:companyId/artistSorted").get(sortByArtist);

router
  .route("/:id")
  .put(protect, upload.single("file"), update)
  .delete(protect, findDelete)
  .get(detail);
router.route("/getCompanyUser").post(protect, getUserCompany);
router.route("/getArtistCompany").post(protect, getArtistCompany);
module.exports = router;
