const axios = require("axios");

const makeRequest = async () => {
  try {
    // Encode username:password -> base64
    const credentials = Buffer.from(
      `${process.env.QpayUserName}:${process.env.QpayPassword}`
    ).toString("base64");

    const response = await axios.post(
      `${process.env.qpayUrl}auth/token`,
      {
        grant_type: "client_credentials",
      },
      {
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status === 200) {
      console.log("✅ QPay token retrieved successfully");
      return {
        access_token: response.data.access_token,
      };
    } else {
      console.warn("⚠️ QPay auth returned non-200 status", response.status);
      throw new Error("Invalid response from QPay");
    }
  } catch (error) {
    console.error("❌ QPay Auth Error:", error.response?.data || error.message);
    throw new Error("QPay authentication failed");
  }
};

module.exports = {
  makeRequest,
};
