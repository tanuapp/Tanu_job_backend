const Model = require("../models/service");
const asyncHandler = require("../middleware/asyncHandler");
const mongoose = require("mongoose");

exports.getAll = asyncHandler(async (req, res, next) => {
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

exports.create = asyncHandler(async (req, res, next) => {
  try {
    const photo =
      req.file && req.file.filename ? req.file.filename : "no-img.png";
    const user = await Model.create({
      ...req.body,
      photo,
    });

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(200).json({ success: false, error: error.message });
  }
});

exports.update = asyncHandler(async (req, res, next) => {
  try {
    const old = await Model.findById(req.params.id);
    const updatedData = {
      ...req.body,
      photo: req.file ? req.file?.filename : old.photo,
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
    res.status(200).json({ success: false, error: error.message });
  }
});

exports.get = asyncHandler(async (req, res, next) => {
  try {
    const allText = await Model.findById(req.params.id);
    allText.views++;
    await allText.save();
    return res.status(200).json({
      success: true,
      data: allText,
    });
  } catch (error) {
    res.status(200).json({ success: false, error: error.message });
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
    res.status(200).json({ success: false, error: error.message });
  }
};
