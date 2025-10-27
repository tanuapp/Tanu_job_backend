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

router.get("/login", (req, res) => {
  const service_structure = [
    {
      wsdl: "https://xyp.gov.mn/citizen-1.5.0/ws?WSDL",
      services: ["WS100101_getCitizenIDCardInfo"],
    },
  ];

  const scope = Buffer.from(JSON.stringify(service_structure)).toString(
    "base64"
  );
  const state = Math.random().toString(36).substring(2, 15);

  const redirectUrl = `${DAN_AUTH_URL}?response_type=code&client_id=${DAN_CLIENT_ID}&redirect_uri=${encodeURIComponent(
    DAN_REDIRECT_URI
  )}&scope=${scope}&state=${state}`;

  console.log("➡️ Redirecting to:", redirectUrl);
  res.redirect(redirectUrl);
});

router.get("/callback", async (req, res) => {
  const { code, state } = req.query;
  if (!code) return res.status(400).send("Missing code");

  try {
    const tokenRes = await axios.post(
      DAN_TOKEN_URL,
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

    const userInfoRes = await axios.get(DAN_USERINFO_URL, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    console.log("✅ User Info:", userInfoRes.data);

    const citizen = userInfoRes.data?.response ?? {};
    const redirectClient = `tanuapp://dan-login-success?fullname=${encodeURIComponent(
      citizen.lastName || ""
    )}&register_number=${encodeURIComponent(citizen.regnum || "")}&phone=`;

    return res.redirect(redirectClient);
  } catch (error) {
    console.error(
      "❌ DAND callback error:",
      error?.response?.data || error.message
    );
    res.status(500).json({ error: "SSO.gov.mn authentication failed" });
  }
});

module.exports = router;
