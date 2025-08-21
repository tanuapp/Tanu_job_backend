const express = require("express");
const upload = require("../middleware/fileUpload");
const { protect } = require("../middleware/protect");
const { authorize } = require("../middleware/protect");
const {
  create,
  deleteModel,
  get,
  getAll,
  update,
  getcompany,
  getServicesByArtist,
  getServicesByIds,
  getDiscountedServices,
} = require("../controller/service");
const router = express.Router();

router
  .route("/")
  .post(protect, authorize("user admin"), upload.single("photo"), create)
  .get(getAll);

router.post("/filterByIds", getServicesByIds);
router.route("/company/:id").get(getcompany);
router.get("/discounted", getDiscountedServices);
router.post("/getcompany", protect, getServicesByArtist);
router
  .route("/:id")

  .put(protect, upload.single("photo"), update)
  .delete(protect, authorize("user admin"), deleteModel)
  .get(get);

module.exports = router;
