const Model = require("../models/agent");
const Company = require("../models/company");
const asyncHandler = require("../middleware/asyncHandler");
const customResponse = require("../utils/customResponse");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Otp = require("../models/agent-otp");
const crypto = require("crypto");
const sendMessage = require("../utils/callpro");


exports.sendOtp = asyncHandler(async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res
        .status(400)
        .json({ success: false, message: "Утасны дугаар шаардлагатай" });
    }

    // 🔍 Check if agent already exists
    const existing = await Model.findOne({ phone });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Дараах утасны дугаар  бүртгэлтэй байна.!",
      });
    }

    // ✅ Generate 4-digit OTP
    const code = Math.floor(1000 + Math.random() * 9000).toString();

    // Save OTP
    await Otp.create({ phone, otp: code });

    // Send via SMS
    await sendMessage(phone, `Таны нэг удаагийн нууц үг: ${code}`);

    res
      .status(200)
      .json({ success: true, message: "OTP амжилттай илгээгдлээ" });
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

// ------------------- Signup (OTP баталгаажуулах) -------------------
exports.signup = asyncHandler(async (req, res) => {
  try {
    const { name, email, phone, password, banks, bankNumber, otp } = req.body;

    const otpDoc = await Otp.findOne({ phone }).sort({ createdAt: -1 });
    if (!otpDoc) {
      return res.status(400).json({
        success: false,
        message: "OTP олдсонгүй эсвэл хугацаа дууссан",
      });
    }

    // ✅ Зөв OTP
    if (otpDoc.otp === otp) {
      // Агент код үүсгэх
      const lastAgent = await Model.findOne().sort({ createdAt: -1 }).limit(1);
      let lastNumber = 0;
      if (lastAgent && lastAgent.agent) {
        lastNumber = parseInt(lastAgent.agent.slice(2), 10);
      }
      const formattedCode = `AG${String(lastNumber + 1).padStart(6, "0")}`;

      const hashedPassword = await bcrypt.hash(password, 10);

      const newAgent = await Model.create({
        name,
        email,
        phone,
        banks,
        bankNumber,
        agent: formattedCode,
        password: hashedPassword,
      });

      // Амжилттай бол OTP устгана
      await Otp.deleteMany({ phone });

      return res.status(201).json({ success: true, data: newAgent });
    } else {
      // ❌ Буруу OTP
      otpDoc.attempts += 1;

      if (otpDoc.attempts >= 3) {
        // 3 удаа буруу → устгана
        await Otp.deleteMany({ phone });
        return res.status(400).json({
          success: false,
          message: "Та 3 удаа буруу OTP оруулсан тул дахин OTP авах хэрэгтэй",
        });
      }

      await otpDoc.save();
      return res.status(400).json({
        success: false,
        message: `OTP буруу байна. (${otpDoc.attempts}/3 оролдлого)`,
      });
    }
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

// ------------------- Signin (Phone + Password) -------------------
exports.signin = asyncHandler(async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Phone болон нууц үг шаардлагатай" });
    }

    const agent = await Model.findOne({ phone }).select("+password");
    if (!agent)
      return res
        .status(404)
        .json({ success: false, message: "Бүртгэл олдсонгүй!!!" });

    const isMatch = await bcrypt.compare(password, agent.password);
    if (!isMatch)
      return res
        .status(401)
        .json({ success: false, message: "Нууц үг буруу!!!" });

    const token = jwt.sign(
      { id: agent._id, agent: agent.agent },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      success: true,
      token,
      data: { id: agent._id, phone: agent.phone, agent: agent.agent },
    });
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

// ------------------- Password Reset -------------------
exports.resetPassword = asyncHandler(async (req, res) => {
  try {
    const { phone, otp, newPassword } = req.body;

    const validOtp = await Otp.findOne({ phone, otp });
    if (!validOtp) {
      return res
        .status(400)
        .json({ success: false, message: "OTP буруу эсвэл хугацаа дууссан" });
    }

    const agent = await Model.findOne({ phone });
    if (!agent)
      return res
        .status(404)
        .json({ success: false, message: "Бүртгэл олдсонгүй" });

    agent.password = await bcrypt.hash(newPassword, 10);
    await agent.save();

    await Otp.deleteMany({ phone });

    res
      .status(200)
      .json({ success: true, message: "Нууц үг амжилттай шинэчлэгдлээ" });
  } catch (error) {
    customResponse.error(res, error.message);
  }
});
exports.getAll = asyncHandler(async (req, res, next) => {
  try {
    const agents = await Model.find().lean();
    // Agent бүрийн компанийн тоог бодитоор тооцоолж шинэчилнэ
    const updatedAgents = await Promise.all(
      agents.map(async (agent) => {
        const total = await Company.countDocuments({ agent: agent.agent });

        await Model.findByIdAndUpdate(agent._id, {
          totalcompany: String(total),
        });

        return {
          ...agent,
          totalcompany: String(total),
        };
      })
    );

    const total = await Model.countDocuments();

    res.status(200).json({
      success: true,
      count: total,
      data: updatedAgents,
    });
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

exports.signup = asyncHandler(async (req, res, next) => {
  try {
    // Сүүлд үүссэн агентыг олж авна
    const lastAgent = await Model.findOne().sort({ createdAt: -1 }).limit(1);

    let lastNumber = 0;

    if (lastAgent && lastAgent.agent) {
      // "AG000123" → 123 болгон хөрвүүлж, дараагийн дугаар гаргана
      lastNumber = parseInt(lastAgent.agent.slice(2), 10);
    }

    const formattedCode = `AG${String(lastNumber + 1).padStart(6, "0")}`; // AG000001, AG000002 ...

    // Агентын мэдээлэл
    const inputData = {
      ...req.body,
      agent: formattedCode,
    };

    const newAgent = await Model.create(inputData);

    return res.status(200).json({
      success: true,
      data: newAgent,
    });
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

exports.update = asyncHandler(async (req, res, next) => {
  try {
    const updatedData = {
      ...req.body,
    };

    const upDateUserData = await Model.findByIdAndUpdate(
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
    const allText = await Model.findById(req.params.id);
    return res.status(200).json({
      success: true,
      data: allText,
    });
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

exports.deleteModel = async function deleteUser(req, res, next) {
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
};

// Энд дуусаж байгаа шүүү
