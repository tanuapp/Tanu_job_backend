const apn = require("apn");
const path = require("path");
const asyncHandler = require("../middleware/asyncHandler");
const apnService = require("../utils/apnService");
const User = require("../models/customer");
const customResponse = require("../utils/customResponse");
const Model = require("../models/notification");
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

exports.getAllModel = asyncHandler(async (req, res, next) => {
  try {
    const allUser = await Model.find();
    const total = await Model.countDocuments();
    res.status(200).json({
      success: true,
      count: total,
      data: allUser,
    });
  } catch (error) {
    customResponse.server(res, error.message);
  }
});

exports.sendFirebase = asyncHandler(async (req, res) => {
  try {
    const user = await User.findOne({
      phone: "80641595",
    });

    // const sendFirebaseNotification =
    // async ({ title, body, data = {}, topic = null, token = null }) => {

    const result = await sendFirebaseNotification({
      title: req.body.title,
      body: req.body.body,
      data: req.body.data,
      token: user.firebase_token, // or use token: "device_token"
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
