const Person = require("../models/person");
const asyncHandler = require("../middleware/asyncHandler");
const customResponse = require("../utils/customResponse");
const Service = require("../models/service");
const company = require("../models/company");
const User = require("../models/user");
const Artist = require("../models/artist");
const Appointment = require("../models/appointment");
const Banner = require("../models/banner");
const Dayoff = require("../models/dayoff");
const Contract = require("../models/onlineContract");
const Schedule = require("../models/schedule");
const Fav = require("../models/favourite");

const OTP = require("../models/personOTP");
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
    const allUser = await Person.find();

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
    const existingUser = await Person.findOne({ phone: req.body.phone });
    const exinstingEmail = await Person.findOne({ email: req.body.email });

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

    const user = await Person.create(inputData);
    const token = user.getJsonWebToken();

    customResponse.success(res, "Амжилттай хүсэлт илгээлээ");
  } catch (error) {
    console.log(error);
    customResponse.error(res, error.message);
  }
});

exports.checkPersonPhone = asyncHandler(async (req, res, next) => {
  try {
    const body = req.body;
    const existingUser = await Person.findOne({ phone: body.phone });
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

exports.personUpdateTheirOwnInformation = asyncHandler(
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
      const old = await Person.findById(req.params.id);
      const data = await Person.findByIdAndUpdate(req.params.id, {
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
exports.checkPersonEmail = asyncHandler(async (req, res, next) => {
  try {
    const body = req.body;
    const existingUser = await Person.findOne({ email: body.email });
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

exports.registerPerson = asyncHandler(async (req, res, next) => {
  try {
    if (!req.body.pin) {
      customResponse.error(res, "Та пин оруулж өгнө үү ");
    }
    const existingUser = await Person.findOne({ phone: req.body.phone });
    const exinstingEmail = await Person.findOne({ email: req.body.email });
    const personer = await company.findById(req.body.companyId);
    personer.numberOfPerson++;
    await personer.save();

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
      companyId: personer._id.toString(),
      photo: req.file?.filename ? req.file.filename : "no user photo",
    };

    const user = await Person.create(inputData);
    const token = user.getJsonWebToken();

    customResponse.success(res, "Амжилттай хүсэлт илгээлээ");
  } catch (error) {
    console.log(error);
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
    const user = await Person.findOne({ phone }).select("+pin");

    if (!user) {
      return customResponse.error(
        res,
        "Утасны дугаар эсвэл нууц үг буруу байна!"
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
  try {
    const updatedData = {
      ...req.body,
      photo: req.file?.filename,
    };

    const upDateUserData = await Person.findByIdAndUpdate(
      req.params.id,
      updatedData,
      {
        new: true,
      }
    );

    customResponse.success(res, upDateUserData);
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

exports.getPersonCompany = asyncHandler(async (req, res, next) => {
  try {
    // console.log("sending");
    console.log(req.userId);
    let companyUser = await company.findOne({
      companyOwner: req.userId,
    });

    if (!companyUser) {
      const sda = await Artist.findById(req.userId);
      companyUser = await company.findById(sda.companyId);
    }

    const artistList = await Artist.find({
      companyId: companyUser._id,
    });
    const appointmentList = await Appointment.find({
      companyId: companyUser._id,
    });

    const BannerList = await Banner.find({
      companyId: companyUser._id,
    });
    const DayoffList = await Dayoff.find({
      companyId: companyUser._id,
    });
    const ContractList = await Contract.find({
      companyId: companyUser._id,
    });
    const ServiceList = await Service.find({
      companyId: companyUser._id,
    });
    const ScheduleList = await Schedule.find({
      companyId: companyUser._id,
    }).populate("artistId serviceId");
    const allUser = await Fav.findOne({
      user: req.userId,
      company: companyUser._id,
    });

    const companys = await company.findById(companyUser._id).populate({
      path: "category",
      model: "Category", // Ensure this model name is correct for categories
    });

    const comp = {
      ...companys.toObject(),
      isSaved: allUser ? true : false,
    };

    console.log("sending");

    const p = {
      artist: artistList,
      appointment: appointmentList,
      company: comp,
      categories: companys.category, // Populated category data
      banner: BannerList,
      schedule: ScheduleList,
      dayoff: DayoffList,
      Contract: ContractList,
      service: ServiceList,
    };
    console.log(p);

    return res.status(200).json({
      success: true,
      data: p,
    });
  } catch (error) {
    console.log(error);
    customResponse.error(res, error.message);
  }
});

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

    const existingUser = await Person.findOneAndUpdate({ phone }, { pin });

    if (!existingUser) {
      console.log("Утасны дугаар бүртгэлгүй байна");
      return res.status(200).json({
        success: false,
        message: "Утасны дугаар бүртгэлгүй байна",
      });
    }
    console.log("yavaa otp verufy3");

    const userOtp = await OTP.findOne({
      person: existingUser._id,
    });
    // console.log("yavaa otp verufy4",person)
    console.log("yavaa otp verufy22", existingUser._id);

    if (!userOtp) {
      return res.status(200).json({
        success: false,
        message: "OTP not found. Please request a new one.111",
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
    await OTP.deleteOne({ person: existingUser._id });
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

exports.registerWithPhone = asyncHandler(async (req, res, next) => {
  try {
    const { phone } = req.body;

    // Validate if phone and pin are provided
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Утасны дугаар оруулна уу",
      });
    }

    console.log(req.body);

    let existingUser = await Person.findOne({ phone });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Утасны дугаар бүртгэлтэй байна",
      });
    }

    const inputData = {
      ...req.body,
      photo: req.file ? req.file.filename : "no-img.png",
    };

    const user = await Person.create(inputData);
    console.log("irj bnn3");

    const otp = generateOTP();
    if (existingUser) {
      await OTP.findByIdAndUpdate(
        {
          person: user._id,
        },
        {
          otp,
          person: user._id,
        }
      );
    } else {
      await OTP.create({
        otp,
        person: user._id,
      });
    }
    console.log("irj bnn");

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
exports.getPersonServices = asyncHandler(async (req, res, next) => {
  try {
    const allText = await Service.find();

    const data = allText.filter((list) =>
      list.PersonId.includes(req.params.id)
    );

    customResponse.success(res, data);
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

exports.getPersonType = asyncHandler(async (req, res, next) => {
  try {
    const user = await Person.findById(req.userId);
    // const artist = await artist.findById(req.userId);

    customResponse.success(res, {
      type: user ? false : true,
    });
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

// Энд дуусаж байгаа шүүү
