const Model = require("../models/reject");
const asyncHandler = require("../middleware/asyncHandler");
const customResponse = require("../utils/customResponse");

exports.create = asyncHandler(async (req, res, next) => {
  try {
    const p = await Model.create({
      status: false,
    });
    res.status(200).json({
      success: true,
      data: p,
    });
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

exports.approve = asyncHandler(async (req, res, next) => {
  try {
    const p = await Model.findOneAndUpdate(
      {},
      {
        status: true,
      }
    );
    res.status(200).json({
      success: true,
      data: p,
    });
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

exports.get = asyncHandler(async (req, res, next) => {
  try {
    const p = await Model.findOne();
    res.status(200).json({
      success: true,
      data: p,
    });
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

exports.reject = asyncHandler(async (req, res, next) => {
  try {
    const p = await Model.findOneAndUpdate(
      {},
      {
        status: false,
      }
    );
    res.status(200).json({
      success: true,
      data: p,
    });
  } catch (error) {
    customResponse.error(res, error.message);
  }
});
