const model = require("../models/cusstomerOrderModel");
const asyncHandler = require("../middleware/asyncHandler");

exports.create = asyncHandler(async (req, res, next) => {
  try {
    const customer = req.userId;
    const data = {
      ...req.body,
      orderCustomer: customer,

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
      photo: req.file?.filename
    };
    const text = await model.findByIdAndUpdate(req.params.id, updatedData, {
      new: true
    });
    return res.status(200).json({ success: true, data: text });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
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
exports.getOrderCustomer = asyncHandler(async (req, res, next) => {
  try {
    const customer = req.userId;
    const orders = await model
      .find({ orderCustomer: customer })
      .populate({
        path: 'item',
        select: '_id huwaari status Service',
        populate: {
          path: 'Service',
          select: 'name',
        },
      });

    return res.status(200).json({ success: true, data: orders });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});
