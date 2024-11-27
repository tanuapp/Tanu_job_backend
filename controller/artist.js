const User = require("../models/artist");
const asyncHandler = require("../middleware/asyncHandler");
// const artist = require("../models/artist");
const Service = require("../models/service");
const company = require("../models/company");

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
    res.status(200).json({ success: false, error: error.message });
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
        error: "Утасны дугаар бүртгэлтэй байна",
      });
    }
    if (exinstingEmail) {
      return res.status(200).json({
        success: false,
        error: "И-мэйл бүртгэлтэй байна",
      });
    }
    console.log(req.files);

    const inputData = {
      ...req.body,
      photo: req.file?.filename ? req.file.filename : "no user photo",
    };
    const user = await User.create(inputData);
    const token = user.getJsonWebToken();
    res.status(200).json({
      success: true,
      token,
      data: user,
    });
  } catch (error) {
    res.status(200).json({ success: false, error: error.message });
  }
});

exports.Login = asyncHandler(async (req, res, next) => {
  try {
    const { phone, password } = req.body;

    const userphone = await User.find({ phone: phone });

    if (!userphone) {
      return res
        .status(404)
        .json({ success: falce, message: "Утасны дугаар бүртгэлгүй байна " });
    }

    if (!phone || !password) {
      return res.status(200).json({
        success: false,
        error: "Утасны дугаар  болон нууц үгээ оруулна уу!",
      });
    } else {
      const user = await User.findOne({ phone }).select("+password");
      if (!user) {
        return res.status(200).json({
          success: false,
          error: "Утасны дугаар  эсвэл нууц үг буруу байна!",
        });
      }
      const isPasswordValid = await user.checkPassword(password);
      if (!isPasswordValid) {
        return res.status(200).json({
          success: false,
          error: "Утасны дугаар  эсвэл нууц үг буруу байна!",
        });
      }
      const token = user.getJsonWebToken();
      res.status(200).json({
        success: true,
        token,
        data: user,
      });
    }
  } catch (error) {
    res.status(200).json({ success: false, error: error.message });
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
    return res.status(200).json({
      success: true,
      data: upDateUserData,
    });
  } catch (error) {
    res.status(200).json({ success: false, error: error.message });
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
    res.status(200).json({ success: false, error: error.message });
  }
});

exports.getArtistServices = asyncHandler(async (req, res, next) => {
  try {
    const allText = await Service.find();

    const data = allText.filter((list) =>
      list.artistId.includes(req.params.id)
    );

    return res.status(200).json({
      success: true,
      data: data,
    });
  } catch (error) {
    res.status(200).json({ success: false, error: error.message });
  }
});

exports.deleteModel = async function deleteUser(req, res, next) {
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
    res.status(200).json({ success: false, error: error.message });
  }
};

// Энд дуусаж байгаа шүүү
