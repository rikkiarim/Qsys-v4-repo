// config/firebase.js
'use strict';

const admin = require('firebase-admin');

// Pull in and validate all required env vars
const {
  FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY,
  FIREBASE_DATABASE_URL  // only needed if you use the Realtime DB
} = process.env;

if (!FIREBASE_PROJECT_ID ||
    !FIREBASE_CLIENT_EMAIL ||
    !FIREBASE_PRIVATE_KEY) {
  throw new Error(
    'Missing one of FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY in environment'
  );
}

// Replace literal “\n” sequences with actual newlines
const privateKey = FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

// Initialize the Admin SDK
admin.initializeApp({
  credential: admin.credential.cert({
    projectId:   FIREBASE_PROJECT_ID,
    clientEmail: FIREBASE_CLIENT_EMAIL,
    privateKey:  privateKey
  }),
  // Only needed for RTDB; Firestore ignores this
  databaseURL: FIREBASE_DATABASE_URL
});

module.exports = admin;
