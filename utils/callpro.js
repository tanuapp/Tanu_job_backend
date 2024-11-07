const axios = require("axios");

const sendMessage = async (to, text) => {
  try {
    const response = await axios.get(
      `https://api.messagepro.mn/send?from=72011005&to=${to}&text=${text}`,
      {
        headers: {
          "x-api-key": "449a375104be009911dc31640fb082b1",
        },
      }
    );
    return { success: true, data: response.data }; // Return success and data
  } catch (error) {
    // Return error information instead of using res
    return { success: false, error: error.message };
  }
};

module.exports = sendMessage;
