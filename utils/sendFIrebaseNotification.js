const sendFirebaseNotification = async ({ title, body, data = {}, token }) => {
  if (!global.fireadmin) {
    throw new Error("Firebase Admin is not initialized.");
  }

  const message = {
    token,
    notification: {
      title: String(title),
      body: String(body),
    },
    data: Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, String(v)])
    ),
    android: {
      notification: {
        icon: "ic_notification", // ✅ Android-д icon заана (цааш доорх тайлбар хар)
        color: "#3A86FF",
        sound: "default",
        priority: "high",
      },
    },
    apns: {
      headers: {
        "apns-priority": "10",
      },
      payload: {
        aps: {
          alert: {
            title: String(title),
            body: String(body),
          },
          sound: "default",
          badge: 1,
          contentAvailable: true,
          mutableContent: true,
        },
      },
    },
  };

  try {
    const response = await global.fireadmin.messaging().send(message);
    console.log("✅ Firebase notification sent:", response);
    return { success: true, response };
  } catch (error) {
    console.error("❌ Firebase notification error:", error.message);
    return { success: false, error };
  }
};

module.exports = sendFirebaseNotification;
