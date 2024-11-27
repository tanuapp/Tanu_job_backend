const apn = require("apn");
const path = require("path");
const asyncHandler = require("../middleware/asyncHandler");
const apnService = require("../utils/apnService");
const User = require("../models/customer");

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
    res.status(200).json({ success: false, error: error.message });
  }
});

exports.sendMass = asyncHandler(async (req, res, next) => {
  try {
    const list = await User.find({
      isAndroid: false,
    });
    const availableTokens = list.map((list) => list.firebase_token);
    const { alertMessage } = req.body;
    const result = await apnService.sendNotification(
      availableTokens,
      alertMessage
    );

    if (result.success) {
      res.status(200).json({
        success: true,
        failedTokens: result.failedTokens,
      });
    }
  } catch (error) {
    res.status(200).json({ success: false, error: error.message });
  }
});
