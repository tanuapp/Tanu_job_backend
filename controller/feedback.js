const Model = require("../models/feedback");
const asyncHandler = require("../middleware/asyncHandler");

const customResponse = require("../utils/customResponse");

exports.getAllModel = asyncHandler(async (req, res, next) => {
  try {
    const allUser = await Model.find().populate("companyId" , "name logo");
    const total = await Model.countDocuments();
    res.status(200).json({
      success: true,
      count: total,
      data: allUser,
    });
  } catch (error) {
    customResponse.error(res, error.message);
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
    customResponse.error(res, error.message);
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
    customResponse.error(res, error.message);
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
    customResponse.error(res, error.message);
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

    customResponse.error(res, error.message);s
  }
});
