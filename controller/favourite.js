const Model = require("../models/favourite");
const asyncHandler = require("../middleware/asyncHandler");

exports.getUserSavedCompany = asyncHandler(async (req, res, next) => {
  try {
    const savedCompanies = await Model.find({ user: req.userId })
      .populate({
        path: "company",
        populate: {
          path: "category", // Field in the 'Category' schema that references another model
        },
      })
      .lean();

    const formattedCompanies = savedCompanies.map((saved) => ({
      ...saved.company,
      category: saved.company.category.map((cat) => cat.toString()),
      isSaved: true,
    }));

    return res.status(200).json({
      success: true,
      data: formattedCompanies,
      total: formattedCompanies.length,
    });
  } catch (error) {
    console.error("Error fetching saved companies:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching saved companies",
    });
  }
});

// Save a company to user's list
exports.saveCompany = asyncHandler(async (req, res, next) => {
  try {
    const { company } = req.body;
    let existingFavorite = await Model.findOne({ user: req.userId, company });

    if (existingFavorite) {
      await Model.deleteOne({ user: req.userId, company });
      return res.status(200).json({
        success: true,
        message: "Company removed from favorites",
      });
    } else {
      const newFavorite = await Model.create({ user: req.userId, company });
      return res.status(200).json({
        success: true,
        message: "Company added to favorites",
        data: newFavorite,
      });
    }
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
