const express = require("express");
const axios = require("axios");
const router = express.Router();

const {
  DAN_CLIENT_ID,
  DAN_CLIENT_SECRET,
  DAN_REDIRECT_URI,
  DAN_AUTH_URL,
  DAN_TOKEN_URL,
  DAN_USERINFO_URL,
} = process.env;

// ✅ 1. Login — эхний OAuth redirect
router.get("/login", (req, res) => {
  // Scope-г хүсвэл customize хийж болно.
  const scope = "openid profile citizen_info";
  const state = Math.random().toString(36).substring(2, 15);

  // ⚠️ DAN_AUTH_URL заавал https://sso.gov.mn/oauth2/authorize байх ёстой
  const redirectUrl = `${DAN_AUTH_URL}?response_type=code&client_id=${DAN_CLIENT_ID}&redirect_uri=${encodeURIComponent(
    DAN_REDIRECT_URI
  )}&scope=${scope}&state=${state}`;

  console.log("➡️ Redirecting to:", redirectUrl);
  res.redirect(redirectUrl);
});

// ✅ 2. Callback — code → token → userinfo → redirect to app
router.get("/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send("Missing code");

  try {
    // --- 1️⃣ Authorization Code → Access Token ---
    const tokenRes = await axios.post(
      DAN_TOKEN_URL, // https://sso.gov.mn/oauth2/token
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: DAN_CLIENT_ID,
        client_secret: DAN_CLIENT_SECRET,
        redirect_uri: DAN_REDIRECT_URI,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const access_token = tokenRes.data.access_token;
    if (!access_token) {
      throw new Error("Access token not received");
    }

    console.log("🔑 Access Token acquired");

    // --- 2️⃣ Access Token → Citizen Info ---
    const userInfoRes = await axios.get(DAN_USERINFO_URL, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    console.log("✅ User Info:", userInfoRes.data);

    const citizen = userInfoRes.data?.response ?? {};

    // --- 3️⃣ Redirect back to mobile app ---
    const redirectClient = `tanuapp://deeplink/dan?fullname=${encodeURIComponent(
      citizen.lastName || ""
    )}&register_number=${encodeURIComponent(citizen.regnum || "")}`;

    console.log("↩️ Redirecting to app:", redirectClient);
    return res.redirect(redirectClient);
  } catch (error) {
    console.error(
      "❌ DAN callback error:",
      error?.response?.data || error.message
    );
    return res.status(500).json({
      error: "DAN authentication failed",
      details: error?.response?.data || error.message,
    });
  }
});

module.exports = router;
