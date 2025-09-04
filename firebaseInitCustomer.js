// firebaseInitCustomer.js
const admin = require("firebase-admin");
const serviceAccountwp = require("./tanu-app-928a8-firebase-adminsdk-mrr1i-28babc6869.json");

const initFirebaseCustomer = () => {
  try {
    // ⚠️ Default app — зөвхөн 1 удаа initialize хийнэ
    const customerApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccountwp),
    });

    global.fireadminCustomer = customerApp;
  } catch (error) {
    process.exit(1);
  }
};

module.exports = initFirebaseCustomer;
