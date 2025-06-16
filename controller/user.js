const User = require("../models/user");
const Company = require("../models/company");
const asyncHandler = require("../middleware/asyncHandler");
const customResponse = require("../utils/customResponse");
const UserOtp = require("../models/userOtp");
const sendMessage = require("../utils/callpro");

function generateOTP(length = 4) {
  let otp = "";
  const characters = "0123456789";
  for (let i = 0; i < length; i++) {
    otp += characters[Math.floor(Math.random() * characters.length)];
  }
  return otp;
}

const validatePhone = async (phone) => {
  const user = await User.findOne({ phone }).select("+password");
  return !!user;
};

// Phone validation
exports.validatePhone = asyncHandler(async (req, res) => {
  const { phone } = req.body;
  if (!phone) return customResponse.error(res, "Утасны дугаараа оруулна уу");

  const exists = await validatePhone(phone);
  if (!exists) return customResponse.error(res, "Утас бүртгэлгүй байна");

  res.status(200).json({ success: true });
});

// Get OTP again
exports.getOtpAgain = asyncHandler(async (req, res) => {
  try {
    const { phone } = req.body;
    const user = await User.findOne({ phone });
    if (!user) return customResponse.error(res, "Хэрэглэгч олдсонгүй");

    const otp = generateOTP();
    await UserOtp.findOneAndUpdate(
      { user: user._id },
      { otp, user: user._id },
      { upsert: true }
    );

    await sendMessage(phone, `Таны нэг удаагийн нууц үг: ${otp}`);
    res.status(200).json({ success: true });
  } catch (error) {
    customResponse.server(res, error.message);
  }
});

// Register with phone
exports.registerWithPhone = asyncHandler(async (req, res, next) => {
  try {
    const { password, phone } = req.body;

    console.log(req.body);

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
      await UserOtp.findByIdAndUpdate(
        {
          user: user._id,
        },
        {
          otp,
          user: user._id,
        }
      );
    } else {
      await UserOtp.create({
        otp,
        user: user._id,
      });
    }

    await sendMessage(phone, `Таны нэг удаагийн нууц үг: ${otp}`);

    return res.status(200).json({
      success: true,
      message: "Бүртгэл амжилттай. Нэг удаагийн нууц үг илгээгдлээ",
    });
  } catch (error) {
    console.log(error);
    customResponse.error(res, error.message);
  }
});

exports.registerVerify = asyncHandler(async (req, res) => {
  try {
    const { otp, phone, count, password } = req.body;

    if (Number(count) < 3) {
      return res.status(400).json({
        success: false,
        message: "Та түр хүлээн дахин оролдоно уу",
      });
    }

    const user = await User.findOne({ phone });
    if (!user) return customResponse.error(res, "Утас бүртгэлгүй байна");

    const userOtp = await UserOtp.findOne({ user: user._id });
    if (!userOtp || userOtp.otp !== otp) {
      return res
        .status(200)
        .json({ success: false, message: "Буруу нэг удаагийн нууц үг" });
    }

    user.password = password;
    user.status = true;
    await user.save();

    const token = user.getJsonWebToken();
    await UserOtp.deleteOne({ user: user._id });

    res.status(200).json({ success: true, token, data: user });
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  const { phone } = req.body;

  const user = await User.findOne({ phone });
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "Хэрэглэгч олдсонгүй эсвэл мэдээлэл буруу байна.",
    });
  }
  const otp = generateOTP();

  await UserOtp.findOneAndUpdate(
    { user: user._id },
    { otp },
    { upsert: true, new: true }
  );

  try {
    await sendMessage(
      phone,
      `Таны  нууц үг сэргээхэд ашиглах баталгаажуулах  код: ${otp}`
    );
    return res.status(200).json({
      success: true,
      message: "Баталгаажуулах код амжилттай илгээгдлээ.",
    });
  } catch (error) {
    console.error("OTP илгээх алдаа:", error.message);
    return res.status(500).json({
      success: false,
      message: "OTP илгээх явцад алдаа гарлаа.",
    });
  }
});

exports.resetPasswordWithOtp = asyncHandler(async (req, res) => {
  const { phone, otp, newPassword } = req.body;

  const user = await User.findOne({ phone });
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "Хэрэглэгч олдсонгүй.",
    });
  }

  const userOtp = await UserOtp.findOne({ customer: user._id });
  if (!userOtp || userOtp.otp !== otp) {
    return res.status(400).json({
      success: false,
      message: "Баталгаажуулах код буруу байна.",
    });
  }

  user.password = newPassword;
  await user.save();

  await UserOtp.deleteOne({ customer: user._id });

  return res.status(200).json({
    success: true,
    message: "Нууц үг амжилттай шинэчлэгдлээ.",
  });
});

exports.loginWithPhone = asyncHandler(async (req, res, next) => {
  try {
    const { phone, password } = req.body;

    // Validate input
    if (!phone || !password) {
      return res.status(200).json({
        success: false,
        message: "Утасны дугаар болон нууц үгээ  оруулна уу",
      });
    }

    // Find user or artist by phone
    const user = await User.findOne({ phone }).select("+password");

    // await User.findOneAndUpdate(
    //   { phone },
    //   {
    //     password: "2211",
    //   }
    // );

    if (!user) {
      return customResponse.error(res, "Утасны дугаар бүртгэлгүй байна");
    }

    // Authenticate user

    const isMatch = await user.checkPassword(password);
    if (!isMatch) {
      return customResponse.error(
        res,
        "Нэвтрэх нэр эсвэл нууц үг буруу байна!"
      );
    }

    const token = user.getJsonWebToken();
    return res.status(200).json({
      success: true,
      isArtist: false,
      token,
      data: user,
    });
  } catch (error) {
    console.log(error);
    return customResponse.error(res, error.message);
  }
});

