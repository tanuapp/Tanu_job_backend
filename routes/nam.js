express = require("express");

const {
  createModel,
  deleteModel,
  getAllModel,
  getModel,
  updateModel,
  generateNam,
} = require("../controller/nam");
const router = express.Router();

router.route("/generate").post(generateNam);
router.route("/").post(createModel).get(getAllModel);
router.route("/:id").put(updateModel).delete(deleteModel).get(getModel);

module.exports = router;
