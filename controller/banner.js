const Model = require("../models/banner");
const asyncHandler = require("../middleware/asyncHandler");
const Company = require("../models/company");
exports.getAllModel = asyncHandler(async (req, res, next) => {
  try {
    const allUser = await Model.find().sort({
      order: 1,
    });
    const total = await Model.countDocuments();
    res.status(200).json({
      success: true,
      count: total,
      data: allUser,
    });
    const company = await Company.findOne({
      companyOwner: req.params.id,
    });
    return res.status(200).json({
      success: true,
      data: allText,
      company,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.createModel = asyncHandler(async (req, res, next) => {
  try {
    const result = await Model.create({
      ...req.body,
      photo: req.file ? req.file.filename : "no-img.png",
    });
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.updateModel = asyncHandler(async (req, res, next) => {
  try {
    const old = await Model.findById(req.params.id);
    const result = await Model.findByIdAndUpdate(req.params.id, {
      ...req.body,
      photo: req.file ? req.file.filename : old.photo,
    });
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
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
    res.status(500).json({ success: false, error: error.message });
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
    res.status(500).json({ success: false, error: error.message });
  }
});
