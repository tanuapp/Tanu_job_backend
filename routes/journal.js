const express = require("express");
const upload = require("../middleware/fileUpload");

const { protect, authorize } = require("../middleware/protect");
const router = express.Router();
const {
  create,
  deleteModel,
  get,
  getAll,
  update,
} = require("../controller/journal");

//"/api/v1/user"
// protect, authorize("admin"),  nemeh

router
  .route("/")
  .get(getAll)
  .post(
    upload.fields([
      { name: "fileURL", maxCount: 1 },
      { name: "photo", maxCount: 1 },
    ]),
    create
  );

router.route("/:id").get(get).delete(deleteModel).put(update);

module.exports = router;
