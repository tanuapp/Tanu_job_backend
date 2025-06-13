const sendFirebaseNotification = async ({ title, body, data = {}, topic = null, token = null }) => {
  if (!global.fireadmin) {
    throw new Error("Firebase Admin is not initialized.");
  }

  const message = {
    notification: {
      title,
      body,
    },
    android: {
      notification: {
        sound: "default",
      },
    },
    apns: {
      payload: {
        aps: {
          sound: "default",
        },
      },
    },
    data,
  };

  // Send to topic or specific token
  if (topic) {
    message.topic = topic;
  } else if (token) {
    message.token = token;
  } else {
    throw new Error("No topic");
  }

  try {
    const response = await global.fireadmin.messaging().send(message);
    return { success: true, response };
  } catch (error) {
    return { success: false, error };
  }
};

module.exports = sendFirebaseNotification;
