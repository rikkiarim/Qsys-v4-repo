// config/firebase.js

const admin = require('firebase-admin');

// Decode the Base64‐encoded private key from ENV
const rawBase64 = process.env.FIREBASE_PRIVATE_KEY_BASE64;
const privateKey = Buffer
  .from(rawBase64 || '', 'base64')
  .toString('utf8');

// Debug output to verify key arrives intact
console.log('🔍 FIREBASE_PRIVATE_KEY_BASE64 length:', rawBase64?.length);
console.log(
  '🔍 Decoded key startsWith:',
  privateKey.substring(0, 30).replace(/\n/g, '\\n')
);

// Assemble service‐account credentials
const serviceAccount = {
  projectId:   process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey,
};

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    // databaseURL: process.env.FIREBASE_DATABASE_URL, // if needed
  });
  console.log('✅ Firebase Admin initialized');
} catch (err) {
  console.error('❌ Firebase Admin init error:', err);
  throw err; // Crash early so we see the trace in cPanel Errors
}

module.exports = admin;
