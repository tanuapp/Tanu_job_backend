const express = require("express");
const upload = require("../middleware/fileUpload");

const {
  create,
  update,
  detail,
  findDelete,
  getAll,
} = require("../controller/companyController");
const router = express.Router();

router.route("/").post(upload.single("file"), create).get(getAll);

router
  .route("/:id")
  .put(upload.single("file"), update)
  .delete(findDelete)
  .get(detail);


module.exports = router;
