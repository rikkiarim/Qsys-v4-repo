// config/firebase.js

// Load service account JSON directly from file
const path = require('path');
const admin = require('firebase-admin');

// Path to the uploaded service account key JSON:
const serviceAccount = require(path.join(__dirname, 'serviceAccountKey.json'));

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    // databaseURL: process.env.FIREBASE_DATABASE_URL, // if needed
  });
  console.log('✅ Firebase Admin initialized using serviceAccountKey.json');
} catch (err) {
  console.error('❌ Firebase Admin init error:', err);
  throw err;
}

module.exports = admin;
