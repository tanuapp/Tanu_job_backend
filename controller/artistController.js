const User = require("../models/artistModel");
const Company = require("../models/companyModel");
const asyncHandler = require("../middleware/asyncHandler");
const mongoose = require("mongoose");
exports.getAllUser = asyncHandler(async (req, res, next) => {
  try {
    const allUser = await User.find();
    const total = await User.countDocuments();
    res.status(200).json({
      success: true,
      count: total,
      data: allUser,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
exports.myService = asyncHandler(async (req, res) => {
  try {
    const artist = req.userId;
    const services = await User.findById(artist).populate("Service");

    if (services.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No services found for this company",
      });
    }

    return res.status(200).json({ success: true, data: services });
  } catch (error) {
    console.error("Error fetching company services:", error);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
});

exports.serviceSortByArtist = asyncHandler(async (req, res) => {
  const serviceId = req.params._id;
  const artist = await User.find({
    Service: { $in: serviceId },
  });
  res.status(200).json({
    success: true,
    data: artist,
  });
});

exports.sortByArtist = asyncHandler(async (req, res, next) => {
  try {
    const { companyId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({
        success: false,
        error: "Хүчинтэй компани ID биш",
      });
    }

    const total = await User.countDocuments();
    const companyArtist = await User.find({ Company: companyId });

    res.status(200).json({
      success: true,
      count: total,
      data: companyArtist,
    });
  } catch (error) {
    if (error.name === "CastError") {
      res.status(400).json({
        success: false,
        error: "ID-н алдаа",
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Серверийн алдаа: " + error.message,
      });
    }
  }
});

exports.getArtistCompany = asyncHandler(async (req, res, next) => {
  try {
    const total = await User.countDocuments();

    // Retrieve company associated with the current user
    const company = await Company.find({ companyCreater: req.userId });
    console.log(company[0]._id);
    if (!company) {
      // If no company found, respond with a suitable message
      return res.status(404).json({
        success: false,
        message: "Компани олдсонгүй",
      });
    }

    const companyArtist = await User.find({ Company: company[0]._id });

    res.status(200).json({
      success: true,
      count: total,
      data: companyArtist,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Серверийн алдаа: " + error.message,
    });
  }
});

exports.createUser = asyncHandler(async (req, res, next) => {
  try {
    const company = await Company.find({ companyCreater: req.userId });
    const existingUser = await User.findOne({ phone: req.body.phone });
    const exinstingEmail = await User.findOne({ email: req.body.email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "Утасны дугаар бүртгэлтэй байна",
      });
    }
    if (exinstingEmail) {
      return res.status(400).json({
        success: false,
        error: "И-мэйл бүртгэлтэй байна",
      });
    }
    console.log(req.files);

    const inputData = {
      ...req.body,
      photo: req.file?.filename ? req.file.filename : "no user photo",
      Company: company[0]._id,
    };
    const user = await User.create(inputData);
    const token = user.getJsonWebToken();
    res.status(200).json({
      success: true,
      token,
      data: user,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.Login = asyncHandler(async (req, res, next) => {
  try {
    const { phone, password } = req.body;

    const userphone = await User.find({ phone: phone });

    if (!userphone) {
      return res
        .status(404)
        .json({ success: falce, message: "Утасны дугаар бүртгэлгүй байна " });
    }

    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        msg: "Утасны дугаар  болон нууц үгээ оруулна уу!",
      });
    } else {
      const user = await User.findOne({ phone }).select("+password");
      if (!user) {
        return res.status(400).json({
          success: false,
          msg: "Утасны дугаар  эсвэл нууц үг буруу байна!",
        });
      }
      const isPasswordValid = await user.checkPassword(password);
      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          msg: "Утасны дугаар  эсвэл нууц үг буруу байна!",
        });
      }
      const token = user.getJsonWebToken();
      res.status(200).json({
        success: true,
        token,
        data: user,
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.updateUser = asyncHandler(async (req, res, next) => {
  try {
    const updatedData = {
      ...req.body,
      photo: req.file?.filename,
    };

    const upDateUserData = await User.findByIdAndUpdate(
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

exports.userDetail = asyncHandler(async (req, res, next) => {
  try {
    const allText = await User.findById(req.params.id);
    return res.status(200).json({
      success: true,
      data: allText,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.deleteUser = async function deleteUser(req, res, next) {
  try {
    const deletePost = await User.findOneAndDelete(req.params.id, {
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
