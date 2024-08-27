const Model = require("../models/district");
const asyncHandler = require("../middleware/asyncHandler");

exports.getAllModel = asyncHandler(async (req, res, next) => {
  try {
    const allUser = await Model.find();
    const total = await Model.countDocuments();
    res.status(200).json({
      success: true,
      count: total,
      data: allUser,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.createModel = asyncHandler(async (req, res, next) => {
  try {
    const res = await Model.create({
      ...req.body,
    });
    res.status(200).json({
      success: true,
      data: res,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.updateModel = asyncHandler(async (req, res, next) => {
  try {
    const res = await Model.findByIdAndUpdate(req.params.id, {
      ...req.body,
    });
    res.status(200).json({
      success: true,
      data: res,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
exports.getModel = asyncHandler(async (req, res, next) => {
  try {
    const res = await Model.findById(req.params.id);
    res.status(200).json({
      success: true,
      data: res,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.deleteModel = asyncHandler(async (req, res, next) => {
  try {
    const res = await Model.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      data: res,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
