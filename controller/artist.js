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
    console.log(body);

    const existingUser = await Artist.findOne({ phone: body.phone });
    if (!existingUser) {
      return res.status(400).json({
        success: false,
        message: "Утас бүртгэлгүй байна ",
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
exports.checkArtistEmail = asyncHandler(async (req, res, next) => {
  try {
    const body = req.body;
    const existingUser = await Artist.findOne({ email: body.email });
    if (!existingUser) {
      return res.status(400).json({
        success: false,
        message: "И-мэйл бүртгэлтгүй байна",
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
    console.log("==== [REGISTER ARTIST API] ====");
    console.log("📥 Request Body:", req.body);
    console.log("📷 File:", req.file);

    let existingUser = await Artist.findOne({ phone: req.body.phone });
    if (existingUser) {
      console.log("⚠️ User already exists with phone:", req.body.phone);
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

    console.log("📝 Prepared Artist Data:", inputData);

    const user = await Artist.create(inputData);
    console.log("✅ Artist created successfully:", user._id);

    const otp = generateOTP();
    console.log("🔑 Generated OTP:", otp);

    // OTP update эсвэл шинээр үүсгэх
    let otpRecord = await OTP.findOne({ artist: user._id });
    if (otpRecord) {
      console.log("♻️ Updating existing OTP record for artist:", user._id);
      otpRecord.otp = otp;
      await otpRecord.save();
    } else {
      console.log("➕ Creating new OTP record for artist:", user._id);
      await OTP.create({
        otp,
        artist: user._id,
      });
    }

    console.log("📲 Sending OTP SMS to:", req.body.phone);
    await sendMessage(req.body.phone, `Таны нэг удаагийн нууц үг: ${otp}`);

    const token = user.getJsonWebToken();
    console.log("🔒 Generated JWT Token:", token);

    console.log("==== [REGISTER ARTIST SUCCESS] ====");
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

    // Check user status
    if (user.status === false) {
      return customResponse.error(
        res,
        "Байгууллагаас таныг зөвшөөрөөгүй байна!"
      );
    }

    // Verify password/pin
    const isPasswordValid = await user.checkPassword(pin);
    console.log(isPasswordValid);
    if (!isPasswordValid) {
      return customResponse.error(
        res,
        "Утасны дугаар эсвэл нууц үг буруу байна!"
      );
    }

    console.log("end irjin");

    // Generate token
    const token = user.getJsonWebToken();
    return customResponse.success(res, user, token);
  } catch (error) {
    return customResponse.error(res, error.message);
  }
});

exports.update = asyncHandler(async (req, res, next) => {
  console.log("req.body:", req.body);
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
      console.log("========== Artist Update Their Own Info ==========");
      console.log("req.params.id:", req.params.id);
      console.log("req.body:", req.body);

      // Хэрэглэгч зөвхөн өөрийнхөө мэдээллийг өөрчилж болохыг шалгах
      // if (req.userId != req.params.id) {
      //   return res.status(200).json({
      //     success: false,
      //     msg: "Та зөвхөн өөрийн мэдээллийг өөрчлөж болно",
      //   });
      // }

      const old = await Artist.findById(req.params.id);
      if (!old) {
        console.log("Artist not found with id:", req.params.id);
        return res.status(404).json({
          success: false,
          msg: "Artist not found",
        });
      }

      console.log("Old artist data:", old);

      const updateData = {
        ...req.body,
        photo: req.file ? req.file.filename : old.photo,
      };
      console.log("Final update data:", updateData);

      const data = await Artist.findByIdAndUpdate(req.params.id, updateData, {
        new: true, // ✅ шинэчилсэн document буцаана
        runValidators: true,
      });

      console.log("Updated artist data:", data);

      const token = old.getJsonWebToken();
      console.log("Generated token:", token);

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
  console.log("✌️s --->", req.params.id);
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

    console.log("req.body", req.body);

    if (Number(count) < 3) {
      return res.status(400).json({
        success: false,
        message: "Та түр хүлээн дахин оролдоно уу",
      });
    }

    const existingUser = await Artist.findOneAndUpdate({ phone }, { pin });
    console.log("yavaa otp verufy1", existingUser);
    if (!existingUser) {
      console.log("Утасны дугаар бүртгэлгүй байна");
      return res.status(200).json({
        success: false,
        message: "Утасны дугаар бүртгэлгүй байна",
      });
    }
    console.log("yavaa otp verufy3");

    const userOtp = await OTP.findOne({
      artist: existingUser._id,
    });
    // console.log("yavaa otp verufy4",artist)
    console.log("yavaa otp verufy22", existingUser._id);

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
    console.log("irj bna otp");

    // Correct OTP comparison
    if (otp !== userOtp.otp) {
      return res.status(200).json({
        success: false,
        message: "Буруу нэг удаагийн нууц үг 111",
      });
    }

    existingUser.status = true;
    await existingUser.save();
    console.log("irj bna1");

    // If OTP is correct, generate JWT token
    const token = existingUser.getJsonWebToken();

    // Optionally, delete the OTP after successful verification
    await OTP.deleteOne({ artist: existingUser._id });
    console.log("irj bna2");
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
    console.log("🔹 updateUserFCM called");
    console.log("📩 Request body:", req.body);
    console.log("📌 req.userId:", req.userId);

    const { token, isAndroid } = req.body;
    console.log("✅ Extracted token:", token);
    console.log("✅ Extracted isAndroid:", isAndroid);

    const userFind = await Artist.findById(req.userId);
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
// Энд дуусаж байгаа шүүү
