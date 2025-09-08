// middlewares/rateLimit.js
const rateLimit = require("express-rate-limit");

// login / otp rate limit
exports.loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 10, // 10 удаа л оролдож болно
  message: {
    success: false,
    message:
      "Та хэт олон удаа оролдсон байна. 15 минутын дараа дахин оролдоно уу.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

exports.otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 минут
  max: 3, // OTP 3 удаа л авах
  message: {
    success: false,
    message: "OTP-г хэт олон удаа авсан тул түр хүлээгээд дахин оролдоно уу.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
