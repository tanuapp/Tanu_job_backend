const sendFirebaseNotification = async ({
  title,
  body,
  data = {},
  topic = null,
  token = null,
}) => {
  if (!global.fireadmin) {
    throw new Error("Firebase Admin is not initialized.");
  }

  const message = {
    notification: {
      title,
      body,
    },
    data: {
      ...data,
      title,
      body,
    },
  };

  // Хаяг сонгох
  if (topic) {
    message.topic = topic;
  } else if (token) {
    message.token = token;
  } else {
    throw new Error("No topic or token specified");
  }

  try {
    const response = await global.fireadmin.messaging().send(message);
    console.log("✅ Firebase push илгээгдлээ:", response);
    return { success: true, response };
  } catch (error) {
    console.error("❌ Firebase push алдаа:", error);
    return { success: false, error };
  }
};

module.exports = sendFirebaseNotification;
