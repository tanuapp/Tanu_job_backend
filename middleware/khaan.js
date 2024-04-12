const { default: axios } = require("axios");

async function token() {
  var session_url = process.env.qpayUrl + "auth/token";
  await axios
    .post(
      session_url,
      {},
      {
        auth: {
          username: process.env.QpayUserName,
          password: process.env.QpayPassword
        }
      }
    )
    .then((res) => {
      console.log("res.data");
      console.log(res.data);
      return res.data;
    })
    .catch((error) => {
      if (error.response) {
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
      } else if (error.request) {
        console.log(error.request);
      } else {
        console.log("Error", error.message);
      }
      return res
        .status(500)
        .json({ status: 0, statusText: "Service iin aldaa garlaa" });
    });
  console.log("555");
}

const makeRequest = async () => {
  // console.log(
  //   `Basic ${btoa("5JOUr2z5Shg2JcMLEdb3azL2M4HnqGRa" + ":" + "Di8951oq4ES3LqlG")}`
  // );
  try {
    // const response = await axios.post(
    //    "https://doob.world:6442/v1/auth/token?grant_type=client_credentials",
    //   {},
    //   {
    //     headers: {
    //       "Content-Type": "application/x-www-form-urlencoded",
    //       Authorization: `Basic ${btoa(
    //         "qmAMwMMUT9KfWJr7ciR2QuLNJBmfalFj" + ":" + "usGUrpt3NBoGu6PV"
    //       )}`
    //     }
    //   }
    // );
    const response = await axios.post(
      "https://api.khanbank.com/v1/auth/token?grant_type=client_credentials",
     {},
     {
       headers: {
         "Content-Type": "application/x-www-form-urlencoded",
         Authorization: `Basic ${btoa(
           "5JOUr2z5Shg2JcMLEdb3azL2M4HnqGRa" + ":" + "Di8951oq4ES3LqlG"
         )}`
       }
     }
   );
    if (response.status === 200) {
      // response - object, eg { status: 200, message: 'OK' }
      return response.data;
    }
    return response.status;
  } catch (err) {
    console.error(err);
    return "error";
  }
};

module.exports = { token, makeRequest };
