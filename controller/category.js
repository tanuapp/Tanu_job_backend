const Model = require("../models/category");
const asyncHandler = require("../middleware/asyncHandler");
const mongoose = require("mongoose");

exports.getAll = asyncHandler(async (req, res, next) => {
  try {
    const categories = await Model.find({ parent: null }).populate("children");
    const total = await Model.countDocuments();
    res.status(200).json({
      success: true,
      count: total,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.create = asyncHandler(async (req, res, next) => {
  try {
    const parentId = req.body.parent;

    const user = await Model.create({
      ...req.body,
      photo: req.file ? req.file.filename : "no-img.png",
      parent: parentId ? parentId : null,
    });

    res.status(200).json({
      success: true,

      data: user,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.update = asyncHandler(async (req, res, next) => {
  try {
    const updatedData = {
      ...req.body,
      photo: req.file?.filename,
    };

    const upDateUserData = await Model.findByIdAndUpdate(
      req.params.id,
      updatedData,
      {
        new: true,
      }
    );
    return res.status(200).json({
      success: true,
      data: upDateUserData,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.get = asyncHandler(async (req, res, next) => {
  try {
    const allText = await Model.findById(req.params.id).populate("children");
    return res.status(200).json({
      success: true,
      data: allText,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.deleteModel = async function deleteUser(req, res, next) {
  try {
    const deletePost = await Model.findByIdAndDelete(req.params.id, {
      new: true,
    });
    return res.status(200).json({
      success: true,
      msg: "Ажилттай усгагдлаа",
      data: deletePost,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
