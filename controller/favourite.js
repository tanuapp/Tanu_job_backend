const Model = require("../models/favourite");
const asyncHandler = require("../middleware/asyncHandler");

exports.getUserSavedCompany = asyncHandler(async (req, res, next) => {
  try {
    const allUser = await Model.find({ user: req.userId }).populate("company");
    const total = await Model.countDocuments();
    res.status(200).json({
      success: true,
      count: total,
      data: allUser,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.saveCompany = asyncHandler(async (req, res, next) => {
  try {
    const result = await Model.findOne({
      user: req.body.user,
    });

    if (!result) {
      const res = await Model.create({
        user: req.body.user,
        company: [req.body.company],
      });
      res.status(200).json({
        success: true,
        data: res,
      });
    } else {
      result.company.push(req.body.company);
      await result.save();

      res.status(200).json({
        success: true,
        data: result,
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.removeCompany = asyncHandler(async (req, res, next) => {
  try {
    const result = await Model.findOne({
      user: req.body.user,
    });

    if (!result) {
      const res = await Model.create({
        user: req.body.user,
        company: [],
      });
      res.status(200).json({
        success: true,
        data: res,
      });
    } else {
      const p = result.company;
      result.company = p.filter((list) => list != req.body.company);
      await result.save;

      res.status(200).json({
        success: true,
        data: result,
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.deleteModel = asyncHandler(async (req, res, next) => {
  try {
    const result = await Model.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
