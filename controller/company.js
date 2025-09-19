const Model = require("../models/company");
const asyncHandler = require("../middleware/asyncHandler");
const Artist = require("../models/artist");
const Banner = require("../models/banner");
const Dayoff = require("../models/dayoff");
const Contract = require("../models/onlineContract");
const Service = require("../models/service");
const Appointment = require("../models/appointment");
const Company = require("../models/company");
const Fav = require("../models/favourite");
const customResponse = require("../utils/customResponse");
const User = require("../models/user"); // ← энэ мөрийг нэм
const generateBranchCode = require("../middleware/branchCodeGenerator"); // Branch code generator

exports.generateBranchCode = async (req, res) => {
  try {
    const { companyId } = req.body;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "companyId шаардлагатай",
      });
    }

    const companyData = await Company.findById(companyId);
    if (!companyData) {
      return res.status(404).json({
        success: false,
        message: "Компанийн ID олдсонгүй",
      });
    }

    // Шинэ салбар код үүсгэнэ
    const code = await generateBranchCode();

    // Хэрэв компанид өмнө нь branchCode байгаагүй бол → энэ үндсэн салбар
    const isMain = !companyData.branchCode;

    companyData.branchCode = code;
    companyData.mainBranch = isMain;
    await companyData.save();

    res.status(200).json({
      success: true,
      code,
      mainBranch: isMain,
      company: companyData,
    });
  } catch (error) {
    console.error("❌ Branch code generate error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBranchesByCode = async (req, res) => {
  try {
    const { branchCode } = req.params;
    const branches = await Company.find({
      branchCode,
    });

    res.status(200).json({
      success: true,
      data: branches,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// controller/company.js
exports.joinBranch = async (req, res) => {
  try {
    const { companyId, branchCode } = req.body;

    if (!companyId || !branchCode) {
      return res.status(400).json({
        success: false,
        message: "companyId болон branchCode шаардлагатай",
      });
    }

    // Кодын формат шалгах (2 үсэг + 4 тоо)
    const regex = /^[A-Za-z]{2}[0-9]{4}$/;
    if (!regex.test(branchCode)) {
      return res.status(400).json({
        success: false,
        message: "Код буруу байна! Жишээ: AB1234",
      });
    }

    // тухайн кодтой салбаруудыг хайна
    const branch = await Company.findOne({ branchCode });
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Салбар олдсонгүй",
      });
    }

    // тухайн компанид код тохируулна
    const companyData = await Company.findById(companyId);
    if (!companyData) {
      return res.status(404).json({
        success: false,
        message: "Компанийн ID олдсонгүй",
      });
    }

    companyData.branchCode = branchCode;
    companyData.mainBranch = false; // энэ нь дэд салбар болж бүртгэгдэнэ
    companyData.discount = true; // 🔹 салбарт холбогдсон бол discount true болгоно
    await companyData.save();

    res.status(200).json({
      success: true,
      message: "Салбарт амжилттай холбогдлоо",
      company: companyData,
    });
  } catch (error) {
    console.error("❌ Join branch error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAll = asyncHandler(async (req, res, next) => {
  try {
    const categories = await Model.find()
      .populate("category")
      .populate("onlineContract");

    const allUser = await Fav.find({ user: req.userId });

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
  try {
    const old = await Model.findById(req.params.id);
    if (!old) {
      return res
        .status(404)
        .json({ success: false, message: "Company not found" });
    }

    // 🖼️ Logo
    const logo = req.files?.logo ? req.files.logo[0].filename : old.logo;

    // 🖼️ Slider
    let uploadedFiles = [];
    if (req.files?.sliderImages && Array.isArray(req.files.sliderImages)) {
      const newUploaded = req.files.sliderImages.map((f) => f.filename);
      const existingSliderImages = req.body.existingSliderImages;
      const oldImages = Array.isArray(existingSliderImages)
        ? existingSliderImages
        : existingSliderImages
        ? [existingSliderImages]
        : old.sliderImages;
      uploadedFiles = [...oldImages, ...newUploaded];
    } else {
      uploadedFiles = old.sliderImages;
    }

    let category;

    // Хэрэв шинэ category ирвэл түүнийг ашиглана
    if (req.body.category) {
      if (Array.isArray(req.body.category)) {
        category = req.body.category;
      } else {
        try {
          category = JSON.parse(req.body.category);
        } catch (e) {
          category = [req.body.category];
        }
      }
    } else {
      // Хэрэв ирээгүй бол хуучин хадгалсан category-г ашиглана
      category = old.category;
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
        category,
      },
      { new: true }
    );

    res.status(200).json({ success: true, data: company });
  } catch (error) {
    console.error("❌ update error:", error);
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

// ... бусад код дээр нь

exports.getActiveCompanies = asyncHandler(async (req, res) => {
  try {
    // зөвхөн status=0 болон status=1
    const companies = await Model.find({ status: { $in: [0, 1] } })
      .populate("category")
      .populate("onlineContract");

    res.status(200).json({
      success: true,
      count: companies.length,
      data: companies,
    });
  } catch (error) {
    console.error("❌ getActiveCompanies error:", error);
    customResponse.error(res, error.message);
  }
});
