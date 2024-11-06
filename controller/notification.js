const apn = require("apn");
const path = require("path");
const asyncHandler = require("../middleware/asyncHandler");
const apnService = require("../utils/apnService");

exports.send = asyncHandler(async (req, res, next) => {
  try {
    const { deviceTokens, alertMessage } = req.body;
    const result = await apnService.sendNotification(
      deviceTokens,
      alertMessage
    );

    if (result.success) {
      res.status(200).json({
        success: true,
        failedTokens: result.failedTokens,
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
