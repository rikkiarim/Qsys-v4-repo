// config/firebase.js

const admin = require('firebase-admin');

// Assemble service‐account credentials from your env vars:
const serviceAccount = {
  projectId:   process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  // replace literal “\n” sequences with real newlines:
  privateKey:  (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
};

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    // optional: databaseURL: process.env.FIREBASE_DATABASE_URL
  });
  console.log('✅ Firebase Admin initialized');
} catch (err) {
  console.error('❌ Firebase Admin init error:', err);
  // rethrow so we can see it clearly in cPanel’s Errors log:
  throw err;
}

module.exports = admin;
