const { default: axios } = require("axios");
const asyncHandler = require("../middleware/asyncHandler");
const user = require("../models/user");
const { addSeconds } = require("../middleware/addTime");

exports.opt = asyncHandler(async (req, res, next) => {
  try {
    const { phone } = req.body;

    // Check if the phone number is already registered
    const existingUser = await user.findOne({ phone });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        msg: `${phone} дугаар бүртгэлтэй байна`,
      });
    }

    // Generate verification code

    // Calculate the expiration time for the verification code (60 seconds)
    const endDate = addSeconds(new Date(), 60);
    const nowDate = new Date().toISOString().slice(0, 19);
    console.log("odoogin tsag ", nowDate);
    const endDateStr = endDate.toISOString().slice(0, 19);
    console.log("duusah tsag ", endDateStr);
    // call  pro tulbur tulxuur commentoo arilgana
    // const axiosResponse = await axios.get(`https://api.messagepro.mn/send`, {
    //   params: {
    //     from: '72011005',
    //     to: phone,
    //     text: `Таны нэг удаагын код: ${verifyCode} TANU`,
    //     key: '449a375104be009911dc31640fb082b1',
    //   },
    // });

    // call  pro tulbur tulxuur commentoo arilgana
    // if (axiosResponse.data === "SENT") {
    // } else {
    //   return res.status(500).json({ success: false, error: "Message sending failed" });
    // }

    const response = await user_verify.create({
      ...req.body,
      verify_code: verifyCode,
      active_second: endDateStr,
    });

    /// 61 second huleesnii daraa ustgana  user_verify dotor  phone dawhtsaj boloxgui bgaa
    setTimeout(async () => {
      const deletePhoneDelay = await user_verify.findOneAndDelete({
        phone: response.phone,
      });
      console.log("deleted", deletePhoneDelay);
    }, 61 * 1000);
    return res.status(200).json({ success: true, data: response });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }

  // const numberOfMonths = 12; // Replace this with your variable

  // setTimeout(async () => {
  //   const deletePhoneDelay = await user_verify.findOneAndDelete({
  //     phone: response.phone,
  //   });
  //   console.log("deleted", deletePhoneDelay);
  // }, numberOfMonths * 30 * 24 * 60 * 60 * 1000);
});

exports.getCode = asyncHandler(async (req, res, next) => {
  try {
    const { phone, code } = req.body;
    const response = await user_verify.findOne({
      phone,
      verify_code: code,
    });

    const endDate = addSeconds(new Date(), 19);
    const endDateStr = endDate.toISOString().slice(0, 19);

    if (!response) {
      return res.status(200).json({
        success: false,
        error: "Баталгаажуулах код буруу байна.",
      });
    }
    // console.log(response.active_second, `now ${endDateStr}`)
    if (endDateStr > response.active_second) {
      return res.status(200).json({
        success: false,
        error: "Баталгаажуулах кодны хугацаа дууссан байна.",
      });
    }
    return res
      .status(200)
      .json({ success: true, message: "Амжилттай", response });

    // // Handle the case when the verification code is valid
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 0,
      error:
        "Internal Server Error: Something went wrong while processing the request.",
    });
  }
});

// exports.getCode = async (req, res) => {
//     return res.status(200).json({ msg: "test" });
// };
