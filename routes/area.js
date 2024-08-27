express = require("express");

const {
  createModel,
  deleteModel,
  getAllModel,
  getModel,
  generateHoroo,
  generateSum,
  updateModel,
} = require("../controller/area");
const router = express.Router();

router.route("/sum").post(generateSum);
router.route("/generate").post(generateHoroo);
router.route("/").post(createModel).get(getAllModel);
router.route("/:id").put(updateModel).delete(deleteModel).get(getModel);

module.exports = router;
