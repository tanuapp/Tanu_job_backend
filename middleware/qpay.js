const axios = require("axios");

let cachedToken = null;
let tokenExpiry = null;

const makeRequest = async () => {
  const now = Date.now();

  // Хэрвээ өмнөх токен хүчинтэй байвал шууд буцаана
  if (cachedToken && tokenExpiry && now < tokenExpiry) {
    return { access_token: cachedToken };
  }

  try {
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

      cachedToken = response.data.access_token;
      tokenExpiry = now + 55 * 1000; // 55 секунд хадгалах (60-аас бага, buffer-тай)

      return {
        access_token: cachedToken,
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
