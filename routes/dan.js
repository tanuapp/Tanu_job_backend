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

// ✅ Шалгахад тус болох лог
console.log("========== DAND CONFIG ==========");
console.log("CLIENT_ID:", DAN_CLIENT_ID);
console.log("REDIRECT_URI:", DAN_REDIRECT_URI);
console.log("AUTH_URL:", DAN_AUTH_URL);
console.log("TOKEN_URL:", DAN_TOKEN_URL);
console.log("USERINFO_URL:", DAN_USERINFO_URL);
console.log("=================================");

// ✅ OAuth → redirect эхлэл
router.get("/login", (req, res) => {
  // Таны хүсэж буй сервисүүдийг зааж өгнө (жишээний дагуу)
  const service_structure = [
    {
      services: ["WS100101_getCitizenIDCardInfo"],
      wsdl: "https://xyp.gov.mn/citizen-1.3.0/ws?WSDL",
    },
  ];

  // JSON → Base64 → scope болгон дамжуулна
  const scope = Buffer.from(JSON.stringify(service_structure)).toString(
    "base64"
  );

  // random state (CSRF хамгаалалт)
  const state = Math.random().toString(36).substring(2, 15);

  const redirectUrl = `${DAN_AUTH_URL}?response_type=code&client_id=${DAN_CLIENT_ID}&redirect_uri=${encodeURIComponent(
    DAN_REDIRECT_URI
  )}&scope=${scope}&state=${state}`;

  console.log("➡️ Redirecting to:", redirectUrl);
  res.redirect(redirectUrl);
});

// ✅ OAuth → callback
router.get("/callback", async (req, res) => {
  const code = req.query.code;
  const state = req.query.state;
  console.log("✅ Received code:", code, "state:", state);

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
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    console.log("✅ Token response:", tokenRes.data);
    const access_token = tokenRes.data.access_token;

    // Access token ашиглан иргэний мэдээлэл дуудах
    const userInfoRes = await axios.get(DAN_USERINFO_URL, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    console.log("✅ User info response:", userInfoRes.data);

    // Иргэний нэр, РД, утсыг гаргаж авна
    const citizen =
      userInfoRes.data?.find?.((i) => i.services?.WS100101_getCitizenIDCardInfo)
        ?.services?.WS100101_getCitizenIDCardInfo?.response ?? {};

    const redirectClient = `tanuapp://dan-login-success?fullname=${encodeURIComponent(
      citizen.lastName || ""
    )}&register_number=${encodeURIComponent(citizen.regnum || "")}&phone=`;

    console.log("🔁 Redirecting back to app:", redirectClient);
    return res.redirect(redirectClient);
  } catch (error) {
    console.error(
      "❌ DAND callback error:",
      error?.response?.data || error.message
    );
    res.status(500).json({ error: "ДАН системтэй холбогдож чадсангүй" });
  }
});

module.exports = router;
