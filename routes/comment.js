express = require("express");

const {
  createModel,
  deleteModel,
  getAllModel,
  getModel,
  updateModel,
  getCommentsByCompanyId,
} = require("../controller/comment");
const router = express.Router();
router.route("/company/:id").get(getCommentsByCompanyId);

router.route("/").post(createModel).get(getAllModel);
router.route("/:id").put(updateModel).delete(deleteModel).get(getModel);

module.exports = router;
