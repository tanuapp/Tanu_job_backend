const axios = require("axios");

let cachedToken = null;
let cachedUntil = null;

const makeRequest = async (forceRefresh = false) => {
  const now = Date.now();

  if (!forceRefresh && cachedToken && cachedUntil && now < cachedUntil) {
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
      console.log("✅ QPay token авлаа:", cachedToken.slice(0, 15) + "...");
      return { access_token: cachedToken };
    } else {
      throw new Error("QPay access_token байхгүй байна");
    }
  } catch (err) {
    console.error("❌ QPay Token Error:", err.response?.data || err.message);
    return { access_token: null };
  }
};

module.exports = { makeRequest };
