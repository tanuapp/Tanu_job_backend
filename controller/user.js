const User = require("../models/user");
const Company = require("../models/company");
const asyncHandler = require("../middleware/asyncHandler");
const mongoose = require("mongoose");
const customResponse = require("../utils/customResponse");
const { read } = require("fs");

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
    customResponse.server(res, error.message);
  }
});

exports.create = asyncHandler(async (req, res, next) => {
  try {
    console.log(req.body);
    const existingUser = await User.findOne({ phone: req.body.phone });
    const exinstingEmail = await User.findOne({ email: req.body.email });

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

    const inputData = {
      ...req.body,
      permission: JSON.parse(req.body.permission || "[]") || [],
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
    customResponse.server(res, error.message);
  }
});

exports.Login = asyncHandler(async (req, res, next) => {
  try {
    const { phone, password, email, isEmail } = req.body;
    const userIdentifier = isEmail ? { email } : { phone };
    const user = await User.findOne(userIdentifier).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: isEmail
          ? "Имейл бүртгэлгүй байна."
          : "Утасны дугаар бүртгэлгүй байна.",
      });
    }

    const isPasswordValid = await user.checkPassword(password);
    if (!isPasswordValid) {
      return res.status(200).json({
        success: false,
        message: "Нэвтрэх нэр эсвэл нууц үг буруу байна!",
      });
    }
    const token = user.getJsonWebToken();
    return res.status(200).json({
      success: true,
      token,
      data: user,
    });
  } catch (error) {
    customResponse.server(res, error.message);
  }
});

exports.update = asyncHandler(async (req, res, next) => {
  try {
    const updatedData = {
      ...req.body,
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
    customResponse.server(res, error.message);
    // res.status(200).json({ success: false, error: error.message });
  }
});

exports.get = asyncHandler(async (req, res, next) => {
  try {
    const allText = await User.findById(req.params.id);
    const company = await Company.findOne({
      companyOwner: req.params.id,
    });

    const data = {
      ...allText,
      company,
    };
    return res.status(200).json({
      success: true,
      data: allText,
      company,
    });
  } catch (error) {
    customResponse.server(res, error.message);
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
    customResponse.server(res, error.message);
  }
};

// Энд дуусаж байгаа шүүү
