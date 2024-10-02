const User = require("../models/customer");
const asyncHandler = require("../middleware/asyncHandler");

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
exports.create = asyncHandler(async (req, res, next) => {
  try {
    const { isEmail } = req.body;
    console.log(isEmail);
    const existingUser = await User.findOne({ phone: req.body.phone });
    const existingEmail = await User.findOne({ email: req.body.email });

    const { phone, email } = req.body;

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "Утасны дугаар бүртгэлтэй байна",
      });
    }
    if (existingEmail && isEmail == true) {
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
    const { phone, password, email, isEmail } = req.body;

    const userphone = isEmail
      ? await User.find({ phone: phone })
      : await User.find({ email: email });

    if (!userphone) {
      return res.status(404).json({
        success: falce,
        message: isEmail
          ? "Имейл бүртгэлгүй байна"
          : "Утасны дугаар бүртгэлгүй байна ",
      });
    }

    const user = isEmail
      ? await User.findOne({ email }).select("+password")
      : await User.findOne({ phone }).select("+password");
    if (!user) {
      return res.status(400).json({
        success: false,
        msg: "Нэвтрэх нэр эсвэл нууц үг буруу байна!",
      });
    }
    const isPasswordValid = await user.checkPassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        msg: "Утасны дугаар эсвэл нууц үг буруу байна!",
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
    res.status(500).json({ success: false, error: error.message });
  }
};

// Энд дуусаж байгаа шүүү
