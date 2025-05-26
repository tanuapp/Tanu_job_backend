const axios = require("axios");

let cachedToken = null;
let cachedUntil = null;

/**
 * QPay access token авах, 1 цагийн хугацаатай кэшлэнэ
 */
const makeRequest = async () => {
  const now = Date.now();

  // ✅ Хэрвээ өмнө нь авсан token хүчинтэй байвал шууд буцаана
  if (cachedToken && cachedUntil && now < cachedUntil) {
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
      cachedUntil = now + 55 * 60 * 1000; // 55 минут cache-лэсэн token ашиглана
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

// 🧪 Deprecated old function (устгах боломжтой)
const token = () => {
  console.warn(
    "⚠️ [token()] нь ашиглагдахгүй, оронд нь makeRequest() хэрэглэ!"
  );
  return makeRequest();
};

module.exports = { token, makeRequest };
