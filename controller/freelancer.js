const Freelancer = require("../models/freelancer");
const Appointment = require("../models/appointment");
const asyncHandler = require("../middleware/asyncHandler");
const jwt = require("jsonwebtoken");
const sendMessage = require("../utils/callpro");

const customResponse = require("../utils/customResponse");
const OTP = require("../models/freelancerOTP");

function generateOTP(length = 4) {
  let otp = "";
  const characters = "0123456789";

  for (let i = 0; i < length; i++) {
    otp += characters[Math.floor(Math.random() * characters.length)];
  }

  return otp;
}

// Exports
exports.validatePhone = asyncHandler(async (req, res) => {
  const { phone } = req.body;
  console.log("✌️phone --->", phone);
  if (!phone) return customResponse.error(res, "Утасны дугаараа оруулна уу");

  const user = await Freelancer.findOne({ phone }).select("+pin");
  if (!user) return customResponse.error(res, "Утас бүртгэлгүй байна");

  return res.status(200).json({ success: true });
});

exports.getOtpAgain = asyncHandler(async (req, res) => {
  try {
    const { phone } = req.body;
    const otp = generateOTP();

    await OTP.findOneAndUpdate(
      { phone, type: "freelancer" },
      { otp },
      { upsert: true }
    );

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
    const allUser = await Freelancer.find();
    const total = await Freelancer.countDocuments();
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
    // 1️⃣ Appointment хайж татах + schedule → service → company, artist-ийг populate хийх
    const allAppointments = await Appointment.find({
      user: req.userId,
      status: { $in: ["paid", "done", "completed", "pending"] },
    })
      .populate({
        path: "schedule",
        populate: [
          { path: "serviceId" },
          { path: "artistId" },
          { path: "companyId" }, // Schedule → company
        ],
      })
      .populate("company"); // Appointment → company

    // 3️⃣ Эцсийн үр дүнг буцаах
    res.status(200).json({
      success: true,
      data: allAppointments,
    });
  } catch (error) {
    console.error("❌ [ERROR] getCustomerAppointments:", error.message);
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
    const user = await Freelancer.findById(tokenObj.Id);
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
      const old = await Freelancer.findById(req.params.id);
      const data = await Freelancer.findByIdAndUpdate(req.params.id, {
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

    const existingUser = await Freelancer.findOne({ phone, status: true });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Утасны дугаар бүртгэлтэй байна",
      });
    }

    const otp = generateOTP();

    await OTP.findOneAndUpdate(
      { phone, type: "freelancer" },
      { otp, data: req.body, type: "freelancer" },
      { upsert: true }
    );

    await sendMessage(phone, `Таны нэг удаагийн нууц үг: ${otp}`);

    return res.status(200).json({
      success: true,
      message: "OTP илгээгдлээ",
    });
  } catch (error) {
    console.error("🔥 registerWithPhone error:", error);
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
    const existingUser = await Freelancer.findOne({ phone: req.body.phone });

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

    const user = await Freelancer.create(inputData);
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
    console.log("✌️otp --->", otp);
    console.log("✌️phone --->", phone);

    const userOtp = await OTP.findOne({ phone, type: "freelancer" });
    if (!userOtp || userOtp.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "OTP буруу эсвэл хугацаа дууссан байна.",
      });
    }

    let user = await Freelancer.findOne({ phone });
    console.log("✌️user --->", user);
    if (user) {
      await OTP.deleteOne({ phone, type: "freelancer" });
      return res.status(200).json({
        success: true,
        message: "Баталгаажсан байна",
        token: user.getJsonWebToken(),
        data: user,
      });
    }

    // OTP дээр хадгалсан мэдээллээр хэрэглэгч үүсгэнэ
    user = await Freelancer.create(userOtp.data);
    console.log("✌️user --->", user);
    await OTP.deleteOne({ phone, type: "freelancer" });

    return res.status(200).json({
      success: true,
      message: "OTP амжилттай баталгаажсан. Хэрэглэгч бүртгэгдлээ.",
      token: user.getJsonWebToken(),
      data: user,
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

    const user = await Freelancer.findById(decoded.Id);

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

  user = await Freelancer.findOne({ phone });

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

    if (!phone) {
      return customResponse.error(res, "Утасны дугаараа оруулна уу!");
    }

    // 📌 Хэрэглэгч хайна
    const user = await Freelancer.findOne({ phone }).select("+pin");

    if (!user) {
      return customResponse.error(res, "Утасны дугаар бүртгэлгүй байна");
    }

    // 📌 Хэрвээ хэрэглэгчийн pin байхгүй бол → автоматаар үүсгээд SMS илгээнэ
    if (!user.pin) {
      const generatedPin = generateOTP(4);
      const hashedPin = await user.hashPin(generatedPin);

      await Freelancer.updateOne({ _id: user._id }, { pin: hashedPin });

      await sendMessage(
        phone,
        `Таны нэвтрэх нэг удаагийн нууц код: ${generatedPin}`
      );

      return res.status(200).json({
        success: false,
        message:
          "Таны нууц код үүсэж бүртгэлтэй дугаарт илгээгдлээ. Дахин оролдоно уу.",
      });
    }

    // 📌 Pin байгаа тохиолдолд шалгана
    if (!pin) {
      return customResponse.error(res, "PIN кодоо оруулна уу!");
    }

    const isMatch = await user.checkPassword(pin);
    if (!isMatch) {
      return customResponse.error(res, "Таны оруулсан нууц код буруу байна!");
    }

    // 📌 JWT үүсгэж буцаана
    const token = user.getJsonWebToken();
    return res.status(200).json({
      success: true,
      isArtist: false,
      token,
      data: user,
    });
  } catch (error) {
    console.error("loginWithPhone error:", error);
    return customResponse.error(res, error.message);
  }
});

exports.updateUserFCM = asyncHandler(async (req, res, next) => {
  try {
    const { token, isAndroid } = req.body;

    const userFind = await Freelancer.findById(req.userId);

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
    const old = await Freelancer.findById(req.params.id);
    const updatedData = {
      ...req.body,
      photo: req.file ? req.file.filename : old.photo,
    };

    const upDateUserData = await Freelancer.findByIdAndUpdate(
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
    const allText = await Freelancer.findById(req.params.id);
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
    const deletePost = await Freelancer.findByIdAndDelete(req.params.id, {
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
