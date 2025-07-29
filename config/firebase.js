// config/firebase.js
'use strict';

const admin = require('firebase-admin');

const {
  FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY,
  FIREBASE_DATABASE_URL
} = process.env;

if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
  throw new Error('Missing Firebase env vars.');
}

// Decode newlines (\\n → \n)
const privateKey = FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

console.log('✅ [firebase.js] Loaded Firebase via ENV');
console.log('🔐 ENV private key first 50:', privateKey.substring(0, 50));

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: FIREBASE_PROJECT_ID,
    clientEmail: FIREBASE_CLIENT_EMAIL,
    privateKey: privateKey,
  }),
  databaseURL: FIREBASE_DATABASE_URL || undefined,
});

module.exports = admin;
