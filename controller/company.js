const Model = require("../models/company");
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
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.getStatistic = asyncHandler(async (req, res, next) => {
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

exports.createModel = asyncHandler(async (req, res, next) => {
  try {
    console.log("plz");
    const logo =
      req.files && req.files.logo ? req.files.logo[0].filename : "no-logo.png";
    const sliderImages =
      req.files && req.files.sliderIMG
        ? req.files.sliderIMG.map((file) => file.filename)
        : [];

    const company = await Model.create({
      ...req.body,
      logo, // Store the logo filename
      sliderImages, // Store the array of slider image filenames
    });

    res.status(200).json({
      success: true,
      data: company,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.update = asyncHandler(async (req, res, next) => {
  try {
    const old = await Model.findById(req.params.id);
    const logo =
      req.files && req.files.logo ? req.files.logo[0].filename : old.logo;
    const sliderImages =
      req.files && req.files.sliderIMG
        ? req.files.sliderIMG.map((file) => file.filename)
        : old.sliderImages;

    const company = await Model.create({
      ...req.body,
      logo, // Store the logo filename
      sliderImages, // Store the array of slider image filenames
    });

    res.status(200).json({
      success: true,
      data: company,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
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
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.deleteModel = async function deleteUser(req, res, next) {
  try {
    const deletePost = await Model.findOneAndDelete(req.params.id, {
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
