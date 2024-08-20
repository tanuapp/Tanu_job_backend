const model = require("../models/catergoryModel");
const submodel = require("../models/subCategoryModel");
const asyncHandler = require("../middleware/asyncHandler");

exports.create = asyncHandler(async (req, res, next) => {
  try {
    // const user = req.userId;
    const data = {
      ...req.body,
      photo: req.file?.filename ? req.file?.filename : "no photo.jpg",
    };
    const text = await model.create(data);
    return res.status(200).json({ success: true, data: text });
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
    const sub = await submodel.find();
    const list = [];

    text.map((cat) => {
      // Ensure `cat._id` is an ObjectId
      const catId = cat._id.toString();

      // Ensure `el.Category` is also an ObjectId
      let p = sub.filter((el) => el.Category.toString() === catId);

      list.push({
        ...cat._doc,
        children: p,
      });
    });

    return res.status(200).json({ success: true, total: total, data: list });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
