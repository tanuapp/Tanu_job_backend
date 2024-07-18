const Model = require("../models/journalType");
const Journal = require("../models/journal");
const asyncHandler = require("../middleware/asyncHandler");
const mongoose = require("mongoose");

exports.getAll = asyncHandler(async (req, res, next) => {
  try {
    const all = await Model.find();
    const total = await Model.countDocuments();
    res.status(200).json({
      success: true,
      count: total,
      data: all,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.get = asyncHandler(async (req, res, next) => {
  try {
    let single = await Model.findById(req.params.id);
    res.status(200).json({
      success: true,
      data: single,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.create = asyncHandler(async (req, res, next) => {
  try {
    const body = {
      ...req.body,
      photo: req.file ? req.file.filename : "",
    };
    const { journal } = req.body;

    // Find the journal by ID
    const jour = await Journal.findById(journal);
    if (!jour) {
      return res.status(400).json({
        success: false,
        msg: "Baihgui bn",
      });
    }

    const create = await Model.create(body);
    jour.journalType.push(create._id);

    // Save the updated journal
    await jour.save();
    res.status(200).json({
      success: true,
      data: create,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.update = asyncHandler(async (req, res, next) => {
  try {
    const old = await Model.findById(req.params.id);
    const body = {
      ...req.body,
      photo: req.file ? req.file.filename : old.photo,
    };

    const update = await Model.findByIdAndUpdate(req.params.id, body);
    res.status(200).json({
      success: true,
      data: update,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
exports.deleteModel = asyncHandler(async (req, res, next) => {
  try {
    const del = await Model.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      data: del,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
