const Model = require("../models/gallery");
const asyncHandler = require("../middleware/asyncHandler");
const customResponse = require("../utils/customResponse");

exports.getAllModel = asyncHandler(async (req, res, next) => {
  try {
    const allUser = await Model.findOne( {
      company: req.params.id,
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
      gallery: req.files && req.files.gallery ? req.files.gallery.map((file) => file.filename) : [],
    });

    customResponse.success(res, result);
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

exports.updateModel = asyncHandler(async (req, res, next) => {
  try {
      const old = await Model.findById(req.params.id);
      const gallery =
      req.files && req.files.gallery
        ? req.files.gallery.map((file) => file.filename)
        : old.gallery;

    const result = await Model.findByIdAndUpdate(req.params.id, {
      ...req.body,
      gallery,
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
