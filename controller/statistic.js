const Model = require("../models/service");
const asyncHandler = require("../middleware/asyncHandler");
const mongoose = require("mongoose");
const customResponse = require("../utils/customResponse");

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
    customResponse.error(res, error.message);
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
    customResponse.error(res, error.message);
  }
});
