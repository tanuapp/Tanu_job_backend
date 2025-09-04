const { isValidObjectId } = require("mongoose");
const Artist = require("../models/artist");
const asyncHandler = require("../middleware/asyncHandler");
const customResponse = require("../utils/customResponse");
const Service = require("../models/service");
const company = require("../models/company");
const User = require("../models/user");
const OTP = require("../models/artistOTP");
const sendMessage = require("../utils/callpro");
const BlacklistEntry = require("../models/blackList");

function truthy(x) {
  if (typeof x === "boolean") return x;
  const s = String(x || "").toLowerCase();
  return s === "1" || s === "true" || s === "yes";
}

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
    const allUser = await Artist.find();

    customResponse.success(res, allUser);
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

exports.create = asyncHandler(async (req, res) => {
  try {
    const { idNumber, companyId } = req.body;
    const force = truthy(req.query.force ?? req.body.force);

    if (!companyId) {
      return customResponse.error(res, "companyId заавал");
    }

    // sanitize optional
    if (!req.body.color || req.body.color.trim() === "") {
      delete req.body.color;
    }

    // -------- 1) Blacklist check by idNumber (public only) --------
    let hits = [];
    if (idNumber) {
      // Try to find an artist with this idNumber
      const matchedArtist = await Artist.findOne({ idNumber }).select(
        "_id first_name last_name idNumber"
      );
      if (matchedArtist) {
        const publicHits = await BlacklistEntry.find({
          artistId: matchedArtist._id,
          visibility: "public",
        })
          .sort({ createdAt: -1 })
          .populate({ path: "reportedByCompanyId", select: "name" })
          .lean();

        hits = publicHits.map((b) => ({
          entryId: b._id,
          reasonCode: b.reasonCode,
          reasonText: b.reasonText,
          severity: b.severity,
          repeatCount: b.repeatCount,
          reportedBy: b.reportedByCompanyId?.name,
          incidentDate: b.incidentDate,
          createdAt: b.createdAt,
        }));
      }
    }

    if (hits.length > 0 && !force) {
      // Ask client to confirm
      return res.status(409).json({
        success: false,
        code: "BLACKLIST_HIT",
        confirmRequired: true,
        message:
          "Дараах РД дугаартай иргэн blacklist-д бүртгэлтэй байна. Үргэлжлүүлэх үү?",
        data: hits,
      });
    }

    // -------- 2) Proceed with creation --------
    const comp = await company.findById(companyId);
    if (!comp) return customResponse.error(res, "Компанийн ID буруу");

    const inputData = {
      ...req.body,
      companyId: comp._id.toString(),
      photo: req.file?.filename ? req.file.filename : "no user photo",
    };

    const user = await Artist.create(inputData);

    // increment AFTER successful create
    comp.numberOfArtist = (comp.numberOfArtist || 0) + 1;
    await comp.save();

    // If you want to return created doc:
    // return res.status(201).json({ success: true, data: user, blacklisted: hits.length > 0 });
    return customResponse.success(
      res,
      hits.length > 0
        ? "Blacklist байгааг үл харгалзан амжилттай үүсгэв."
        : "Амжилттай үүсгэв."
    );
  } catch (error) {
    console.log(error);
    return customResponse.error(res, error.message);
  }
});

