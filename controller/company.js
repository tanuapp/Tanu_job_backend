const Model = require("../models/company");
const asyncHandler = require("../middleware/asyncHandler");
const Artist = require("../models/artist");

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

exports.getAllPopulated = asyncHandler(async (req, res, next) => {
  try {
    const categories = await Model.find().populate("category");
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

exports.getCompanyArtist = asyncHandler(async (req, res, next) => {
  try {
    const artistList = await Artist.find({
      companyId: req.params.id,
    });

    const company = await Model.findById(req.params.id);

    res.status(200).json({
      success: true,
      artist: artistList,
      company,
    });
    const data = await Model.find()
    .populate("district")
    .populate("subDistrict")
    .populate("area");

  res.status(200).json({
    success: true,
    data,
  });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.createModel = asyncHandler(async (req, res, next) => {
  try {
    console.log(req.body);
    const logo =
      req.files && req.files.logo ? req.files.logo[0].filename : "no-logo.png";
    const sliderImages =
      req.files && req.files.sliderIMG
        ? req.files.sliderIMG.map((file) => file.filename)
        : [];

    const company = await Model.create({
      ...req.body,
      logo,
      sliderImages,
      category: JSON.parse(req.body.category || "[]") || [],
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

    const company = await Model.findByIdAndUpdate(req.params.id, {
      ...req.body,
      logo,
      sliderImages,
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
