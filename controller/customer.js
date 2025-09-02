const User = require("../models/customer");
const Appointment = require("../models/appointment");
const asyncHandler = require("../middleware/asyncHandler");
const jwt = require("jsonwebtoken");
const sendMessage = require("../utils/callpro");
const { sendEmail } = require("../utils/mailService");

const customResponse = require("../utils/customResponse");
const OTP = require("../models/otp");
const Artist = require("../models/artist");
const Company = require("../models/company");
const customer = require("../models/customer");

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

const validateEmail = async (email) => {
  const user = await User.findOne({ email }).select("+pin");
  return user ? true : false;
};

// Exports
exports.validatePhone = asyncHandler(async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return customResponse.error(res, "Утасны дугаараа оруулна уу");
  }

  const userExists = await validatePhone(phone);

  if (!userExists) {
    return customResponse.error(res, "Утас бүртгэлгүй байна");
  }

  return res.status(200).json({ success: true });
});

exports.getOtpAgain = asyncHandler(async (req, res, next) => {
  try {
    console.log("📥 [getOtpAgain] Request body:", req.body);
    const { phone } = req.body;

    // Шинэ OTP үүсгэх
    const otp = generateOTP();
    console.log("📞 Phone:", phone);
    console.log("🔑 Generated OTP:", otp);

    // Хуучин OTP байгаа эсэхийг шалгаад шинэчлэх эсвэл шинээр үүсгэх
    const existingOtp = await OTP.findOne({ phone });
    if (existingOtp) {
      await OTP.findOneAndUpdate({ phone }, { otp });
      console.log("♻️ Existing OTP шинэчлэгдлээ");
    } else {
      await OTP.create({
        otp,
        phone,
      });
      console.log("✅ Шинэ OTP бичигдлээ");
    }

    // SMS илгээх
    await sendMessage(phone, `Таны нэг удаагийн нууц үг: ${otp}`);
    console.log("📨 SMS sent to:", phone);

    res.status(200).json({
      success: true,
      message: "OTP амжилттай дахин илгээгдлээ",
    });
    console.log("✅ Response sent: success true");
  } catch (error) {
    console.error("🔥 [getOtpAgain] Error:", error);
    customResponse.server(res, error.message);
  }
});

