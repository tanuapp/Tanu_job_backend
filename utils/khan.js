const { default: axios } = require("axios");
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
          username: username,
          password: password,
        },
      }
    );

    console.log(response.data.access_token);

    return response.data.access_token;
  } catch (e) {
    console.log("alda");
    console.log(e.response ? e.response.data : e.message);
  }
};

const send = async (
  token,
  toAccount,
  toAccountName,
  toBank,
  amount,
  description
) => {
  const body = {
    fromAccount: process.env.corporateAccountNumber,
    toAccount,
    toAccountName,
    toBank,
    amount: amount,
    description: `Захиалга #5197 төлбөр ${new Date().toLocaleDateString(
      "mn-MN"
    )}`,
    toCurrency: "MNT",
    currency: "MNT",
    loginName: process.env.corporateEmail,
    tranPassword: process.env.corporateTranPass,
    transferid: "001",
  };
  const response = await axios.post(
    `${process.env.corporateEndPoint}transfer/${
      toBank == "050000" ? "domestic" : "interbank"
    }`,
    body,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json", // Optional, depending on the API
      },
    }
  );

  return response.data;
};

module.exports = {
  generateCredential,
  send,
};
