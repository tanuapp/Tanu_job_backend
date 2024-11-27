const Model = require("../models/service");
const asyncHandler = require("../middleware/asyncHandler");
const mongoose = require("mongoose");

exports.getSuperStatistic = asyncHandler(async (req, res, next) => {
  try {
    const categories = await Model.find();
    const total = await Model.countDocuments();
    res.status(200).json({
      success: true,
      count: total,
      data: categories,
    });
  } catch (error) {
    res.status(200).json({ success: false, error: error.message });
  }
});

exports.getCompanyStatistic = asyncHandler(async (req, res, next) => {
  try {
    const categories = await Model.find();
    const total = await Model.countDocuments();
    res.status(200).json({
      success: true,
      count: total,
      data: categories,
    });
  } catch (error) {
    res.status(200).json({ success: false, error: error.message });
  }
});
