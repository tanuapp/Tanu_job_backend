const Model = require("../models/dayoff");
const asyncHandler = require("../middleware/asyncHandler");

exports.getAll = asyncHandler(async (req, res, next) => {
  try {
    const allUser = await Model.find().populate("artistId");
    const total = await Model.countDocuments();
    res.status(200).json({
      success: true,
      count: total,
      data: allUser,
    });
  } catch (error) {
    res.status(200).json({ success: false, error: error.message });
  }
});

exports.create = asyncHandler(async (req, res, next) => {
  try {
    const inputData = {
      ...req.body,
    };
    const user = await Model.create(inputData);

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
    const updatedData = {
      ...req.body,
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

// Энд дуусаж байгаа шүүү
