const express = require("express");
const {
  getAll,
  accept,
  deny,
} = require("../controller/company_artist_request");
const router = express.Router();

router.route("/").post(getAll);

router.route("/:id/accept").post(accept);
router.route("/:id/deny").post(deny);

module.exports = router;
