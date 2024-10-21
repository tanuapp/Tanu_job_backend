const jwt = require("jsonwebtoken");
const asyncHandler = require("../middleware/asyncHandler");

exports.protect = asyncHandler(async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      return res.status(401).json({
        success: false,
        msg: "Та эхлээд нэвтрэнэ үү ",
      });
    }
    console.log(Date.now());
    const token = req.headers.authorization.split(" ")[1];

    if (!token) {
      return res.status(400).json({
        success: false,
        msg: "Токен хоосон байна",
      });
    }
    const tokenObj = jwt.verify(token, process.env.JWT_SECRET);
    req.token = token;
    req.userId = tokenObj.Id;
    req.userRole = tokenObj.role;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      msg: "Токен хоосон байна.  Та эхлээд нэвтрэнэ үү !",
    });
  }
});

exports.authorize = (roles) => {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(401).json({
        success: false,
        msg: "Токен хоосон байна.!",
      });
    }
    if (!roles.includes(req.userRole.toString())) {
      return res.status(403).json({
        success: false,
        msg: `Энэ үйлдэлийг хийхэд таны эрх хүрэлцэхгүй байна : [${req.userRole}].`,
      });
    }
    next();
  };
};
