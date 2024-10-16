const User = require("../models/customer");
const Appointment = require("../models/appointment");
const asyncHandler = require("../middleware/asyncHandler");
const jwt = require("jsonwebtoken");
const admin = require("../server");
const { getMessaging } = require("firebase-admin/messaging");

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
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.getCustomerAppointments = asyncHandler(async (req, res, next) => {
  try {
    const allUser = await Appointment.find({
      user: req.userId,
    }).populate({
      path: "schedule", // First, populate the 'schedule' field
      populate: {
        path: "serviceId", // Then, populate the 'service' field within 'schedule'
        model: "Service", // Make sure to specify the correct model name
      },
    });

    res.status(200).json({
      success: true,
      data: allUser,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.sendMassNotification = asyncHandler(async (req, res, next) => {
  try {
    const users = await User.findOne(); // Fetch all users
    const { title, body } = req.body; // Destructure title and body from request

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        msg: "Title and body are required",
      });
    }

    // Filter users who have a valid Firebase token
    const validUsers = users.filter((user) => user.firebase_token);

    // Map and send notifications asynchronously
    // const sendNotifications = validUsers.map(async (user) => {
    //   const message = {
    //     notification: {
    //       title: title,
    //       body: body,
    //     },
    //     token: user.firebase_token, // The device token
    //   };
    //   console.log(message);
    //   return getMessaging().send(message);
    // });

    const sendMsg = () => {
      const message = {
        notification: {
          title: title,
          body: body,
        },
        token: users.firebase_token,
      };
      return getMessaging().send(message);
    };

    // Wait for all notifications to be sent
    await Promise.all(sendMsg);

    res.status(200).json({
      success: true,
      msg: "Notifications sent successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error });
  }
});

exports.getMe = asyncHandler(async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      return res.status(401).json({
        success: false,
        msg: "Та эхлээд нэвтрэнэ үү",
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
    const user = await User.findById(tokenObj.Id);
    if (!user) {
      return res.status(404).json({
        success: false,
        msg: "Хэрэглэгч олдсонгүй",
      });
    }
    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.create = asyncHandler(async (req, res, next) => {
  try {
    const { isEmail, pin, phone, email } = req.body;

    if (!pin) {
      return res.status(400).json({
        success: false,
        msg: "PIN кодоо оруулна уу",
      });
    }

    const existingUser = await User.findOne({ phone });
    const existingEmail = await User.findOne({ email });

    if (existingUser && !isEmail) {
      return res.status(400).json({
        success: false,
        error: "Утасны дугаар бүртгэлтэй байна",
      });
    }

    if (existingEmail && isEmail) {
      return res.status(400).json({
        success: false,
        error: "И-мэйл бүртгэлтэй байна",
      });
    }

    if (email || phone) {
      const inputData = {
        ...req.body,
        photo: req.file ? req.file.filename : "no-img.png",
      };
      const user = await User.create(inputData);
      const token = user.getJsonWebToken();
      res.status(200).json({
        success: true,
        token,
        data: user,
      });
    } else {
      res.status(400).json({
        success: false,
        msg: "Имейл эсвэл утасны дугаар оруулж өгнө үү",
      });
    }
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
    const { phone, email, isEmail, pin, password } = req.body;

    if (!pin) {
      return res.status(400).json({
        success: false,
        message: "PIN кодоо оруулна уу",
      });
    }

    let user;

    if (isEmail) {
      user = await User.findOne({ email }).select("+password");
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Имейл бүртгэлгүй байна",
        });
      }
    } else {
      user = await User.findOne({ phone }).select("+password");
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Утасны дугаар бүртгэлгүй байна",
        });
      }
    }

    if (!user.pin == pin) {
      return res.status(400).json({
        success: false,
        msg: "Нэвтрэх нэр эсвэл нууц үг буруу байна!",
      });
    }

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

exports.update = asyncHandler(async (req, res, next) => {
  try {
    const old = await User.findById(req.params.id);
    const updatedData = {
      ...req.body,
      photo: req.file ? req.file.filename : old.photo,
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

exports.get = asyncHandler(async (req, res, next) => {
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

exports.deleteModel = asyncHandler(async (req, res, next) => {
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
    res.status(500).json({ success: false, error: error.message });
  }
});
