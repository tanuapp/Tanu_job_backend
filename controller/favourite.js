const Model = require("../models/favourite");
const asyncHandler = require("../middleware/asyncHandler");

// Get all saved companies for the user
exports.getUserSavedCompany = asyncHandler(async (req, res, next) => {
  try {
    const allUser = await Model.find({ user: req.userId }).populate("company");
    const total = allUser.length;
    res.status(200).json({
      success: true,
      count: total,
      data: allUser,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Save a company to user's list
exports.saveCompany = asyncHandler(async (req, res, next) => {
  try {
    const { company } = req.body;
    let result = await Model.findOne({ user: req.userId });
    result = await Model.create({ user: req.userId, company: company });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Remove a company from user's list
exports.removeCompany = asyncHandler(async (req, res, next) => {
  try {
    const { user, company } = req.body;
    const result = await Model.findOne({ user });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "No entry found for this user",
      });
    }

    // Check and remove the company from the list if it exists
    if (result.company.includes(company)) {
      result.company = result.company.filter(
        (comp) => comp.toString() !== company
      );
      await result.save();

      return res.status(200).json({
        success: true,
        data: result,
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "Company not found in user's list",
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete an entire entry by ID
exports.deleteModel = asyncHandler(async (req, res, next) => {
  try {
    const result = await Model.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Entry not found",
      });
    }
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