exports.checkArtistPhone = asyncHandler(async (req, res, next) => {
  try {
    const body = req.body;
    const existingUser = await Artist.findOne({ phone: body.phone }).select(
      "+pin"
    ); // ✅ pin-г заавал оруулж авна

    if (!existingUser) {
      return res.status(400).json({
        success: false,
        message: "Утас бүртгэлгүй байна",
      });
    }

    // ✅ Зөвхөн байхгүй үед л үүсгэнэ
    if (!existingUser.pin) {
      const newPin = generateOTP(4);
      existingUser.pin = newPin;
      await existingUser.save(); // pre("save") автоматаар hash хийнэ
      await sendMessage(body.phone, `Таны шинэ нууц код: ${newPin}`);

      return res.status(200).json({
        success: true,
        message: "Нууц код үүсэж таны дугаарт илгээгдлээ.",
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

exports.registerArtist = asyncHandler(async (req, res, next) => {
  try {
    let existingUser = await Artist.findOne({ phone: req.body.phone });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Утасны дугаар бүртгэлтэй байна",
      });
    }

    const body = req.body;
    const inputData = {
      ...body,
      photo: req.file?.filename ? req.file.filename : "no user photo",
    };

    const user = await Artist.create(inputData);

    const otp = generateOTP();

    // OTP update эсвэл шинээр үүсгэх
    let otpRecord = await OTP.findOne({ artist: user._id });
    if (otpRecord) {
      otpRecord.otp = otp;
      await otpRecord.save();
    } else {
      await OTP.create({
        otp,
        artist: user._id,
      });
    }

    await sendMessage(req.body.phone, `Таны нэг удаагийн нууц үг: ${otp}`);

    const token = user.getJsonWebToken();

    customResponse.success(res, user, token);
  } catch (error) {
    console.error("❌ Error in registerArtist:", error);
    customResponse.error(res, error.message);
  }
});

exports.Login = asyncHandler(async (req, res, next) => {
  try {
    const { phone, pin } = req.body;

    // Validate if phone and pin are provided
    if (!phone || !pin) {
      return customResponse.error(
        res,
        "Утасны дугаар болон нууц үгээ оруулна уу!"
      );
    }

    // Check if user exists
    const user = await Artist.findOne({ phone }).select("+pin");

    if (!user) {
      return customResponse.error(
        res,
        "Утасны дугаар эсвэл нууц үг буруу байна!"
      );
    }

    if (!user.pin) {
      return res.status(400).json({
        success: false,
        message:
          "Энэ дугаар дээр нууц код үүсээгүй байна. 'Нууц код сэргээх' үйлдлийг ашиглана уу.",
      });
    }

    // ✅ Pin байгаа бол шалгана
    const isPinValid = await user.checkPin(pin);

    if (!isPinValid) {
      return customResponse.error(res, "Таны оруулсан нууц код буруу байна!");
    }

    const token = user.getJsonWebToken();

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

exports.update = asyncHandler(async (req, res, next) => {
  try {
    const artistId = req.params.id;
    const updatedData = { ...req.body };

    if (req.file?.filename) {
      updatedData.photo = req.file.filename;
    }

    // ✅ companyNumber ирсэн бол компани хайж холбох
    if (req.body.companyNumber) {
      const foundCompany = await company.findOne({
        companyNumber: req.body.companyNumber, // ⬅️ String хайлт
      });

      if (!foundCompany) {
        return res.status(400).json({
          success: false,
          message: "Компанийн дугаар буруу байна",
        });
      }

      // 🧷 companyId онооно
      updatedData.companyId = foundCompany._id;
    }

    const updatedArtist = await Artist.findByIdAndUpdate(
      artistId,
      updatedData,
      { new: true }
    );

    if (!updatedArtist) {
      return res.status(404).json({
        success: false,
        message: "Artist олдсонгүй",
      });
    }

    customResponse.success(res, updatedArtist);
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

exports.artistUpdateTheirOwnInformation = asyncHandler(
  async (req, res, next) => {
    try {
      // Хэрэглэгч зөвхөн өөрийнхөө мэдээллийг өөрчилж болохыг шалгах
      // if (req.userId != req.params.id) {
      //   return res.status(200).json({
      //     success: false,
      //     msg: "Та зөвхөн өөрийн мэдээллийг өөрчлөж болно",
      //   });
      // }

      const old = await Artist.findById(req.params.id);
      if (!old) {
        return res.status(404).json({
          success: false,
          msg: "Artist not found",
        });
      }

      const updateData = {
        ...req.body,
        photo: req.file ? req.file.filename : old.photo,
      };

      const data = await Artist.findByIdAndUpdate(req.params.id, updateData, {
        new: true, // ✅ шинэчилсэн document буцаана
        runValidators: true,
      });

      const token = old.getJsonWebToken();

      return res.status(200).json({
        success: true,
        data,
        token,
      });
    } catch (error) {
      console.error("Error in artistUpdateTheirOwnInformation:", error);
      customResponse.error(res, error.message);
    }
  }
);

exports.get = asyncHandler(async (req, res, next) => {
  try {
    const allText = await Artist.findById(req.params.id);
    return res.status(200).json({
      success: true,
      data: allText,
    });
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

exports.getArtistServices = asyncHandler(async (req, res, next) => {
  try {
    const allText = await Service.find();

    const data = allText.filter((list) =>
      list.artistId.includes(req.params.id)
    );

    customResponse.success(res, data);
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

exports.deleteModel = async function deleteUser(req, res, next) {
  try {
    const deletePost = await User.findByIdAndDelete(req.params.id, {
      new: true,
    });

    customResponse.success(res, deletePost);
  } catch (error) {
    customResponse.error(res, error.message);
  }
};

exports.deleteArtist = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return customResponse.error(res, "Invalid artist id", 400);
    }

    // If your API is company-scoped
    const companyId = req.user?.companyId || req.body?.companyId;
    const filter = companyId ? { _id: id, companyId } : { _id: id };

    const deleted = await Artist.findOneAndDelete(filter);
    if (!deleted) {
      return customResponse.error(res, "Artist not found", 404);
    }

    return customResponse.success(res, { _id: deleted._id });
    // or: return res.status(204).send();
  } catch (err) {
    return customResponse.error(res, err.message || "Server error", 500);
  }
};

exports.registerVerify = asyncHandler(async (req, res, next) => {
  try {
    const { otp, phone, count, pin } = req.body;

    if (Number(count) < 3) {
      return res.status(400).json({
        success: false,
        message: "Та түр хүлээн дахин оролдоно уу",
      });
    }

    const existingUser = await Artist.findOneAndUpdate({ phone }, { pin });
    if (!existingUser) {
      console.log("Утасны дугаар бүртгэлгүй байна");
      return res.status(200).json({
        success: false,
        message: "Утасны дугаар бүртгэлгүй байна",
      });
    }

    const userOtp = await OTP.findOne({
      artist: existingUser._id,
    });
    // console.log("yavaa otp verufy4",artist)

    if (!userOtp) {
      // Шинээр нэмэх нөхцөл
      if (existingUser.status === true) {
        return res.status(200).json({
          success: true,
          token: existingUser.getJsonWebToken(),
          data: existingUser,
        });
      }

      return res.status(200).json({
        success: false,
        message: "OTP not found. Please request a new one.",
      });
    }

    // Correct OTP comparison
    if (otp !== userOtp.otp) {
      return res.status(200).json({
        success: false,
        message: "Таны баталгаажуулах код буруу байна. Дахин оролдоно уу.",
      });
    }

    existingUser.status = true;
    await existingUser.save();

    // If OTP is correct, generate JWT token
    const token = existingUser.getJsonWebToken();

    // Optionally, delete the OTP after successful verification
    await OTP.deleteOne({ artist: existingUser._id });
    return res.status(200).json({
      success: true,
      token,
      data: existingUser,
    });
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

exports.updateArtistFCM = asyncHandler(async (req, res, next) => {
  try {
    const { token, isAndroid } = req.body;

    const userFind = await Artist.findById(req.userId);

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
    console.log("❌ Error in updateUserFCM:", error);
    customResponse.error(res, error.message);
  }
});

exports.clearFCM = asyncHandler(async (req, res, next) => {
  try {
    const { token, isAndroid } = req.body;

    const artistFind = await Artist.findOne({ _id: req.userId });

    if (!token) {
      return res.status(404).json({
        success: false,
        message: "token  олдсонгүй",
      });
    }

    // Хэрвээ FCM токен тохирохгүй байвал шууд OK буцаана
    if (artistFind.firebase_token !== token) {
      return res.status(200).json({
        success: true,
        message: "FCM token давхцахгүй, устгах шаардлагагүй",
      });
    }

    artistFind.firebase_token = null;
    artistFind.isAndroid = null;
    await artistFind.save();

    return res.status(200).json({
      success: true,
      message: "FCM token амжилттай устгагдлаа",
    });
  } catch (error) {
    console.error("FCM clear error:", error);
    customResponse.error(res, error.message);
  }
});

exports.forgotPin = asyncHandler(async (req, res) => {
  const { phone } = req.body;

  try {
    const user = await Artist.findOne({ phone }).select("+pin");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Хэрэглэгч олдсонгүй." });
    }

    // Шинэ OTP
    const otp = generateOTP(4);

    // 🔑 Hash хийхгүй, шууд plain онооно
    user.pin = otp;
    await user.save(); // pre("save") автоматаар hash хийнэ

    await sendMessage(phone, `Таны шинэ нууц код: ${otp}`);

    return res.status(200).json({
      success: true,
      message: "Шинэ нууц код таны утас руу амжилттай илгээгдлээ.",
    });
  } catch (error) {
    console.error("forgotPin error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Алдаа гарлаа. Дахин оролдоно уу." });
  }
});

exports.getPersonType = asyncHandler(async (req, res, next) => {
  try {
    const person = await User.findById(req.userId);
    const artist = await Artist.findById(req.userId);

    if (person) {
      return res.status(200).json({
        success: true,
        data: { type: false }, // Company (Person user)
      });
    }

    if (artist) {
      return res.status(200).json({
        success: true,
        data: { type: true }, // Artist user
      });
    }

    return res.status(401).json({
      success: false,
      msg: "Та эхлээд нэвтрэнэ үү",
    });
  } catch (error) {
    customResponse.error(res, error.message);
  }
});
// Энд дуусаж байгаа шүүү
