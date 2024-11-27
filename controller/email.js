const { sendEmail } = require("../utils/mailService");
const asyncHandler = require("../middleware/asyncHandler");
exports.sendMail = asyncHandler(async (req, res, next) => {
  try {
    await sendEmail();
    res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.log(error);
    res.status(200).json({ success: false, error: error.message });
  }
});
