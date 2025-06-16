const admin = require("firebase-admin");
const serviceAccountwp = require("./tanu-app-928a8-firebase-adminsdk-mrr1i-c1f11a463c.json");

const initFirebase = async () => {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountwp),
    });

    global.fireadmin = admin;

    console.log("Firebase Admin initialized successfully");
  } catch (error) {
    console.error("Firebase Admin initialization failed:", error.message);
    process.exit(1);
  }
};

module.exports = initFirebase;
