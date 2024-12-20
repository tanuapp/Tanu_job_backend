const Artist = require("../models/artist");
const asyncHandler = require("../middleware/asyncHandler");
const customResponse = require("../utils/customResponse");
const Service = require("../models/service");
const company = require("../models/company");
const user = require("../models/user");

exports.getAll = asyncHandler(async (req, res, next) => {
  try {
    const allUser = await User.find();

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
    const existingUser = await Artist.findOne({ phone: body.phone });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Утас бүртгэлтэй байна",
      });
    }
    return res.status(200).json({
      success: false,
      message: "Амжилттай",
    });
  }
  catch (error) {
    customResponse.error(res, error.message);
  }
})
exports.checkArtistEmail = asyncHandler(async (req, res, next) => {
  try {
    const body = req.body;
    const existingUser = await Artist.findOne({ email: body.email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "И-мэйл бүртгэлтэй байна",
      });
    } return res.status(200).json({
      success: false,
      message: "Амжилттай",
    });

  }
  catch (error) {
    customResponse.error(res, error.message);
  }
})

exports.registerArtist = asyncHandler(async (req, res, next) => {
  try {
    const body = req.body;
    const artister = await company.findById(body.companyId);
    artister.numberOfArtist++;
    await artister.save();
    const inputData = {
      ...body,
      photo: req.file?.filename ? req.file.filename : "no user photo",
    };
    const user = await Artist.create(inputData);
    const token = user.getJsonWebToken();

    customResponse.success(res, user, token);
  }
  catch (error) {
    customResponse.error(res, error.message);
  }
})

exports.Login = asyncHandler(async (req, res, next) => {
  try {
    const { phone, pin } = req.body;

    const userphone = await User.find({ phone: phone });

    if (!userphone) {
      customResponse.error(res, "Утасны дугаар бүртгэлгүй байна ");
    }
    if (!userphone.status) {
      customResponse.error(res, "Байгууллагаас таныг зөвшөөрөөгүй байна ");
    }

    if (!phone || !pin) {
      customResponse.error(res, "Утасны дугаар  болон нууц үгээ оруулна уу!");
    } else {
      const user = await Artist.findOne({ phone }).select("+password");
      if (!user) {
        customResponse.error(res, "Утасны дугаар  эсвэл нууц үг буруу байна!");
      }
      const isPasswordValid = await user.checkPassword(pin);
      if (!isPasswordValid) {
        customResponse.error(res, "Утасны дугаар  эсвэл нууц үг буруу байна!");
      }
      const token = user.getJsonWebToken();

      customResponse.success(res, user, token);
    }
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

exports.update = asyncHandler(async (req, res, next) => {
  try {
    const updatedData = {
      ...req.body,
      photo: req.file?.filename,
    };

    const upDateUserData = await User.findByIdAndUpdate(
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

// Энд дуусаж байгаа шүүү
