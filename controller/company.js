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
const User = require("../models/user"); // ← энэ мөрийг нэм

exports.getAll = asyncHandler(async (req, res, next) => {
  try {
    const categories = await Model.find()
      .populate("category")
      .populate("onlineContract");

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

exports.updateUserFCM = asyncHandler(async (req, res, next) => {
  try {
    const { token, isAndroid } = req.body;

    const user = await User.findById(req.userId).populate("userRole");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Хэрэглэгч олдсонгүй",
      });
    }

    // ✅ Хэрвээ userRole байгаа бол түүнээс хэрэглэгчийн ID-г авна,
    // үгүй бол шууд өөрийн ID-г авна
    const ownerId =
      user.userRole && user.userRole.user ? user.userRole.user : user._id;

    const userCompany = await Model.findOne({ companyOwner: ownerId });

    if (!userCompany) {
      console.warn(
        "⚠️ [updateUserFCM] Компани олдсонгүй companyOwner:",
        ownerId
      );
      return res.status(400).json({
        success: false,
        message: "Компани олдсонгүй",
      });
    }

    userCompany.firebase_token = token;
    userCompany.isAndroid = isAndroid;
    await userCompany.save();

    return res.status(200).json({
      success: true,
      message: "FCM токен амжилттай шинэчлэгдлээ",
    });
  } catch (error) {
    console.error("❌ [updateUserFCM] Алдаа гарлаа:", error);
    customResponse.error(res, error.message || "Серверийн дотоод алдаа");
  }
});

exports.clearFCM = asyncHandler(async (req, res, next) => {
  try {
    const { token, isAndroid } = req.body;

    const userFind = await Model.findOne({ companyOwner: req.userId });

    if (!userFind) {
      return res.status(404).json({
        success: false,
        message: "Компанийн хэрэглэгч олдсонгүй",
      });
    }

    // Хэрвээ FCM токен тохирохгүй байвал шууд OK буцаана
    if (userFind.firebase_token !== token) {
      return res.status(200).json({
        success: true,
        message: "FCM token давхцахгүй, устгах шаардлагагүй",
      });
    }

    userFind.firebase_token = null;
    userFind.isAndroid = null;
    await userFind.save();

    return res.status(200).json({
      success: true,
      message: "FCM token амжилттай устгагдлаа",
    });
  } catch (error) {
    console.error("FCM clear error:", error);
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

    const ContractList = await Contract.find({
      companyId: req.params.id,
    });
    const ServiceList = await Service.find({
      companyId: req.params.id,
    });

    const allUser = await Fav.findOne({
      user: req.userId,
      company: req.params.id,
    });

    const company = await Model.findById(req.params.id)
      .populate({
        path: "category",
        model: "Category", // Ensure this model name is correct for categories
      })
      .populate("onlineContract");

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

    const uploadedFiles = [];
    if (
      req.files &&
      req.files.sliderImages &&
      Array.isArray(req.files.sliderImages)
    ) {
      for (let file of req.files.sliderImages) {
        uploadedFiles.push(file.filename);
      }
    }

    const company = await Model.create({
      ...req.body,
      timetable: req.body.timetable
        ? JSON.parse(req.body.timetable || "[]")
        : [],
      logo,
      sliderImages: uploadedFiles,
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
  console.log(req.body, "datas irlee");

  try {
    const old = await Model.findById(req.params.id);

    // 🖼️ Logo зураг
    const logo =
      req.files && req.files.logo ? req.files.logo[0].filename : old.logo;

    // 🖼️ Slider зургууд
    let uploadedFiles = [];

    if (
      req.files &&
      req.files.sliderImages &&
      Array.isArray(req.files.sliderImages)
    ) {
      const newUploaded = req.files.sliderImages.map((file) => file.filename);

      // Client-аас ирсэн хуучин зургууд
      const existingSliderImages = req.body.existingSliderImages;
      const oldImages = Array.isArray(existingSliderImages)
        ? existingSliderImages
        : existingSliderImages
        ? [existingSliderImages]
        : old.sliderImages;

      uploadedFiles = [...oldImages, ...newUploaded];
    } else {
      // Зураг ирээгүй бол хуучныг үлдээ
      uploadedFiles = old.sliderImages;
    }

    const company = await Model.findByIdAndUpdate(
      req.params.id,
      {
        timetable: req.body.timetable
          ? JSON.parse(req.body.timetable)
          : old.timetable,
        ...req.body,
        logo,
        sliderImages: uploadedFiles,
        category: JSON.parse(req.body.category || "[]") || [],
      },
      { new: true }
    );

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
    const allText = await Model.findById(req.params.id).populate("category");
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
