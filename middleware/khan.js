const axios = require("axios");
const qs = require("querystring");

const generateCredential = async () => {
  try {
    const username = process.env.corporateUserName;
    const password = process.env.corporatePass;

    const postData = qs.stringify({
      grant_type: "client_credentials",
    });

    const response = await axios.post(
      `${process.env.corporateEndPoint}/auth/token?grant_type=client_credentials`,
      postData,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        auth: {
          username,
          password,
        },
      }
    );

    return response.data.access_token;
  } catch (e) {
    console.log("❌ Khan Token Error:", e.response?.data || e.message);
    return null;
  }
};

module.exports = { generateCredential };
