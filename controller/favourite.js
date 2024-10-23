const Model = require("../models/favourite");
const asyncHandler = require("../middleware/asyncHandler");

// Get all saved companies for the user
exports.getUserSavedCompany = asyncHandler(async (req, res, next) => {
  try {
    const allUser = await Model.find({ user: req.userId }).populate("company");
    const total = await Model.countDocuments({ user: req.userId }); // Total count of user's saved companies
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
    const result = await Model.findOne({
      user: req.body.user,
    });

    if (!result) {
      const newEntry = await Model.create({
        user: req.body.user,
        company: [req.body.company],
      });
      res.status(200).json({
        success: true,
        data: newEntry,
      });
    } else {
      if (!result.company.includes(req.body.company)) {
        result.company.push(req.body.company); // Add the company if it's not already in the list
        await result.save();
      }

      res.status(200).json({
        success: true,
        data: result,
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Remove a company from user's list
exports.removeCompany = asyncHandler(async (req, res, next) => {
  try {
    const result = await Model.findOne({
      user: req.body.user,
    });

    if (!result) {
      res.status(404).json({
        success: false,
        message: "No entry found for this user",
      });
    } else {
      result.company = result.company.filter(
        (list) => list != req.body.company
      ); // Remove the company from the array

      await result.save(); // Ensure `.save()` is called correctly

      res.status(200).json({
        success: true,
        data: result,
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
