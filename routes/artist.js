const express = require("express");
const upload = require("../middleware/fileUpload");
const { protect } = require("../middleware/protect");
const { authorize } = require("../middleware/protect");
const {
  Login,
  create,
  deleteModel,
  getArtistServices,
  get,
  getAll,
  update,
} = require("../controller/artist");
const router = express.Router();

router.route("/getArtistServices/:id").get(getArtistServices);

router.route("/login").post(Login);

router.route("/").post(upload.single("file"), create).get(getAll);

router
  .route("/:id")
  .put(protect, authorize("user"), upload.single("file"), update)
  .delete(protect, authorize("user"), deleteModel)
  .get(get);

module.exports = router;
