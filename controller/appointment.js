const Model = require("../models/appointment");
const Appointment = require("../models/appointment");
// consrt
const Schedule = require("../models/schedule");
const User = require("../models/customer");
const Dayoff = require("../models/dayoff");

const asyncHandler = require("../middleware/asyncHandler");

exports.getAll = asyncHandler(async (req, res, next) => {
  try {
    const allUser = await Model.find();
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

exports.declineAppointment = asyncHandler(async (req, res, next) => {
  try {
    const decline = await Model.findById(req.params.id);
    if (decline.status == false) {
      res.status(400).json({
        success: false,
        msg: "Таны захиалга баталгаажаагүй байна",
      });
    }
    decline.status = false;
    await decline.save();
    const user = await User.findById(decline.user);
    user.coupon++;
    await user.save();

    const total = await Model.countDocuments();
    res.status(200).json({
      success: true,
      count: total,
      data: "Амжилттай цуцлалаа",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.getAllPopulated = asyncHandler(async (req, res) => {
  try {
    // Fetch all users and populate related fields
    const allUser = await Model.find()
      .populate({
        path: "schedule",
        populate: [
          { path: "serviceId", model: "Service" },
          { path: "artistId", model: "Artist" },
        ],
      })
      .populate("user");

    // Filter users who have a populated schedule with a serviceId
    const filteredUsers = allUser.filter(
      (user) => user.schedule && user.schedule.serviceId
    );

    // Count the total number of documents in the collection
    const totalDocuments = await Model.countDocuments();

    // Return response
    res.status(200).json({
      success: true,
      count: totalDocuments,
      data: filteredUsers,
    });
  } catch (error) {
    // Log and handle error
    console.error("Error in getAllPopulated:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

exports.create = asyncHandler(async (req, res, next) => {
  try {
    const user = await Model.create({
      ...req.body,
      user: req.userId,
    });

    res.status(200).json({
      success: true,

      data: user,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
exports.getAvailableTimes = asyncHandler(async (req, res, next) => {
  try {
    const { date, service } = req.body;

    // Get all DayOffs for the provided date
    const dayOffs = await Dayoff.find({ date });

    // Extract artist IDs and schedules from DayOffs
    const dayOffArtistIds = dayOffs.map((dayOff) => String(dayOff.artistId));
    const dayOffSchedules = dayOffs.flatMap((dayOff) =>
      dayOff.schedule.map((scheduleId) => String(scheduleId))
    );

    // Find the selected day of the week
    const selectedDayOfWeek = new Date(date).toLocaleDateString("mn-MN", {
      weekday: "long",
    });

    // Fetch schedules for the selected day of the week and the specified service
    const schedules = await Schedule.find({
      day_of_the_week: selectedDayOfWeek,
      serviceId: service,
    })
      .populate("artistId")
      .populate("serviceId");

    // Fetch appointments for the date
    const appointments = await Appointment.find({
      date: date,
      status: true,
    });

    // If there are no schedules, return an empty array
    if (!schedules || schedules.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    // Filter schedules to exclude those with DayOff or booked appointments
    const availableSchedules = schedules.filter((schedule) => {
      const isArtistDayOff = dayOffArtistIds.includes(
        String(schedule.artistId._id)
      );
      const isScheduleDayOff = dayOffSchedules.includes(String(schedule._id));
      const isBooked = appointments.some(
        (appointment) => String(appointment.schedule) === String(schedule._id)
      );
      return !isArtistDayOff && !isScheduleDayOff && !isBooked;
    });

    res.status(200).json({
      success: true,
      data: availableSchedules,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.getAvailableTimesByArtist = asyncHandler(async (req, res, next) => {
  try {
    const { date, artistId } = req.body;

    const selectedDayOfWeek = new Date(date).toLocaleDateString("mn-MN", {
      weekday: "long",
    });

    const schedules = await Schedule.find({
      artistId,
      day_of_the_week: selectedDayOfWeek,
    });

    const appointments = await Appointment.find({
      date: date,
      status: true,
    });

    if (!schedules || schedules.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No schedules found for this day",
      });
    }

    const availableSchedules = schedules.filter((schedule) => {
      const isBooked = appointments.some(
        (appointment) => String(appointment.schedule) === String(schedule._id)
      );
      return !isBooked;
    });

    res.status(200).json({
      success: true,
      data: availableSchedules,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
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
    res.status(500).json({ success: false, error: error.message });
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
    res.status(500).json({ success: false, error: error.message });
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
    res.status(500).json({ success: false, error: error.message });
  }
};

// Энд дуусаж байгаа шүүү
