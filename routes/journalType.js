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
} = require("../controller/journalType");

//"/api/v1/user"
// protect, authorize("admin"),  nemeh

router.route("/").get(getAll).post(upload.single("file"), create);

router
  .route("/:id")
  .get(get)
  .delete(deleteModel)
  .put(upload.single("file"), update);

module.exports = router;
