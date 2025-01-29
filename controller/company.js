const Model = require("../models/company");
const asyncHandler = require("../middleware/asyncHandler");
const Artist = require("../models/artist");
const Banner = require("../models/banner");
const Dayoff = require("../models/dayoff");
const Contract = require("../models/onlineContract");
const Service = require("../models/service");
const Appointment = require("../models/appointment");
const Schedule = require("../models/schedule");
const Fav = require("../models/favourite");
const customResponse = require("../utils/customResponse");

exports.getAll = asyncHandler(async (req, res, next) => {
  try {
    const categories = await Model.find()
      .populate("area")
      .populate("district")
      .populate("subDistrict")
      .populate("category");

    const allUser = await Fav.find({ user: req.userId });

    console.log(allUser);

    const savedCompanyIds = allUser.map((el) => el.company.toString());

    const savedState = categories.map((list) => ({
      ...list.toObject(),
      isSaved: savedCompanyIds.includes(list._id.toString()),
    }));

    const total = await Model.countDocuments();

    customResponse.success(res, savedState);
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

exports.addContract = asyncHandler(async (req, res, next) => {
  try {
    await Model.findOneAndUpdate({
      companyOwner: req.userId,
      contract: req.file ? req.file.filename : "",
    });
    customResponse.success(res, "");
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

exports.getAllPopulated = asyncHandler(async (req, res, next) => {
  try {
    const categories = await Model.find().populate("category");

    customResponse.success(res, categories);
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

exports.getCompanyPopulate = asyncHandler(async (req, res, next) => {
  try {
    const artistList = await Artist.find({
      companyId: req.params.id,
    });
    const appointmentList = await Appointment.find({
      companyId: req.params.id,
    });

    const BannerList = await Banner.find({
      companyId: req.params.id,
    });
    const DayoffList = await Dayoff.find({
      companyId: req.params.id,
    });
    const ContractList = await Contract.find({
      companyId: req.params.id,
    });
    const ServiceList = await Service.find({
      companyId: req.params.id,
    });
    const ScheduleList = await Schedule.find({
      companyId: req.params.id,
    });
    const allUser = await Fav.findOne({
      user: req.userId,
      company: req.params.id,
    });

    const company = await Model.findById(req.params.id)
      .populate("district")
      .populate("subDistrict")
      .populate("area")
      .populate({
        path: "category",
        model: "Category", // Ensure this model name is correct for categories
      });

    const comp = {
      ...company.toObject(),
      isSaved: allUser ? true : false,
    };

    res.status(200).json({
      success: true,
      artist: artistList,
      appointment: appointmentList,
      company: comp,
      categories: company.category, // Populated category data
      banner: BannerList,
      schedule: ScheduleList,
      dayoff: DayoffList,
      Contract: ContractList,
      service: ServiceList,
    });
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

exports.createModel = asyncHandler(async (req, res, next) => {
  try {
    console.log(req.body);
    const logo =
      req.files && req.files.logo ? req.files.logo[0].filename : "no-logo.png";
    const sliderImages =
      req.files && req.files.sliderIMG
        ? req.files.sliderIMG.map((file) => file.filename)
        : [];

    const company = await Model.create({
      ...req.body,
      logo,
      sliderImages,
      category: JSON.parse(req.body.category || "[]") || [],
    });

    res.status(200).json({
      success: true,
      data: company,
    });
  } catch (error) {
    console.log(error);
    customResponse.error(res, error.message);
  }
});

exports.update = asyncHandler(async (req, res, next) => {
  try {
    const old = await Model.findById(req.params.id);
    const logo =
      req.files && req.files.logo ? req.files.logo[0].filename : old.logo;
    const sliderImages =
      req.files && req.files.sliderIMG
        ? req.files.sliderIMG.map((file) => file.filename)
        : old.sliderImages;

    const company = await Model.findByIdAndUpdate(req.params.id, {
      ...req.body,
      logo,
      sliderImages,
    });

    res.status(200).json({
      success: true,
      data: company,
    });
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

exports.get = asyncHandler(async (req, res, next) => {
  try {
    const allText = await Model.findById(req.params.id);
    allText.views++;
    await allText.save();
    return res.status(200).json({
      success: true,
      data: allText,
    });
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

exports.deleteModel = asyncHandler(async (req, res, next) => {
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
});
