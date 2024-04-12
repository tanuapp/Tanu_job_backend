const User = require("../models/customerModel");
const asyncHandler = require("../middleware/asyncHandler");

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
    const userphone = await User.find({ phone: phone });
    if (!userphone) {
      return res
        .status(404)
        .json({ success: falce, message: "Утасны дугаар бүртгэлгүй байна " });
    }

    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        msg: "Утасны дугаар  болон нууц үгээ оруулна уу!",
      });
    } else {
      const customer = await User.findOne({ phone }).select("+password");
      if (!customer) {
        return res.status(400).json({
          success: false,
          msg: "Утасны дугаар  эсвэл нууц үг буруу байна!",
        });
      }
      const isPasswordValid = await customer.checkPassword(password);
      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          msg: "Утасны дугаар  эсвэл нууц үг буруу байна!",
        });
      }
      const token = customer.getJsonWebToken();
      res.status(200).json({
        success: true,
        token,
        data: customer,
      });
    }
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

// Энд дуусаж байгаа шүүү
