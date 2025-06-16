const sendFirebaseNotification = async ({ title, body, data = {}, token }) => {
  if (!global.fireadmin) {
    throw new Error("Firebase Admin is not initialized.");
  }

  const message = {
    notification:{
      title: String(title),
      body: String(body)
    },
    data:  Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
    token,
    android: {
      notification: {
        sound: "default",
      },
    },
    data:{},
    apns: {
      headers: {
        "apns-priority": "10",
      },
      payload: {
        aps: {
          contentAvailable: true,
          sound: "default",
        },
      },
    }
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

  // console.log("📤 Firebase Message:", message);
  // const message = {
  //   notification: {
  //     title,
  //     body,
  //   },
  //   data: {
  //     ...data,
  //     title,
  //     body,
  //   },
  //   token,
  //   android: {
  //     notification: {
  //       sound: "default",
  //     },
  //   },
  //   apns: {
  //     payload: {
  //       aps: {
  //         sound: "default",
  //       },
  //     },
  //   },
  // };
//   console.log(message);
//   try {
//     const response = await global.fireadmin.messaging().send(message);
//     console.log("✅ Firebase notification sent:", response);
//     return { success: true, response };
//   } catch (error) {
//     console.error("❌ Firebase notification error:", error.message);
//     return { success: false, error };
//   }
// };

module.exports = sendFirebaseNotification;
