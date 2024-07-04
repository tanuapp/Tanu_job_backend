const User = require("../models/user");
const asyncHandler = require("../middleware/asyncHandler");
const user = require("../models/user");
const customer = require("../models/customerModel");
const artistModel = require("../models/artistModel");
const jwt = require("jsonwebtoken");
exports.getAllUser = asyncHandler(async (req, res, next) => {
  try {
    const allUser = await User.find();
    const total = await User.countDocuments();
    res.status(200).json({
      success: true,
      count: total,
      data: allUser,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.createUser = asyncHandler(async (req, res, next) => {
  try {
    const existingUser = await User.findOne({ phone: req.body.phone });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "Утасны дугаар бүртгэлтэй байна",
      });
    }

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
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.Login = asyncHandler(async (req, res, next) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Утасны дугаар болон нууц үгээ оруулна уу!",
      });
    }

    // Try to find the user in both User and Artist collections
    const user = await User.findOne({ phone }).select("+password");
    const artist = await artistModel.findOne({ phone }).select("+password");

    const account = user || artist; // If user is found, account will be user. If not, it will be artist

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Утасны дугаар бүртгэлгүй байна",
      });
    }

    const isPasswordValid = await account.checkPassword(password);

    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Утасны дугаар эсвэл нууц үг буруу байна!",
      });
    }

    const token = account.getJsonWebToken();
    res.status(200).json({
      success: true,
      token,
      data: account,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.updateUser = asyncHandler(async (req, res, next) => {
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
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.userDetail = asyncHandler(async (req, res, next) => {
  try {
    const allText = await User.findById(req.params.id);
    return res.status(200).json({
      success: true,
      data: allText,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.deleteUser = async function deleteUser(req, res, next) {
  try {
    const deletePost = await User.findOneAndDelete(req.params.id, {
      new: true,
    });
    return res.status(200).json({
      success: true,
      msg: "Ажилттай усгагдлаа",
      data: deletePost,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.sessionCheck = async function deleteUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7, authHeader.length)
      : null;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await customer.findById(decoded.Id);
    if (!user) {
      res.status(400).json({
        success: false,
        msg: "Хэрэглэгч олдсонгүй",
      });
    }
    return res.status(200).json({
      success: true,
      data: user,
      token,
    });
    console.log(decoded);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Энд дуусаж байгаа шүүү
