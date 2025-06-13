// const admin = require('firebase-admin');
// const firebase = require('firebase/app');
// const serviceAccountwp = require('./tanu-app-928a8-firebase-adminsdk-mrr1i-c1f11a463c.json');

// const firebaseWPConf = {
//   apiKey: "AIzaSyDrx8iJ6WtU56_7hu1O9SXrfu-rFdzePkc",
//   authDomain: "worldplus-com.firebaseapp.com",
//   projectId: "worldplus-com",
//   storageBucket: "worldplus-com.appspot.com",
//   messagingSenderId: "690458873057",
//   appId: "1:690458873057:web:781ffa5ca4ba8e79283ba0",
//   measurementId: "G-MD925917MW"
// };

// const initFirebase = async () => {
//   try {
//     firebase.initializeApp(firebaseWPConf);

//     admin.initializeApp({
//       credential: admin.credential.cert(serviceAccountwp),
//       projectId: firebaseWPConf.projectId
//     });

//     global.firebase = firebase;
//     global.fireadmin = admin;

//     console.log("Firebase initialized successfully");
//   } catch (error) {
//     console.error("Firebase initialization failed:", error.message);
//     process.exit(1);
//   }
// };

// module.exports = initFirebase;

const admin = require('firebase-admin');
const serviceAccountwp = require('./tanu-app-928a8-firebase-adminsdk-mrr1i-c1f11a463c.json');

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
