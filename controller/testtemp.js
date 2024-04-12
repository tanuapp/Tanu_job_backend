const model = require("../models/itemModel");
const asyncHandler = require("../middleware/asyncHandler");
exports.create = asyncHandler(async (req, res) => {
  try {
    const fileName1 = req.files["video"]
      ? req.files["video"][0].filename
      : "no video ?";
    const fileName2 = req.files["planpicture"]
      ? req.files["planpicture"][0].filename
      : "no planpicture photo ?";
    const uploadedFiles = [];

    if (uploadedFiles) {
      if (Array.isArray(req.files.files)) {
        for (let i = 0; i < req.files.files.length; i++) {
          uploadedFiles.push({ name: req.files.files[i].filename });
        }
      } else {
        console.warn("req.files.files is not an array");
      }
    }
    const input = {
      ...req.body,
      files: uploadedFiles,
      planpicture: fileName2,
      video: fileName1
    };
    const newItem = await model.create(input);
    res.status(201).json({ success: true, data: newItem });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
});
exports.update = asyncHandler(async (req, res) => {
  try {
    const uploadedFiles = req.files && req.files.files ? [] : null;

    if (uploadedFiles) {
      // Ensure that req.files.files is an array before trying to access its length
      if (Array.isArray(req.files.files)) {
        for (let i = 0; i < req.files.files.length; i++) {
          uploadedFiles.push({ name: req.files.files[i].filename });
        }
      } else {
        console.warn("req.files.files is not an array");
        // Handle this situation based on your requirements
      }
    }

    const input = {
      ...req.body,
      files: uploadedFiles || [],
      planpicture: req.files?.["planpicture"]?.[0]?.filename || null,
      video: req.files?.["video"]?.[0]?.filename || null
    };

    const newItem = await model.findByIdAndUpdate(req.params.id, input, {
      new: true
    });

    res.status(201).json({ success: true, data: newItem });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
});

exports.findDelete = asyncHandler(async (req, res, next) => {
  try {
    const text = await model.findByIdAndDelete(req.params.id, {
      new: true
    });
    return res.status(200).json({ success: true, data: text });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.detail = asyncHandler(async (req, res, next) => {
  try {
    const text = await model.findById(req.params.id);
    return res.status(200).json({ success: true, data: text });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.getAll = asyncHandler(async (req, res, next) => {
  try {
    const total = await model.countDocuments();
    const text = await model.find();
    return res.status(200).json({ success: true, total: total, data: text });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
