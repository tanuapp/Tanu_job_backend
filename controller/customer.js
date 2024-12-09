const User = require("../models/customer");
const Appointment = require("../models/appointment");
const asyncHandler = require("../middleware/asyncHandler");
const jwt = require("jsonwebtoken");
const sendMessage = require("../utils/callpro");
const { sendEmail } = require("../utils/mailService");

const customResponse = require("../utils/customResponse");
const OTP = require("../models/otp");
const Artist = require("../models/artist");

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
    customResponse.error(res, error.message);
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
    customResponse.error(res, error.message);
  }
});

exports.getMe = asyncHandler(async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      return res.status(200).json({
        success: false,
        message: "Та эхлээд нэвтрэнэ үү",
      });
    }
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      return res.status(200).json({
        success: false,
        message: "Токен хоосон байна",
      });
    }
    const tokenObj = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(tokenObj.Id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Хэрэглэгч олдсонгүй",
      });
    }
    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

exports.customerUpdateTheirOwnInformation = asyncHandler(
  async (req, res, next) => {
    try {
      if (req.userId != req.params.id) {
        return res.status(200).json({
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
      customResponse.error(res, error.message);
    }
  }
);

exports.registerWithPhone = asyncHandler(async (req, res, next) => {
  try {
    const { pin, phone } = req.body;

    if (!pin) {
      return res.status(200).json({
        success: false,
        message: "PIN кодоо оруулна уу",
      });
    }
    let existingUser = await User.findOne({ phone });

    if (existingUser) {
      res.status(400).json({
        success: false,
        message: "Утасны дугаар бүртгэлтэй байна",
      });
    }

    const inputData = {
      ...req.body,
      photo: req.file ? req.file.filename : "no-img.png",
    };

    const user = await User.create(inputData);

    const otp = generateOTP();
    if (existingUser) {
      await OTP.findByIdAndUpdate(
        {
          customer: user._id,
        },
        {
          otp,
          customer: user._id,
        }
      );
    } else {
      await OTP.create({
        otp,
        customer: user._id,
      });
    }

    await sendMessage(phone, `Таны нэг удаагийн нууц үг: ${otp}`);

    return res.status(200).json({
      success: true,
      message: "Бүртгэл амжилттай. Нэг удаагийн нууц үг илгээгдлээ",
    });
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

exports.registerWithEmail = asyncHandler(async (req, res, next) => {
  try {
    const { pin, email } = req.body;

    if (!pin) {
      return res.status(200).json({
        success: false,
        message: "PIN кодоо оруулна уу",
      });
    }
    let existingUser = await User.findOne({ email });

    if (existingUser) {
      res.status(400).json({
        success: false,
        message: "Утасны дугаар бүртгэлтэй байна",
      });
    }

    const inputData = {
      ...req.body,
      photo: req.file ? req.file.filename : "no-img.png",
    };

    const user = await User.create(inputData);

    const otp = generateOTP();
    if (existingUser) {
      await OTP.findByIdAndUpdate(
        {
          customer: user._id,
        },
        {
          otp,
          customer: user._id,
        }
      );
    } else {
      await OTP.create({
        otp,
        customer: user._id,
      });
    }

    await sendEmail(email, email, otp);

    // await sendMessage(phone, `Таны нэг удаагийн нууц үг: ${otp}`);

    return res.status(200).json({
      success: true,
      message: "Бүртгэл амжилттай. Нэг удаагийн нууц үг илгээгдлээ",
    });
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

// OTP verification endpoint
exports.registerVerify = asyncHandler(async (req, res, next) => {
  try {
    const { otp, phone, email, isEmail, count } = req.body;

    if (Number(count) < 3) {
      res.status(400).json({
        success: false,
        message: "Та түр хүлээн дахин оролдоно уу",
      });
    }

    let existingUser;

    if (isEmail && email) {
      existingUser = await User.findOne({ email });

      if (!existingUser) {
        return res.status(200).json({
          success: false,
          message: "Цахим хаяг бүртгэлгүй байна",
        });
      }
    } else {
      existingUser = await User.findOne({ phone });

      if (!existingUser) {
        return res.status(200).json({
          success: false,
          message: "Утасны дугаар бүртгэлгүй байна",
        });
      }
    }

    const userOtp = await OTP.findOne({
      customer: existingUser._id,
    });

    if (!userOtp) {
      return res.status(200).json({
        success: false,
        message: "OTP not found. Please request a new one.",
      });
    }

    // Correct OTP comparison
    if (otp !== userOtp.otp) {
      return res.status(200).json({
        success: false,
        message: "Буруу нэг удаагийн нууц үг",
      });
    }

    existingUser.status = true;
    await existingUser.save();

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
    customResponse.error(res, error.message);
  }
});

exports.loginWithPhone = asyncHandler(async (req, res, next) => {
  try {
    const { phone, pin } = req.body;

    if (!pin) {
      return res.status(200).json({
        success: false,
        message: "PIN кодоо оруулна уу",
      });
    }

    let user;

    user = await User.findOne({ phone }).select("+pin");
    const artist = await Artist.findOne({ phone }).select("+pin");
    if (!user && !artist) {
      customResponse.error(res, "Имейл бүртгэлгүй байна");
    }
    if (artist) {
      const isMatch = await artist.checkPassword(pin);

      if (!isMatch) {
        customResponse.error(res, "Нэвтрэх нэр эсвэл нууц үг буруу байна!");
      }

      const token = artist.getJsonWebToken();
      res.status(200).json({
        success: true,
        isArtist: true,
        token,
        data: artist,
      });
    }
    if (user) {
      const isMatch = await user.checkPassword(pin);

      if (!isMatch) {
        customResponse.error(res, "Нэвтрэх нэр эсвэл нууц үг буруу байна!");
      }

      const token = user.getJsonWebToken();
      res.status(200).json({
        success: true,
        isArtist: false,
        token,
        data: user,
      });
    }
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

exports.loginWithEmail = asyncHandler(async (req, res, next) => {
  try {
    const { email, pin } = req.body;

    if (!pin) {
      customResponse.error(res, "PIN кодоо оруулна уу");
    }

    const user = await User.findOne({ email }).select("+pin");
    const artist = await Artist.findOne({ email }).select("+pin");
    if (!user && !artist) {
      customResponse.error(res, "Имейл бүртгэлгүй байна");
    }
    if (artist) {
      const isMatch = await artist.checkPassword(pin);

      if (!isMatch) {
        customResponse.error(res, "Нэвтрэх нэр эсвэл нууц үг буруу байна!");
      }

      const token = artist.getJsonWebToken();
      res.status(200).json({
        success: true,
        isArtist: true,
        token,
        data: artist,
      });
    }
    if (user) {
      const isMatch = await user.checkPassword(pin);

      if (!isMatch) {
        customResponse.error(res, "Нэвтрэх нэр эсвэл нууц үг буруу байна!");
      }

      const token = user.getJsonWebToken();
      res.status(200).json({
        success: true,
        isArtist: false,
        token,
        data: user,
      });
    }
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

exports.validatePhone = asyncHandler(async (req, res, next) => {
  try {
    const { phone } = req.body;

    let user;

    user = await User.findOne({ phone }).select("+pin");
    if (!user) {
      customResponse.error(res, "Утас бүртгэлгүй байна");
    } else {
      return res.status(200).json({
        success: true,
      });
    }
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

exports.validateEmail = asyncHandler(async (req, res, next) => {
  try {
    const { email } = req.body;

    let user;

    user = await User.findOne({ email }).select("+pin");
    if (!user) {
      customResponse.error(res, "Утас бүртгэлгүй байна");
    } else {
      return res.status(200).json({
        success: true,
      });
    }
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

exports.updateUserFCM = asyncHandler(async (req, res, next) => {
  try {
    const { token, isAndroid } = req.body;

    const userFind = await User.findById(req.userId);

    if (!userFind) {
      customResponse.error(res, "Хэрэглэгч олдсонгүй");
    }

    userFind.firebase_token = token;
    userFind.isAndroid = isAndroid;
    await userFind.save();

    res.status(200).json({
      success: true,
    });
  } catch (error) {
    customResponse.error(res, error.message);
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
    customResponse.error(res, error.message);
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
    customResponse.error(res, error.message);
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
    customResponse.error(res, error.message);
  }
});
