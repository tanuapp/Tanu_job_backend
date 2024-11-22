const User = require("../models/customer");
const Appointment = require("../models/appointment");
const asyncHandler = require("../middleware/asyncHandler");
const jwt = require("jsonwebtoken");
// const admin = require("../server");
const sendMessage = require("../utils/callpro");
// const { generateOTP } = require("../utils/otpGenerator");
// const { getMessaging } = require("firebase-admin/messaging");

const OTP = require("../models/otp");

function generateOTP(length = 4) {
  let otp = "";
  const characters = "0123456789";

  for (let i = 0; i < length; i++) {
    otp += characters[Math.floor(Math.random() * characters.length)];
  }

  return otp;
}

exports.getAll = asyncHandler(async (req, res, next) => {
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

exports.getCustomerAppointments = asyncHandler(async (req, res, next) => {
  try {
    const allUser = await Appointment.find({
      user: req.userId,
    }).populate({
      path: "schedule", // First, populate the 'schedule' field
      populate: [
        {
          path: "serviceId",
          model: "Service",
        },
        {
          path: "artistId",
          model: "Artist", // Specify the model name for 'artistId'
        },
      ],
    });

    res.status(200).json({
      success: true,
      data: allUser,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.getMe = asyncHandler(async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      return res.status(401).json({
        success: false,
        msg: "Та эхлээд нэвтрэнэ үү",
      });
    }
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      return res.status(400).json({
        success: false,
        msg: "Токен хоосон байна",
      });
    }
    const tokenObj = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(tokenObj.Id);
    if (!user) {
      return res.status(404).json({
        success: false,
        msg: "Хэрэглэгч олдсонгүй",
      });
    }
    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.customerUpdateTheirOwnInformation = asyncHandler(
  async (req, res, next) => {
    try {
      if (req.userId != req.params.id) {
        return res.status(401).json({
          success: false,
          msg: "Та зөвхөн өөрийн мэдээллийг өөрчлөж болно",
        });
      }
      const old = await User.findById(req.params.id);
      const data = await User.findByIdAndUpdate(req.params.id, {
        ...req.body,
        photo: req.file ? req.file.filename : old.photo,
      });
      const token = old.getJsonWebToken();
      return res.status(200).json({
        success: true,
        data,
        token,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Registration endpoint
exports.register = asyncHandler(async (req, res, next) => {
  try {
    const { pin, phone } = req.body;

    if (!pin) {
      return res.status(400).json({
        success: false,
        msg: "PIN кодоо оруулна уу",
      });
    }

    const existingUser = await User.findOne({ phone });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "Утасны дугаар бүртгэлтэй байна",
      });
    }
    console.log(req.body);
    const inputData = {
      ...req.body,
      photo: req.file ? req.file.filename : "no-img.png",
    };
    const user = await User.create(inputData);

    // Generate OTP and save it in the database
    const otp = generateOTP();
    await OTP.create({
      otp,
      customer: user._id,
    });

    // Send OTP to the user's phone
    console.log(phone);
    await sendMessage(phone, `Таны нэг удаагийн нууц үг: ${otp}`);

    return res.status(200).json({
      success: true,
      msg: "Бүртгэл амжилттай. Нэг удаагийн нууц үг илгээгдлээ",
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// OTP verification endpoint
exports.registerVerify = asyncHandler(async (req, res, next) => {
  try {
    const { otp, phone } = req.body;

    const existingUser = await User.findOne({ phone });

    if (!existingUser) {
      return res.status(400).json({
        success: false,
        error: "Утасны дугаар бүртгэлгүй байна",
      });
    }

    const userOtp = await OTP.findOne({
      customer: existingUser._id,
    });

    if (!userOtp) {
      return res.status(400).json({
        success: false,
        msg: "OTP not found. Please request a new one.",
      });
    }

    // Correct OTP comparison
    if (otp !== userOtp.otp) {
      return res.status(400).json({
        success: false,
        msg: "Буруу нэг удаагийн нууц үг",
      });
    }

    // If OTP is correct, generate JWT token
    const token = existingUser.getJsonWebToken();

    // Optionally, delete the OTP after successful verification
    await OTP.deleteOne({ customer: existingUser._id });

    return res.status(200).json({
      success: true,
      token,
      data: existingUser,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

exports.Login = asyncHandler(async (req, res, next) => {
  try {
    const { phone, email, isEmail, pin } = req.body;

    if (!pin) {
      return res.status(200).json({
        success: false,
        message: "PIN кодоо оруулна уу",
      });
    }

    let user;

    if (isEmail && email) {
      user = await User.findOne({ email }).select("+pin");
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Имейл бүртгэлгүй байна",
        });
      }
    } else {
      user = await User.findOne({ phone }).select("+pin");
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Утасны дугаар бүртгэлгүй байна",
        });
      }
    }

    // Check if PIN matches
    const isMatch = await user.checkPassword(pin);

    console.log(isMatch);
    if (!isMatch) {
      return res.status(200).json({
        success: false,
        msg: "Нэвтрэх нэр эсвэл нууц үг буруу байна!",
      });
    }

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

exports.updateUserFCM = asyncHandler(async (req, res, next) => {
  try {
    // const { token, isAndroid } = req.body;
    console.log(req.body);

    const userFind = await User.findByIdAndUpdate(req.userId, req.body);

    // userFind.firebase_token = token;
    // userFind.isAndroid = isAndroid;
    // await userFind.save();

    res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.log(error);
    res.status(200).json({ success: false, error: error.message });
  }
});

exports.update = asyncHandler(async (req, res, next) => {
  try {
    const old = await User.findById(req.params.id);
    const updatedData = {
      ...req.body,
      photo: req.file ? req.file.filename : old.photo,
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

exports.get = asyncHandler(async (req, res, next) => {
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

exports.deleteModel = asyncHandler(async (req, res, next) => {
  try {
    const deletePost = await User.findByIdAndDelete(req.params.id, {
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
});
