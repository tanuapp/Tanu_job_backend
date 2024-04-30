const model = require("../models/companyModel");
const asyncHandler = require("../middleware/asyncHandler");

exports.create = asyncHandler(async (req, res, next) => {
  try {
    const user = req.userId;
    const { SubCategory } = req.body;
    console.log(SubCategory);
    const fileName1 = req.files["logo"]
      ? req.files["logo"][0].filename
      : "no logo ?";
    const uploadedFiles = [];

    if (req.files && Array.isArray(req.files.files)) {
      for (let i = 0; i < req.files.files.length; i++) {
        uploadedFiles.push({ name: req.files.files[i].filename });
      }
    } else {
      console.warn("req.files.files is not an array");
    }
    const data = {
      ...req.body,
      companyCreater: user,
      files: uploadedFiles,
      logo: fileName1,
    };

    const text = await model.create(data);
    return res.status(200).json({ success: true, data: text });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.getSubCategoryByCompany = asyncHandler(async (req, res) => {
  try {
    const id = req.params.subcategory_id;
    const text = await model.find({ SubCategory: id }).populate("SubCategory");
    return res.status(200).json({ success: true, data: text });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.update = asyncHandler(async (req, res, next) => {
  try {
    const fileName1 = req.files["logo"]
      ? req.files["logo"][0].filename
      : "no logo ?";
    const uploadedFiles = [];

    if (req.files && Array.isArray(req.files.files)) {
      for (let i = 0; i < req.files.files.length; i++) {
        uploadedFiles.push({ name: req.files.files[i].filename });
      }
    } else {
      console.warn("req.files.files is not an array");
    }
    const updatedData = {
      ...req.body,
      files: uploadedFiles,
      logo: fileName1,
    };
    const text = await model.findByIdAndUpdate(req.params.id, updatedData, {
      new: true,
    });
    return res.status(200).json({ success: true, data: text });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.findDelete = asyncHandler(async (req, res, next) => {
  try {
    const text = await model.findByIdAndDelete(req.params.id, {
      new: true,
    });
    return res.status(200).json({ success: true, data: text });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.getUserCompany = asyncHandler(async (req, res) => {
  try {
    const user = req.userId;
    const text = await model
      .find({ companyCreater: user })
      .populate("Category")
      .populate("SubCategory");
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
