// apnService.js
const apn = require("apn");
const path = require("path");

let apnProvider = null;

function getApnProvider() {
  if (!apnProvider) {
    apnProvider = new apn.Provider({
      token: {
        key: path.join(__dirname, "../AuthKey_NVBB4J24GS.p8"),
        keyId: "NVBB4J24GS",
        teamId: "X773389H5L",
      },
      production: true,
    });
  }
  return apnProvider;
}

// Utility function to send APN notification
async function sendNotification(deviceTokens, alertMessage, sound = "default") {
  const provider = getApnProvider();

  const notification = new apn.Notification();
  notification.topic = "com.tanusoft.tanubooking"; // Replace with your app's bundle ID
  notification.alert = alertMessage;
  notification.priority = 10;
  notification.sound = sound;

  try {
    // Sending to an array of device tokens
    const response = await provider.send(notification, deviceTokens);
    const failedTokens = response.failed.map((failure) => failure.device);

    return { success: true, failedTokens };
  } catch (error) {
    console.error("Failed to send APN notification:", error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendNotification,
};
