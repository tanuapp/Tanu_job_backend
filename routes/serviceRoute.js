const express = require("express");
const upload = require("../middleware/fileUpload");
const { protect } = require("../middleware/protect");
const {
  create,
  update,
  detail,
  findDelete,
  getAll,
} = require("../controller/serviceController");
const {
  myService,
  serviceSortByArtist,
} = require("../controller/artistController");

const router = express.Router();

const cpUploads = upload.fields([
  { name: "files", maxCount: 16 },
  { name: "logo" },
]);

router.route("/").post(protect, upload.single("file"), create).get(getAll);
router.route("/myService").get(protect, myService);
router
  .route("/:id")
  .put(upload.single("file"), update)
  .delete(findDelete)
  .get(detail);
router.route("/:id/artist").get(serviceSortByArtist);

// router.route("/:user_id").get( protect , userService);
module.exports = router;
