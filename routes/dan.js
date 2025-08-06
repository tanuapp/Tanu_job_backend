const express = require("express");
const router = express.Router();
const axios = require("axios");

const {
  DAN_CLIENT_ID,
  DAN_CLIENT_SECRET,
  DAN_REDIRECT_URI,
  DAN_AUTH_URL,
  DAN_TOKEN_URL,
  DAN_USERINFO_URL,
} = process.env;

router.get("/login", (req, res) => {
  const redirectUrl = `${DAN_AUTH_URL}?response_type=code&client_id=${DAN_CLIENT_ID}&redirect_uri=${encodeURIComponent(
    DAN_REDIRECT_URI
  )}&scope=openid profile`;
  res.redirect(redirectUrl);
});

router.get("/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send("Missing code");

  try {
    const tokenRes = await axios.post(DAN_TOKEN_URL, {
      code,
      client_id: DAN_CLIENT_ID,
      client_secret: DAN_CLIENT_SECRET,
      redirect_uri: DAN_REDIRECT_URI,
      grant_type: "authorization_code",
    });

    const access_token = tokenRes.data.access_token;

    const userInfoRes = await axios.get(DAN_USERINFO_URL, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const user = userInfoRes.data;

    // TODO: Танай системд тохируулан хэрэглэгч бүртгэх эсвэл токен үүсгэх
    res.json({
      message: "Амжилттай нэвтэрлээ",
      user,
    });
  } catch (error) {
    console.error(error?.response?.data || error.message);
    res.status(500).json({ error: "ДАН системтэй холбогдож чадсангүй" });
  }
});

module.exports = router;
