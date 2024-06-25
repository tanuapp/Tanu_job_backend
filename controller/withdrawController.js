const model = require("../models/withdrawModel");
const asyncHandler = require("../middleware/asyncHandler");
const khan = require("../middleware/khaan");
const { default: axios } = require("axios");
const { converToLocalTime } = require("../middleware/addTime");

exports.create = asyncHandler(async (req, res, next) => {
  try {
    const khanToken = await khan.makeRequest();
    console.log("Khan token:", khanToken.access_token);

    const header = {
      headers: {
        Authorization: "Bearer " + khanToken.access_token,
        "Content-Type": "application/json",
      },
    };
    const nowDate = converToLocalTime(new Date());
    console.log(nowDate);
    const reqBody = {
      fromAccount: "5037820742",
      toAccount: "5075778806",
      toCurrency: "MNT",
      amount: 1,
      description: nowDate + "орлого",
      currency: "MNT",
      loginName: "info.tanullc@gmail.com",
      tranPassword: "Tanusoft2021$$",
      transferid: "trans_id0001",
    };
    const jsonString = JSON.stringify(reqBody);
    const domesticRes = await axios.post(
      `https://api.khanbank.com/v1/transfer/domestic`,
      jsonString,
      { headers: header.headers, timeout: 5000 } // Adjust the timeout value as needed
    );
    // const domesticRes = await axios.post(`https://doob.world:6442/v1/transfer/domestic`, reqBody, header)
    console.log("Status Code:", domesticRes.status);
    if (domesticRes.status === 200) {
      console.log("Domestic transfer successful");
      return res.status(200).json({
        transferDetails: jsonString,
        msg: "Гүйлгээ амжилттай",
      });
    } else {
      console.error("Domestic transfer failed:", domesticRes.statusText);
      console.error("Response:", domesticRes); // Log the entire response for better debugging
      return res.status(domesticRes.status).json({
        success: false,
        error: "Domestic transfer failed. Check logs for details.",
      });
    }
  } catch (error) {
    console.error("Error in transfer creation:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.update = asyncHandler(async (req, res, next) => {
  try {
    const updatedData = {
      ...req.body,
    };
    const text = await model.findByIdAndUpdate(req.params.id, updatedData, {
      new: true,
    });
    return res.status(200).json({ success: true, data: text });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.findDelete = asyncHandler(async (req, res, next) => {
  try {
    const text = await model.findByIdAndDelete(req.params.id, {
      new: true,
    });
    return res.status(200).json({ success: true, data: text });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.detail = asyncHandler(async (req, res, next) => {
  try {
    const text = await model.findById(req.params.id);
    return res.status(200).json({ success: true, data: text });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.getAll = asyncHandler(async (req, res, next) => {
  try {
    const total = await model.countDocuments();
    const text = await model.find();
    return res.status(200).json({ success: true, total: total, data: text });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
