// import { initializeApp, applicationDefault} from 'firebase-admin/app';
// import { config as dotenvConfig } from 'dotenv';
// import * as admin from 'firebase-admin';
// import * as serviceAccountwp from './../../firebaseAdminserviceAccountKey.json';

// import * as firebase from 'firebase/app';
// import {getAuth} from 'firebase-admin/auth';

const admin = require('firebase-admin');
const firebase = require('firebase/app');
const serviceAccountwp = require('./../../firebaseAdminserviceAccountKey.json');

class FirebaseConfig {

  firebaseWPConf = {
    apiKey: "AIzaSyDrx8iJ6WtU56_7hu1O9SXrfu-rFdzePkc",
    authDomain: "worldplus-com.firebaseapp.com",
    projectId: "worldplus-com",
    storageBucket: "worldplus-com.appspot.com",
    messagingSenderId: "690458873057",
    appId: "1:690458873057:web:781ffa5ca4ba8e79283ba0",
    measurementId: "G-MD925917MW"
  };

  constructor() {
    // dotenvConfig();
    // this.app = app;
    // this.initializeWorldPlusApp();
    // this.initializeTMRWApp();
    // this.initializeKpopApp();

  }

  // async init() {
  //   this.initializeWorldPlusApp();
  // }
  // private initializeWorldPlusApp() {
  //   firebase.initializeApp(this.firebaseWPConf, 'wp');
  //   admin.initializeApp({
  //     credential: admin.credential.cert(serviceAccountwp as admin.ServiceAccount),
  //     projectId: this.firebaseWPConf.projectId,
  //   }, 'wpadmin');
  //   global.wpfb = firebase;
  //   global.wpadmin = admin.app('wpadmin');
  // }



  async init() {
    firebase.initializeApp(this.firebaseWPConf);
    // const app =
    admin.initializeApp({
      // credential: admin.credential.cert(serviceAccountwp as admin.ServiceAccount),
      credential: admin.credential.cert(serviceAccountwp),
      projectId: this.firebaseWPConf.projectId
    });
    global.firebase = firebase;
    global.fireadmin = admin;
  }
}

export default FirebaseConfig;

