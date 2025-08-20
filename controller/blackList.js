// controllers/blacklist.controller.js
const mongoose = require("mongoose");
const BlacklistEntry = require("../models/blackList");

// Small helper
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

exports.createEntry = async (req, res) => {
  try {
    const {
      artistId,
      reportedByCompanyId,
      reasonCode = "other",
      reasonText,
      incidentDate,
      evidences,
      visibility = "public",
      severity = 3,
      repeatCount = 1,
    } = req.body;

    if (!artistId || !reportedByCompanyId || !reasonText) {
      return res.status(400).json({
        success: false,
        message: "artistId, reportedByCompanyId, reasonText заавал.",
      });
    }

    const doc = await BlacklistEntry.create({
      artistId,
      reportedByCompanyId,
      reasonCode,
      reasonText,
      incidentDate: incidentDate ? new Date(incidentDate) : undefined,
      evidences,
      visibility,
      severity,
      repeatCount,
    });

    await doc.populate([
      {
        path: "artistId",
        select: "first_name last_name nick_name phone idNumber photo",
      },
      { path: "reportedByCompanyId", select: "name" },
    ]);

    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
};

// GET /blacklist  — list with filters & pagination
exports.listEntries = async (req, res) => {
  try {
    const {
      artistId,
      companyId, // reportedByCompanyId
      visibility,
      reasonCode,
      minSeverity,
      maxSeverity,
      minRepeat,
      fromDate,
      toDate,
      q, // search in reasonText
      page = 1,
      limit = 20,
      sort = "-createdAt",
    } = req.query;

    const filter = {};

    if (artistId && isValidId(artistId)) filter.artistId = artistId;
    if (companyId && isValidId(companyId))
      filter.reportedByCompanyId = companyId;
    if (visibility) filter.visibility = visibility;
    if (reasonCode) filter.reasonCode = reasonCode;

    // numeric ranges
    if (minSeverity || maxSeverity) {
      filter.severity = {};
      if (minSeverity) filter.severity.$gte = Number(minSeverity);
      if (maxSeverity) filter.severity.$lte = Number(maxSeverity);
    }
    if (minRepeat) filter.repeatCount = { $gte: Number(minRepeat) };

    // date range
    if (fromDate || toDate) {
      filter.incidentDate = {};
      if (fromDate) filter.incidentDate.$gte = new Date(fromDate);
      if (toDate) filter.incidentDate.$lte = new Date(toDate);
    }

    // text search
    if (q) {
      filter.reasonText = { $regex: q, $options: "i" };
    }

    const pageNum = Math.max(1, Number(page));
    const perPage = Math.min(100, Math.max(1, Number(limit)));

    const [items, total] = await Promise.all([
      BlacklistEntry.find(filter)
        .sort(sort)
        .skip((pageNum - 1) * perPage)
        .limit(perPage)
        .populate(
          "artistId",
          "first_name last_name nick_name phone idNumber photo"
        )
        .populate("reportedByCompanyId", "name")
        .lean(),
      BlacklistEntry.countDocuments(filter),
    ]);

    res.json({
      success: true,
      page: pageNum,
      limit: perPage,
      total,
      data: items,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /blacklist/:id  — single
exports.getEntry = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id))
      return res.status(400).json({ success: false, message: "Invalid id" });

    const item = await BlacklistEntry.findById(id)
      .populate(
        "artistId",
        "first_name last_name nick_name phone idNumber photo"
      )
      .populate("reportedByCompanyId", "name");

    if (!item) {
      return res.status(404).json({ success: false, message: "Not found" });
    }
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /blacklist/:id  — update allowed fields
exports.updateEntry = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id))
      return res.status(400).json({ success: false, message: "Invalid id" });

    const allowed = [
      "reasonCode",
      "reasonText",
      "incidentDate",
      "evidences",
      "visibility",
      "severity",
      "repeatCount",
    ];

    const update = {};
    for (const k of allowed) {
      if (k in req.body) update[k] = req.body[k];
    }

    const updated = await BlacklistEntry.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    })
      .populate(
        "artistId",
        "first_name last_name nick_name phone idNumber photo"
      )
      .populate("reportedByCompanyId", "name");

    if (!updated) {
      return res.status(404).json({ success: false, message: "Not found" });
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /blacklist/:id  — hard delete (or soft, if you add a flag)
exports.deleteEntry = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id))
      return res.status(400).json({ success: false, message: "Invalid id" });

    const deleted = await BlacklistEntry.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Not found" });
    }
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /blacklist/artist/:artistId  — entries for one artist
exports.listByArtist = async (req, res) => {
  try {
    const { artistId } = req.params;
    if (!isValidId(artistId))
      return res
        .status(400)
        .json({ success: false, message: "Invalid artistId" });

    const {
      visibility, // optional filter override
      page = 1,
      limit = 20,
      sort = "-incidentDate",
    } = req.query;

    const filter = { artistId };
    if (visibility) filter.visibility = visibility;

    const pageNum = Math.max(1, Number(page));
    const perPage = Math.min(100, Math.max(1, Number(limit)));

    const [items, total] = await Promise.all([
      BlacklistEntry.find(filter)
        .sort(sort)
        .skip((pageNum - 1) * perPage)
        .limit(perPage)
        .populate(
          "artistId",
          "first_name last_name nick_name phone idNumber photo"
        )
        .populate("reportedByCompanyId", "name")
        .lean(),
      BlacklistEntry.countDocuments(filter),
    ]);

    res.json({
      success: true,
      page: pageNum,
      limit: perPage,
      total,
      data: items,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /blacklist/stats/artist/:artistId  — quick stats
exports.statsByArtist = async (req, res) => {
  try {
    const { artistId } = req.params;
    if (!isValidId(artistId))
      return res
        .status(400)
        .json({ success: false, message: "Invalid artistId" });

    const pipeline = [
      { $match: { artistId: new mongoose.Types.ObjectId(artistId) } },
      {
        $group: {
          _id: "$artistId",
          totalEntries: { $sum: 1 },
          avgSeverity: { $avg: "$severity" },
          lastIncident: { $max: "$incidentDate" },
        },
      },
    ];

    const agg = await BlacklistEntry.aggregate(pipeline);
    const stats = agg[0] || {
      _id: artistId,
      totalEntries: 0,
      avgSeverity: null,
      lastIncident: null,
    };

    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
