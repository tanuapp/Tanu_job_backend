const User = require("../models/customer");
const Appointment = require("../models/appointment");
const asyncHandler = require("../middleware/asyncHandler");
const jwt = require("jsonwebtoken");
const sendMessage = require("../utils/callpro");

const customResponse = require("../utils/customResponse");
const OTP = require("../models/otp");
const Order = require("../models/order");

function generateOTP(length = 4) {
  let otp = "";
  const characters = "0123456789";

  for (let i = 0; i < length; i++) {
    otp += characters[Math.floor(Math.random() * characters.length)];
  }

  return otp;
}

const validatePhone = async (phone) => {
  const user = await User.findOne({ phone }).select("+pin");
  return user ? true : false;
};

// Exports
exports.validatePhone = asyncHandler(async (req, res) => {
  const { phone } = req.body;
  console.log("✌️phone --->", phone);

  if (!phone) {
    return customResponse.error(res, "Утасны дугаараа оруулна уу");
  }

  const userExists = await validatePhone(phone);
  console.log("✌️userExists --->", userExists);

  if (!userExists) {
    return customResponse.error(res, "Утас бүртгэлгүй байна");
  }

  return res.status(200).json({ success: true });
});

exports.getOtpAgain = asyncHandler(async (req, res, next) => {
  try {
    const { phone } = req.body;

    // Шинэ OTP үүсгэх
    const otp = generateOTP();

    // Хуучин OTP байгаа эсэхийг шалгаад шинэчлэх эсвэл шинээр үүсгэх
    const existingOtp = await OTP.findOne({ phone });
    if (existingOtp) {
      await OTP.findOneAndUpdate({ phone }, { otp });
    } else {
      await OTP.create({
        otp,
        phone,
      });
    }

    // SMS илгээх
    await sendMessage(phone, `Таны нэг удаагийн нууц үг: ${otp}`);

    res.status(200).json({
      success: true,
      message: "OTP амжилттай дахин илгээгдлээ",
    });
  } catch (error) {
    console.error("🔥 [getOtpAgain] Error:", error);
    customResponse.server(res, error.message);
  }
});

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

