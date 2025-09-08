const jwt = require("jsonwebtoken");
const asyncHandler = require("./asyncHandler");

// ✅ Authentication middleware
exports.protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      msg: "Та эхлээд нэвтрэнэ үү (Bearer токен дамжуулна уу).",
    });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({
      success: false,
      msg: "Токен хоосон байна.",
    });
  }

  try {
    const tokenObj = jwt.verify(token, process.env.JWT_SECRET);

    // 🟢 JWT-аас мэдээлэл авна
    req.token = token;
    req.userId = tokenObj.Id;
    req.userRole = tokenObj.role;
    req.companyId = tokenObj.companyId || null;

    next();
  } catch (error) {
    console.error("JWT verify error:", error.message);
    return res.status(401).json({
      success: false,
      msg:
        error.name === "TokenExpiredError"
          ? "Токены хугацаа дууссан байна."
          : "Токен буруу байна.",
    });
  }
});

// ✅ Role-based authorization
exports.authorize = (roles) => {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(401).json({
        success: false,
        msg: "Таны токенд role мэдээлэл байхгүй байна.",
      });
    }

    if (!roles.includes(req.userRole.toString())) {
      return res.status(403).json({
        success: false,
        msg: `Энэ үйлдлийг хийх эрх хүрэлцэхгүй байна. Таны role: [${req.userRole}]`,
      });
    }

    next();
  };
};
