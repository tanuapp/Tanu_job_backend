const Model = require("../models/employeeSchedule");
const asyncHandler = require("../middleware/asyncHandler");
const mongoose = require("mongoose");
const customResponse = require("../utils/customResponse");

exports.getAll = asyncHandler(async (req, res) => {
  const schedules = await Model.find()
    .populate("serviceId")
    .populate("artistId");

  res.status(200).json({
    success: true,
    data: schedules,
  });
});
exports.create = asyncHandler(async (req, res, next) => {
  try {
    const {
      start,
      end,
      artistId,
      companyId,
      vacationStart,
      vacationEnd,
      date,
      serviceId = [],
      day_of_the_week, // <-- added field
    } = req.body;

    if (!Array.isArray(serviceId) || serviceId.length === 0) {
      return customResponse.error(res, "serviceId нь массив байх ёстой.");
    }

    const schedule = await Model.create({
      start,
      end,
      artistId,
      companyId,
      vacationStart,
      vacationEnd,
      date: date || new Date(), // default: today
      serviceId,
      day_of_the_week, // <-- added field
    });
    await schedule.save();
    res.status(200).json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    console.error("❌ Schedule create error:", error.message);
    customResponse.error(res, error.message);
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
    customResponse.error(res, error.message);
  }
});

exports.getByCompanyId = asyncHandler(async (req, res) => {
  try {
    const { companyId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid company ID" });
    }

    const schedules = await Model.find({
      companyId: new mongoose.Types.ObjectId(companyId),
    })
      .populate("artistId") // fully populated
      .populate("serviceId"); // just serviceId (without populating serviceId.companyId)

    return res.status(200).json({
      success: true,
      data: schedules,
    });
  } catch (error) {
    customResponse.error(res, error.message);
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
    customResponse.error(res, error.message);
  }
};
