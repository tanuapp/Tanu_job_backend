express = require("express");
const upload = require("../middleware/fileUpload");

const {
  createModel,
  deleteModel,
  getAllModel,
  getModel,
  generateHoroo,
  generateSum,
  updateModel,
} = require("../controller/subdistrict");
const router = express.Router();

router.route("/sum").get(generateSum);
router.route("/").post(createModel).get(getAllModel);
router.route("/:id").put(updateModel).delete(deleteModel).get(getModel);

module.exports = router;
