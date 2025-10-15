// firebaseInit.js
const admin = require("firebase-admin");
const serviceAccount = require("./tanu-app-928a8-firebase-adminsdk-mrr1i-a3b5b66120.json");

const initFirebase = () => {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("✅ Firebase initialized successfully");
  } else {
    console.log("⚙️ Firebase already initialized");
  }

  global.fireadmin = admin;
};

module.exports = initFirebase;
