const Model = require("../models/newJournal");
const asyncHandler = require("../middleware/asyncHandler");

exports.getAllModel = asyncHandler(async (req, res, next) => {
  try {
    const data = await Model.find();

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      msg: "Серверийн алдаа: " + error.message,
    });
  }
});
exports.getModel = asyncHandler(async (req, res, next) => {
  try {
    const data = await Model.findById(req.params.id);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      msg: "Серверийн алдаа: " + error.message,
    });
  }
});
exports.updateModel = asyncHandler(async (req, res, next) => {
  try {
    const data = await Model.findById(req.params.id);
    console.log(data);
    const sliderImg = req.files.sliderImg
      ? req.files.sliderImg.map((file) => file.filename)
      : data.sliderImg;
    const bodyImages = req.files.bodyImg
      ? req.files.bodyImg.map((file) => file.filename)
      : data.bodyImages;
    const profile = req.files.profile
      ? req.files.profile[0].filename
      : data.profile;
    const audio = req.files.audio ? req.files.audio[0].filename : data.audio;

    const newEntryData = {
      ...req.body,
      sliderImg,
      bodyImages,
      profile,
      audio,
    };

    const newEntry = await Model.findByIdAndUpdate(req.params.id, newEntryData);
    res.status(200).json({
      success: true,
      data: newEntry,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      msg: "Серверийн алдаа: " + error.message,
    });
  }
});

exports.createModel = asyncHandler(async (req, res, next) => {
  try {
    // Extract uploaded files' paths
    const sliderImg = req.files.sliderImg
      ? req.files.sliderImg.map((file) => file.filename)
      : [];
    const bodyImages = req.files.bodyImg
      ? req.files.bodyImg.map((file) => file.filename)
      : [];
    const profile = req.files.profile ? req.files.profile[0].filename : null;
    const audio = req.files.audio ? req.files.audio[0].filename : null;

    // Combine request body with file paths
    const newEntryData = {
      ...req.body,
      sliderImg,
      bodyImages,
      profile,
      audio,
    };

    // Save new entry to the database
    const newEntry = await Model.create(newEntryData);

    res.status(200).json({
      success: true,
      data: newEntry,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      msg: "Server Error: " + error.message,
    });
  }
});
exports.deleteModel = asyncHandler(async (req, res, next) => {
  try {
    // Save new entry to the database
    const newEntry = await Model.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      data: newEntry,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      msg: "Server Error: " + error.message,
    });
  }
});
