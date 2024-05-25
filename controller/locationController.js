const model = require("../models/locationModel");
const asyncHandler = require("../middleware/asyncHandler");
const { companyIdFind } = require("../middleware/addTime");

exports.create = asyncHandler(async (req, res, next) => {
  try {
    const user = req.userId;
    const company = await companyIdFind(user);
    console.log(company);
    const data = {
      ...req.body,
      CreateUser: user,
      Company: company[0]._id,
    };
    const text = await model.create(data);
    return res.status(200).json({ success: true, data: text });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.update = asyncHandler(async (req, res, next) => {
  try {
    const user = req.userId;
    const company = await companyIdFind(user);
    console.log(company);
    const data = {
      ...req.body,
      CreateUser: user,
      Company: company[0]._id,
    };
    const text = await model.findByIdAndUpdate(req.params.id, data, {
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
    return res.status(200).json({ success: true, total: total, data: text });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