exports.validateEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return customResponse.error(res, "Цахим хаягаа оруулна уу");
  }

  const userExists = await validateEmail(email);

  if (!userExists) {
    return customResponse.error(res, "Цахим хаяг бүртгэлгүй байна");
  }

  return res.status(200).json({ success: true });
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
  console.log("📥 [getCustomerAppointments] Called by user:", req.userId);

  try {
    // 1️⃣ Appointment хайж татах + schedule → service → company, artist-ийг populate хийх
    console.log("🔎 [1] Fetching appointments for user:", req.userId);
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
    console.log("✅ [3] Response sent successfully");
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
    const user = await User.findById(tokenObj.Id);
    const tokens = user.getJsonWebToken();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Хэрэглэгч олдсонгүй",
      });
    }
    console.log(user);
    console.log(tokens);
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
  console.log("📥 registerWithPhone called with body:", req.body);
  try {
    const { phone } = req.body;

    // 1. Хуучин бүртгэлтэй, баталгаажсан хэрэглэгч байна уу?
    const existingUser = await User.findOne({ phone, status: true });
    console.log(
      "🔍 Existing user found:",
      existingUser ? existingUser._id : null
    );
    if (existingUser) {
      console.log("❌ Already registered and verified. Sending 400.");
      const errorResponse = {
        success: false,
        message: "Утасны дугаар бүртгэлтэй байна",
      };
      console.log("📤 Response:", errorResponse);
      return res.status(400).json(errorResponse);
    }

    // 2. OTP үүсгэх
    const otp = generateOTP();

    const existingOtp = await OTP.findOne({ phone });
    if (existingOtp) {
      await OTP.updateOne({ phone }, { otp, data: req.body });
      console.log("♻️ Updated existing OTP record");
    } else {
      await OTP.create({ phone, otp, data: req.body });
      console.log("✅ Created new OTP record");
    }

    // 3. SMS илгээх
    await sendMessage(phone, `Таны нэг удаагийн нууц үг: ${otp}`);
    console.log("📤 Sent OTP SMS");

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
    const exinstingEmail = await User.findOne({ email: req.body.email });

    if (existingUser) {
      return res.status(200).json({
        success: false,
        message: "Утасны дугаар бүртгэлтэй байна",
      });
    }
    if (exinstingEmail) {
      return res.status(200).json({
        success: false,
        message: "И-мэйл бүртгэлтэй байна",
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
    console.log("📥 setPin called. Header:", authHeader);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ Authorization header буруу байна");
      return res.status(401).json({
        success: false,
        message: "Токен дамжуулаагүй байна",
      });
    }

    const token = authHeader.split(" ")[1];
    const { pin } = req.body;
    console.log("🔐 Decoding token:", token);

    if (!pin) {
      console.log("❌ PIN дутуу байна");
      return res.status(400).json({
        success: false,
        message: "PIN код дутуу байна",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Token decoded:", decoded);

    const user = await User.findById(decoded.Id);
    console.log("👤 User found:", user ? user._id : null);

    if (!user || !user.status) {
      console.log("❌ User not found or not verified");
      return res.status(403).json({
        success: false,
        message: "Хэрэглэгч баталгаажаагүй байна",
      });
    }

    user.pin = pin;
    await user.save();
    console.log("✅ PIN хадгалсан");

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
  const { phone, isEmail, email } = req.body;
  let user;
  if (isEmail) {
    user = await User.findOne({ email });
  } else {
    user = await User.findOne({ phone });
  }

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "Хэрэглэгч олдсонгүй эсвэл мэдээлэл буруу байна.",
    });
  }
  const otp = generateOTP();

  // console.log("otp", otp);

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
    if (isEmail) {
      await sendEmail(
        email,
        "Forgot Password OTP",
        `Таны нууц үг ${otp} болж шинэчлэгдлээ.`
      );
    } else {
      await sendMessage(phone, `Таны нууц үг ${otp} болж шинэчлэгдлээ.`);
    }
  } catch (error) {
    console.error("Error sending OTP:", error.message);
    return res.status(500).json({
      success: false,
      message: "OTP илгээх явцад алдаа гарлаа.",
    });
  }

  return res.status(200).json({
    success: true,
    message: `Амжилттай. Таны шинэ нууц үг бүртгэлтэй ${
      isEmail ? "email-руу" : "утас руу"
    } илгээгдлээ.`,
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

exports.loginWithEmail = asyncHandler(async (req, res, next) => {
  try {
    const { email, pin } = req.body;

    // Validate input
    if (!email || !pin) {
      return customResponse.error(res, "Имэйл болон PIN кодоо оруулна уу");
    }

    // Find user or artist by email
    const user = await User.findOne({ email }).select("+pin");
    const artist = await Artist.findOne({ email }).select("+pin");

    if (!user && !artist) {
      return customResponse.error(res, "Имейл бүртгэлгүй байна");
    }

    // Authenticate artist
    if (artist) {
      const isMatch = await artist.checkPassword(pin);
      if (!isMatch) {
        return customResponse.error(
          res,
          "Нэвтрэх нэр эсвэл нууц үг буруу байна!"
        );
      }

      const token = artist.getJsonWebToken();
      return res.status(200).json({
        success: true,
        isArtist: true,
        token,
        data: artist,
      });
    }

    // Authenticate user
    if (user) {
      const isMatch = await user.checkPassword(pin);
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
    }
  } catch (error) {
    return customResponse.error(res, error.message);
  }
});

exports.updateUserFCM = asyncHandler(async (req, res, next) => {
  try {
    console.log("🔹 updateUserFCM called");
    console.log("📩 Request body:", req.body);
    console.log("📌 req.userId:", req.userId);

    const { token, isAndroid } = req.body;
    console.log("✅ Extracted token:", token);
    console.log("✅ Extracted isAndroid:", isAndroid);

    const userFind = await User.findById(req.userId);
    console.log("👤 Found user:", userFind);

    if (userFind) {
      console.log("🛠 Updating user FCM & platform...");
      userFind.firebase_token = token;
      userFind.isAndroid = isAndroid;

      const savedUser = await userFind.save();
      console.log("💾 User saved:", savedUser);
    } else {
      console.log("⚠ No user found with ID:", req.userId);
    }

    console.log("✅ Sending success response");
    res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.log("❌ Error in updateUserFCM:", error);
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
