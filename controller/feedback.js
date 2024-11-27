const Model = require("../models/feedback");
const asyncHandler = require("../middleware/asyncHandler");

exports.getAllModel = asyncHandler(async (req, res, next) => {
  try {
    const allUser = await Model.find().populate("userId");
    const total = await Model.countDocuments();
    res.status(200).json({
      success: true,
      count: total,
      data: allUser,
    });
  } catch (error) {
    res.status(200).json({ success: false, error: error.message });
  }
});

exports.createModel = asyncHandler(async (req, res, next) => {
  try {
    const result = await Model.create({
      ...req.body,
    });
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(200).json({ success: false, error: error.message });
  }
});

exports.updateModel = asyncHandler(async (req, res, next) => {
  try {
    const result = await Model.findByIdAndUpdate(req.params.id, {
      ...req.body,
    });
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(200).json({ success: false, error: error.message });
  }
});
exports.getModel = asyncHandler(async (req, res, next) => {
  try {
    const result = await Model.findById(req.params.id);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(200).json({ success: false, error: error.message });
  }
});

exports.deleteModel = asyncHandler(async (req, res, next) => {
  try {
    const result = await Model.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(200).json({ success: false, error: error.message });
  }
});
