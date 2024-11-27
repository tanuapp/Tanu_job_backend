const Model = require("../models/reject");
const asyncHandler = require("../middleware/asyncHandler");

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
    res.status(200).json({ success: false, error: error.message });
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
    res.status(200).json({ success: false, error: error.message });
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
    res.status(200).json({ success: false, error: error.message });
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
    res.status(200).json({ success: false, error: error.message });
  }
});