// OTRTSDFSF
// OTRTSDFSF
// OTRTSDFSF
// OTRTSDFSF

exports.getAll = asyncHandler(async (req, res, next) => {
  try {
    const allUser = await User.find().populate("userRole");
    const total = await User.countDocuments();
    res.status(200).json({
      success: true,
      count: total,
      data: allUser,
    });
  } catch (error) {
    customResponse.server(res, error.message);
  }
});
exports.getAdmin = asyncHandler(async (req, res) => {
  try {
    // 2. Бүх хэрэглэгчдийг userRole-тай нь хамт авчраад filter хийнэ
    const allUsers = await User.find().populate("userRole");

    const filteredUsers = allUsers.filter(
      (u) =>
        u.userRole?.user?.toString() === req.userId &&
        u._id.toString() !== req.userId // өөрийгөө хасна
    );

    return res.status(200).json({
      success: true,
      count: filteredUsers.length,
      data: filteredUsers,
    });
  } catch (error) {
    customResponse.server(res, error.message);
  }
});

exports.create = asyncHandler(async (req, res, next) => {
  try {
    console.log(req.body);
    console.log("create is here");
    const existingUser = await User.findOne({ phone: req.body.phone });

    if (existingUser) {
      return res.status(200).json({
        success: false,
        error: "Утасны дугаар бүртгэлтэй байна",
      });
    }

    const inputData = {
      ...req.body,
      permission: JSON.parse(req.body.permission || "[]") || [],
      photo: req.file?.filename ? req.file.filename : "no user photo",
    };

    const user = await User.create(inputData);
    const token = user.getJsonWebToken();
    res.status(200).json({
      success: true,
      token,
      data: user,
    });
  } catch (error) {
    customResponse.server(res, error.message);
  }
});

exports.Login = asyncHandler(async (req, res, next) => {
  try {
    console.log(req.body);
    const { phone, password } = req.body;

    const pop = Number(phone);

    const user = await User.findOne({ phone: pop }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Утасны дугаар бүртгэлгүй байна.",
      });
    }

    const isPasswordValid = await user.checkPassword(password);
    if (!isPasswordValid) {
      return res.status(200).json({
        success: false,
        message: "Нэвтрэх нэр эсвэл нууц үг буруу байна!",
      });
    }
    const token = user.getJsonWebToken();
    return res.status(200).json({
      success: true,
      token,
      data: user,
    });
  } catch (error) {
    customResponse.server(res, error.message);
  }
});
exports.updateUserFCM = asyncHandler(async (req, res, next) => {
  try {
    const { token, isAndroid } = req.body;

    console.log(req.userId);

    const userFind = await User.findById(req.userId);

    const artistFind = await Artist.findById(req.userId);
    console.log(userFind);

    if (!userFind && !artistFind) {
      return res.status(400).json({
        success: false,
        message: "Бүртгэлгүй",
      });
    }

    if (userFind) {
      userFind.firebase_token = token;
      userFind.isAndroid = isAndroid;
      await userFind.save();
    }
    if (artistFind) {
      artistFind.firebase_token = token;
      artistFind.isAndroid = isAndroid;
      await artistFind.save();
    }
    res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.log(error);
    customResponse.error(res, error.message);
  }
});
exports.update = asyncHandler(async (req, res, next) => {
  try {
    const updatedData = {
      ...req.body,
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
    customResponse.server(res, error.message);
    // res.status(200).json({ success: false, error: error.message });
  }
});

exports.get = asyncHandler(async (req, res, next) => {
  try {
    const allText = await User.findById(req.params.id).populate("userRole");
    const company = await Company.findOne({
      companyOwner: req.params.id,
    });

    const data = {
      ...allText,
      company,
    };
    return res.status(200).json({
      success: true,
      data: allText,
      company,
    });
  } catch (error) {
    customResponse.server(res, error.message);
  }
});
exports.checkPersonPhone = asyncHandler(async (req, res, next) => {
  try {
    const body = req.body;
    const existingUser = await User.findOne({ phone: body.phone });
    if (!existingUser) {
      return res.status(400).json({
        success: false,
        message: "Утас бүртгэлгүй байна",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Амжилттай",
    });
  } catch (error) {
    customResponse.error(res, error.message);
  }
});
exports.AdminLogin = asyncHandler(async (req, res, next) => {
  console.log("checkPersonPhone is here", req.body);

  try {
    const { phone, pin } = req.body;

    // 1. Check if phone and pin exist
    if (!phone || !pin) {
      return customResponse.error(
        res,
        "Утасны дугаар болон PIN кодыг оруулна уу!"
      );
    }

    // 2. Find user by phone and explicitly include the 'pin' field
    const user = await User.findOne({ phone }).select("+pin");

    if (!user) {
      return customResponse.error(
        res,
        "Утасны дугаар эсвэл нууц код буруу байна!"
      );
    }

    // 3. Compare input PIN with hashed pin
    const isPinValid = await user.checkPin(pin);
    console.log("isPinValid:", isPinValid);

    if (!isPinValid) {
      return customResponse.error(
        res,
        "Утасны дугаар эсвэл нууц код буруу байна!"
      );
    }

    // 4. Generate JWT token
    const token = user.getJsonWebToken();

    // 5. Send successful response
    return res.status(200).json({
      success: true,
      token,
      data: user,
    });
  } catch (error) {
    console.error("AdminLogin error:", error);
    return customResponse.error(res, error.message);
  }
});

exports.deleteModel = async function deleteUser(req, res, next) {
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
    customResponse.server(res, error.message);
  }
};