exports.getCustomerAppointments = asyncHandler(async (req, res) => {
  try {
    const userId = req.userId;
    const { platform } = req.query; // ?platform=job | business

    let data = [];

    if (platform === "job") {
      // 🧠 JOB PLATFORM (freelancer orders)
      data = await Order.find({
        user: userId,
        status: { $in: ["pending", "paid", "accepted", "done", "completed"] },
      })
        .populate("freelancer") // connect freelancer info
        .populate("service") // array of services
        .sort({ createdAt: -1 });
    } else {
      // 🏢 BUSINESS PLATFORM (salon/company appointments)
      data = await Appointment.find({
        user: userId,
        status: { $in: ["pending", "paid", "advance", "done", "completed"] },
      })
        .populate({
          path: "schedule",
          populate: [
            { path: "serviceId" },
            { path: "artistId" },
            { path: "companyId" },
          ],
        })
        .populate("company")
        .sort({ createdAt: -1 });
    }

    res.status(200).json({
      success: true,
      platform: platform || "business",
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("❌ [ERROR] getCustomerAppointments:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
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
    const tokens = user.getJsonWebToken();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Хэрэглэгч олдсонгүй",
      });
    }
    return res.status(200).json({
      success: true,
      data: user,
      token: tokens,
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

exports.registerWithPhone = asyncHandler(async (req, res) => {
  try {
    const { phone } = req.body;

    // 1. Хуучин бүртгэлтэй, баталгаажсан хэрэглэгч байна уу?
    const existingUser = await User.findOne({ phone, status: true });

    if (existingUser) {
      const errorResponse = {
        success: false,
        message: "Утасны дугаар бүртгэлтэй байна",
      };
      return res.status(400).json(errorResponse);
    }

    // 2. OTP үүсгэх
    const otp = generateOTP();

    const existingOtp = await OTP.findOne({ phone });
    if (existingOtp) {
      await OTP.updateOne({ phone }, { otp, data: req.body });
    } else {
      await OTP.create({ phone, otp, data: req.body });
    }

    // 3. SMS илгээх
    await sendMessage(phone, `Таны нэг удаагийн нууц үг: ${otp}`);

    // 4. Хариу илгээх
    return res.status(200).json({
      success: true,
      message: "OTP илгээгдлээ",
    });
  } catch (error) {
    console.error("🔥 Error occurred in registerWithPhone:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Дотоод серверийн алдаа",
    });
  }
});

exports.register = asyncHandler(async (req, res, next) => {
  try {
    if (!req.body.pin) {
      customResponse.error(res, "Та пин оруулж өгнө үү ");
    }
    const existingUser = await User.findOne({ phone: req.body.phone });

    if (existingUser) {
      return res.status(200).json({
        success: false,
        message: "Утасны дугаар бүртгэлтэй байна",
      });
    }

    const inputData = {
      ...req.body,
      photo: req.file?.filename ? req.file.filename : "no user photo",
    };

    const user = await User.create(inputData);
    const token = user.getJsonWebToken();

    customResponse.success(res, "Амжилттай хүсэлт илгээлээ");
  } catch (error) {
    console.log(error);
    customResponse.error(res, error.message);
  }
});

// OTP verification endpoint
exports.verifyOtp = asyncHandler(async (req, res) => {
  try {
    const { phone, otp } = req.body;

    const userOtp = await OTP.findOne({ phone });
    if (!userOtp || userOtp.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "OTP буруу эсвэл хугацаа дууссан байна.",
      });
    }

    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      await OTP.deleteOne({ phone });
      return res.status(200).json({
        success: true,
        message: "Баталгаажсан байна",
        token: existingUser.getJsonWebToken(),
        data: existingUser,
      });
    }

    // ✅ OTP дээр хадгалсан өгөгдлөөр бүрэн хэрэглэгч үүсгэнэ
    const newUser = await User.create(userOtp.data);

    await OTP.deleteOne({ phone });

    return res.status(200).json({
      success: true,
      message: "OTP амжилттай баталгаажсан. Хэрэглэгч бүртгэгдлээ.",
      token: newUser.getJsonWebToken(),
      data: newUser,
    });
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

exports.setPin = asyncHandler(async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ Authorization header буруу байна");
      return res.status(401).json({
        success: false,
        message: "Токен дамжуулаагүй байна",
      });
    }

    const token = authHeader.split(" ")[1];
    const { pin } = req.body;

    if (!pin) {
      console.log("❌ PIN дутуу байна");
      return res.status(400).json({
        success: false,
        message: "PIN код дутуу байна",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.Id);

    if (!user || !user.status) {
      return res.status(403).json({
        success: false,
        message: "Хэрэглэгч баталгаажаагүй байна",
      });
    }

    user.pin = pin;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "PIN амжилттай хадгалагдлаа",
      token, // ← энэ дутагдаж байна!
      data: user,
    });
  } catch (error) {
    console.error("🔥 setPin алдаа:", error.message);
    customResponse.error(res, error.message);
  }
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  const { phone } = req.body;
  let user;

  user = await User.findOne({ phone });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "Хэрэглэгч олдсонгүй эсвэл мэдээлэл буруу байна.",
    });
  }
  const otp = generateOTP();

  try {
    user.pin = otp;
    await user.save();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Хэрэглэгчийн мэдээллийг хадгалах явцад алдаа гарлаа.",
    });
  }

  try {
    await sendMessage(phone, `Таны нууц үг ${otp} болж шинэчлэгдлээ.`);
  } catch (error) {
    console.error("Error sending OTP:", error.message);
    return res.status(500).json({
      success: false,
      message: "OTP илгээх явцад алдаа гарлаа.",
    });
  }

  return res.status(200).json({
    success: true,
    message: `Амжилттай. Таны шинэ нууц үг бүртгэлтэй утас руу илгээгдлээ.`,
  });
});

exports.loginWithPhone = asyncHandler(async (req, res, next) => {
  try {
    const { phone, pin } = req.body;

    // Validate input
    if (!phone || !pin) {
      return res.status(200).json({
        success: false,
        message: "Утасны дугаар болон PIN кодоо оруулна уу",
      });
    }

    // Find user or artist by phone
    const user = await User.findOne({ phone }).select("+pin");

    // await User.findOneAndUpdate(
    //   { phone },
    //   {
    //     pin: "2211",
    //   }
    // );

    if (!user) {
      return customResponse.error(res, "Утасны дугаар бүртгэлгүй байна");
    }

    // Authenticate user

    const isMatch = await user.checkPassword(pin);
    if (!isMatch) {
      return customResponse.error(res, "Нууц үг буруу байна!");
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

exports.updateUserFCM = asyncHandler(async (req, res, next) => {
  try {
    const { token, isAndroid } = req.body;

    const userFind = await User.findById(req.userId);

    if (userFind) {
      userFind.firebase_token = token;
      userFind.isAndroid = isAndroid;

      const savedUser = await userFind.save();
    } else {
    }

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
