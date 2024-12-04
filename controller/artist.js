const User = require("../models/artist");
const asyncHandler = require("../middleware/asyncHandler");
const customResponse = require("../utils/customResponse");
// const artist = require("../models/artist");
const Service = require("../models/service");
const company = require("../models/company");

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
    const existingUser = await User.findOne({ phone: req.body.phone });
    const exinstingEmail = await User.findOne({ email: req.body.email });
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
    console.log(req.files);

    const inputData = {
      ...req.body,
      photo: req.file?.filename ? req.file.filename : "no user photo",
    };
    const user = await User.create(inputData);
    const token = user.getJsonWebToken();

    customResponse.success(res, user, token);
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

exports.Login = asyncHandler(async (req, res, next) => {
  try {
    const { phone, password } = req.body;

    const userphone = await User.find({ phone: phone });

    if (!userphone) {
      customResponse.error(res, "Утасны дугаар бүртгэлгүй байна ");
    }

    if (!phone || !password) {
      customResponse.error(res, "Утасны дугаар  болон нууц үгээ оруулна уу!");
    } else {
      const user = await User.findOne({ phone }).select("+password");
      if (!user) {
        customResponse.error(res, "Утасны дугаар  эсвэл нууц үг буруу байна!");
      }
      const isPasswordValid = await user.checkPassword(password);
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
