const Model = require("../models/gallery");
const asyncHandler = require("../middleware/asyncHandler");
const customResponse = require("../utils/customResponse");

exports.getAllModel = asyncHandler(async (req, res, next) => {
  try {
    const allUser = await Model.find({
      companyId: req.params.id,
    });

    customResponse.success(res, allUser);
  } catch (error) {
    customResponse.error(res, error.message);
  }
});
exports.getFreelancerModel = asyncHandler(async (req, res, next) => {
  try {
    const allUser = await Model.find({
      freelancerId: req.params.id,
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
      gallery:
        req.files && req.files.gallery
          ? req.files.gallery.map((file) => file.filename)
          : [],
    });

    customResponse.success(res, result);
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

exports.deletePhoto = asyncHandler(async (req, res, next) => {
  const { id, filename } = req.params;

  const galleryDoc = await Model.findById(id);
  if (!galleryDoc) {
    return res
      .status(404)
      .json({ success: false, message: "Gallery not found" });
  }

  // Filter out the file to delete
  const updatedGallery = galleryDoc.gallery.filter((file) => file !== filename);
  galleryDoc.gallery = updatedGallery;

  await galleryDoc.save();

  // 🧹 optionally: remove from disk
  const fs = require("fs");
  const path = require("path");
  const filePath = path.join(__dirname, "../public/uploads", filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  customResponse.success(res, galleryDoc);
});

exports.updateModel = asyncHandler(async (req, res, next) => {
  try {
    const old = await Model.findById(req.params.id);
    const gallery =
      req.files && req.files.gallery
        ? req.files.gallery.map((file) => file.filename)
        : old.gallery;
    const result = await Model.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        gallery,
      },
      { new: true }
    );

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
