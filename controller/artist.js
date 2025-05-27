const Artist = require("../models/artist");
const asyncHandler = require("../middleware/asyncHandler");
const customResponse = require("../utils/customResponse");
const Service = require("../models/service");
const company = require("../models/company");
const User = require("../models/user");
const OTP = require("../models/artistOTP");
const sendMessage = require("../utils/callpro");

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

exports.create = asyncHandler(async (req, res, next) => {
  try {
    if (!req.body.pin) {
      customResponse.error(res, "Та пин оруулж өгнө үү ");
    }
    const existingUser = await Artist.findOne({ phone: req.body.phone });
    const exinstingEmail = await Artist.findOne({ email: req.body.email });
    const artister = await company.findById(req.body.companyId);
    artister.numberOfArtist++;
    await artister.save();

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
      companyId: artister._id.toString(),
      photo: req.file?.filename ? req.file.filename : "no user photo",
    };

    const user = await Artist.create(inputData);
    const token = user.getJsonWebToken();

    customResponse.success(res, "Амжилттай хүсэлт илгээлээ");
  } catch (error) {
    console.log(error);
    customResponse.error(res, error.message);
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
    console.log(req.body);
    let existingUser = await Artist.findOne({ phone: req.body.phone }); // Fixed query

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Утасны дугаар бүртгэлтэй байна",
      });
    }
    const body = req.body;
    // const artister = await company.findById(body.companyId);
    // artister.numberOfArtist++;
    // await artister.save();
    const inputData = {
      ...body,
      photo: req.file?.filename ? req.file.filename : "no user photo",
    };
    const user = await Artist.create(inputData);
    const otp = generateOTP();
    if (existingUser) {
      await OTP.findByIdAndUpdate(
        {
          artist: user._id,
        },
        {
          otp,
          artist: user._id,
        }
      );
      console.log("irj bnn221");
    } else {
      await OTP.create({
        otp,
        artist: user._id,
      });
    }
    console.log("irj bnn123");

    await sendMessage(req.body.phone, `Таны нэг удаагийн нууц үг: ${otp}`); // Fixed syntax
    const token = user.getJsonWebToken();

    customResponse.success(res, user, token);
  } catch (error) {
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
  console.log("", req.body);
  try {
    const artistId = req.params.id;
    const updatedData = { ...req.body };
    console.log("1", req.body);
    if (req.file?.filename) {
      updatedData.photo = req.file.filename;
    }
    console.log("2", updatedData);
    // ✅ Хэрвээ companyNumber ирсэн бол companyId-г олж, `updatedData` дээр оноох
    if (req.body.companyNumber) {
      const foundCompany = await company.findOne({
        companyNumber: Number(req.body.companyNumber),
      });
      console.log("3", req.body);

      console.log("ollo2", foundCompany);
      if (!foundCompany) {
        return res.status(400).json({
          success: false,
          message: "Компанийн дугаар буруу байна",
        });
      }

      // 🧷 Шууд `companyId`-г онооно
      updatedData.companyId = foundCompany._id;
      console.log("ollo23", updatedData);
      // 🧮 Компанийн artist тоог нэмэгдүүлэх (хэрэв хүсвэл)
      foundCompany.numberOfArtist += 1;
      await foundCompany.save();
    }

    const updatedArtist = await Artist.findByIdAndUpdate(
      artistId,
      updatedData,
      { new: true }
    );
    console.log("yes", updatedArtist);
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
      console.log("req.params.id", req.params.id);
      console.log("body", req.body);
      // if (req.userId != req.params.id) {
      //   return res.status(200).json({
      //     success: false,
      //     msg: "Та зөвхөн өөрийн мэдээллийг өөрчлөж болно",
      //   });
      // }
      const old = await Artist.findById(req.params.id);
      const data = await Artist.findByIdAndUpdate(req.params.id, {
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

exports.registerVerify = asyncHandler(async (req, res, next) => {
  try {
    const { otp, phone, count, pin } = req.body;

    console.log(req.body);

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
// Энд дуусаж байгаа шүүү
