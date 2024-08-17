const User = require("../models/customerModel");
const asyncHandler = require("../middleware/asyncHandler");
const jwt = require("jsonwebtoken");
const admin = require("firebase-admin");

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

exports.sendMassNotification = asyncHandler(async (req, res, next) => {
  try {
    const users = await User.find();

    const { title, body } = req.body;

    users.map(async (list) => {
      const message = {
        notification: {
          title: title,
          body: body,
        },
        token: list.firebase_token, // The device token
      };
      const response = await admin.messaging().send(message);
    });

    res.status(200).json({
      success: true,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.sendNotificationToUsers = asyncHandler(async (req, res, next) => {
  try {
    const { title, body, user } = req.body;
    const userFind = await User.findById(user);
    const message = {
      notification: {
        title: title,
        body: body,
      },
      token: userFind.firebase_token, // The device token
    };
    const response = await admin.messaging().send(message);

    res.status(200).json({
      success: true,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.updateUserFCM = asyncHandler(async (req, res, next) => {
  try {
    const { user, token } = req.body;
    const userFind = await User.findById(user);

    userFind.firebase_token = token;
    await userFind.save();

    res.status(200).json({
      success: true,
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
      // const isPasswordValid = await customer.checkPassword(password);
      // if (!isPasswordValid) {
      //   return res.status(400).json({
      //     success: false,
      //     msg: "Утасны дугаар  эсвэл нууц үг буруу байна!",
      //   });
      // }
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

exports.getMe = async function getMe(req, res, next) {
  try {
    if (!req.headers.authorization) {
      return res.status(401).json({
        success: false,
        msg: "Та эхлээд нэвтрэнэ үү ",
      });
    }
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      return res.status(400).json({
        success: false,
        msg: "Токен хоосон байна",
      });
    }
    const tokenObj = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = tokenObj.Id;
    const user = await User.findById(tokenObj.Id);
    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Энд дуусаж байгаа шүүү
