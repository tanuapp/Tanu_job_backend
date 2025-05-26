const axios = require("axios");

let cachedToken = null;
let cachedUntil = null;

/**
 * QPay access token авах, 1 цагийн хугацаатай кэшлэнэ
 */
const makeRequest = async (force = false) => {
  const now = Date.now();

  if (!force && cachedToken && cachedUntil && now < cachedUntil) {
    return { access_token: cachedToken };
  }

  try {
    const session_url = process.env.qpayUrl + "auth/token";
    const response = await axios.post(
      session_url,
      {},
      {
        auth: {
          username: process.env.QpayUserName,
          password: process.env.QpayPassword,
        },
      }
    );

    if (response.status === 200 && response.data.access_token) {
      cachedToken = response.data.access_token;
      cachedUntil = now + 55 * 60 * 1000;
      console.log("✅ QPay шинэ token авлаа:", cachedToken.slice(0, 10), "...");
      return { access_token: cachedToken };
    }

    throw new Error("access_token байхгүй");
  } catch (err) {
    console.error("❌ QPay Token Error:", err.response?.data || err.message);
    return { access_token: null };
  }
};

module.exports = { makeRequest };
