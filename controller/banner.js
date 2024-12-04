const Model = require("../models/banner");
const asyncHandler = require("../middleware/asyncHandler");
const customResponse = require("../utils/customResponse");

exports.getAllModel = asyncHandler(async (req, res, next) => {
  try {
    const allUser = await Model.find().sort({
      order: 1,
    });

    customResponse.success(res, allUser);
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

exports.createModel = asyncHandler(async (req, res, next) => {
  try {
    const result = await Model.create({
      ...req.body,
      photo: req.file ? req.file.filename : "no-img.png",
    });

    customResponse.success(res, result);
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

exports.updateModel = asyncHandler(async (req, res, next) => {
  try {
    const old = await Model.findById(req.params.id);
    const result = await Model.findByIdAndUpdate(req.params.id, {
      ...req.body,
      photo: req.file ? req.file.filename : old.photo,
    });

    customResponse.success(res, result);
  } catch (error) {
    customResponse.error(res, error.message);
  }
});
exports.getModel = asyncHandler(async (req, res, next) => {
  try {
    const result = await Model.findById(req.params.id);

    customResponse.success(res, result);
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

exports.deleteModel = asyncHandler(async (req, res, next) => {
  try {
    const result = await Model.findByIdAndDelete(req.params.id);

    customResponse.success(res, result);
  } catch (error) {
    customResponse.error(res, error.message);
  }
});
