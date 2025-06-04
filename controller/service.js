const Model = require("../models/service");
const asyncHandler = require("../middleware/asyncHandler");
const mongoose = require("mongoose");
const customResponse = require("../utils/customResponse");

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
    customResponse.error(res, error.message);
  }
});
exports.getcompany = asyncHandler(async (req, res, next) => {
  try {
    const companyId = req.params.id;

    const services = await Model.find({ companyId }).populate({
      path: "artistId",
      select: "first_name last_name photo", // хүсвэл artist-ийн зөвхөн эдгээр талбарыг авна
    });

    const total = await Model.countDocuments({ companyId });

    res.status(200).json({
      success: true,
      count: total,
      data: services,
    });
  } catch (error) {
    customResponse.error(res, error.message);
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
    customResponse.error(res, error.message);
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
    customResponse.error(res, error.message);
  }
});

exports.get = asyncHandler(async (req, res, next) => {
  try {
    const allText = await Model.findById(req.params.id);
    const all = await Model.findById(req.params.id).populate("artistId");
    allText.views++;
    await allText.save();
    return res.status(200).json({
      success: true,
      data: {
        ...allText.toObject(),
        artist: all.artistId,
      },
    });
  } catch (error) {
    customResponse.error(res, error.message);
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
    customResponse.error(res, error.message);
  }
};
