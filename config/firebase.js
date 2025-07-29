// config/firebase.js

const admin = require('firebase-admin');

// Debug output only to console!
console.log('Server time:', new Date().toISOString());
console.log('Loaded PRIVATE_KEY starts with:', process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.slice(0, 30) : 'undefined');
console.log('Contains literal "\\n"?', process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.includes('\\n') : false);
console.log('PRIVATE_KEY ends with:', process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.slice(-30) : 'undefined');

// Determine raw private key (Base64 or escaped newlines)
let rawKey;
if (process.env.FIREBASE_PRIVATE_KEY_B64) {
  rawKey = Buffer.from(process.env.FIREBASE_PRIVATE_KEY_B64, 'base64').toString('utf8');
} else if (process.env.FIREBASE_PRIVATE_KEY) {
  rawKey = process.env.FIREBASE_PRIVATE_KEY
    .replace(/\\r/g, '')
    .replace(/\\n/g, '\n')
    .trim();
} else {
  console.error('❌ ERROR: No Firebase private key environment variable found.');
  process.exit(1);
}

// Build credentials from environment variables
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: rawKey,
};

// Initialize Firebase Admin
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log('✅ Firebase Admin initialized using environment variables');
} catch (err) {
  console.error('❌ Firebase Admin init error:', err);
  throw err;
}

module.exports = admin;
