// config/firebase.js
'use strict';

const admin = require('firebase-admin');

// Require and validate all needed env vars
const {
  FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY,
  FIREBASE_DATABASE_URL
} = process.env;

if (!FIREBASE_PROJECT_ID ||
    !FIREBASE_CLIENT_EMAIL ||
    !FIREBASE_PRIVATE_KEY) {
  throw new Error(
    'Missing one of FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY env vars'
  );
}

// Un-escape the private key newline characters
const privateKey = FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

// Initialize the Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert({
    projectId:   FIREBASE_PROJECT_ID,
    clientEmail: FIREBASE_CLIENT_EMAIL,
    privateKey:  privateKey
  }),
  databaseURL: FIREBASE_DATABASE_URL  // optional, if you use RTDB
});

module.exports = admin;
