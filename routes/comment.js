express = require("express");

const {
  createModel,
  deleteModel,
  getAllModel,
  getModel,
  updateModel,
  getCommentsByCompanyId,
  getCommentsByFreelancerId,
} = require("../controller/comment");
const router = express.Router();
router.route("/company/:id").get(getCommentsByCompanyId);
router.route("/freelancer/:id").get(getCommentsByFreelancerId);

router.route("/").post(createModel).get(getAllModel);
router.route("/:id").put(updateModel).delete(deleteModel).get(getModel);

module.exports = router;
