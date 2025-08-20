const express = require("express");
const router = express.Router();
const ctrl = require("../controller/blackList");
const { protect } = require("../middleware/protect");

// Create
router.post("/", /* requireAuth, requireCompany, */ ctrl.createEntry);

// List (with filters & pagination)
router.get("/", /* requireAuth, */ ctrl.listEntries);

// Single
router.get("/:id", /* requireAuth, */  ctrl.getEntry);

// Update
router.patch(
  "/:id",
  /* requireAuth, requireCompany, */ protect,
  ctrl.updateEntry
);

// Delete
router.delete(
  "/:id",
  /* requireAuth, requireCompany, */ protect,
  ctrl.deleteEntry
);

// List by artist
router.get("/artist/:artistId", /* requireAuth, */ ctrl.listByArtist);

// Stats by artist
router.get("/stats/artist/:artistId", /* requireAuth, */ ctrl.statsByArtist);

module.exports = router;
