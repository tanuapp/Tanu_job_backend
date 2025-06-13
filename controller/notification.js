const apn = require("apn");
const path = require("path");
const asyncHandler = require("../middleware/asyncHandler");
const apnService = require("../utils/apnService");
const User = require("../models/customer");
const customResponse = require("../utils/customResponse");

const sendFirebaseNotification = require("./../utils/sendFIrebaseNotification");

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
    customResponse.error(res, error.message);
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
    customResponse.error(res, error.message);
  }
});


exports.sendFirebase = asyncHandler(async (req, res) => {
  try {
    const users = await User.find(); // Or filter who to send

    const result = await sendFirebaseNotification({
      title: req.body.data.title,
      body: req.body.data.description,
      data: req.body.data,
      topic: "your_topic_here" // or use token: "device_token"
    });

    if (result.success) {
      res.status(200).json({
        success: true,
        response: result.response,
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error.message,
      });
    }
  } catch (error) {
    customResponse.error(res, error.message);
  }
});