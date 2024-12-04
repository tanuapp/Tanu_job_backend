const { sendEmail } = require("../utils/mailService");
const asyncHandler = require("../middleware/asyncHandler");
const customResponse = require("../utils/customResponse");
exports.sendMail = asyncHandler(async (req, res, next) => {
  try {
    await sendEmail();
    res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.log(error);

    customResponse.error(res, error.message);
  }
});
