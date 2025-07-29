// config/firebase.js

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// ─── DEBUG: Server Time & Raw Key Inspection ───────────────────────
console.log('Server time:', new Date().toISOString());
console.log('Loaded PRIVATE_KEY starts with:', process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.slice(0,30) : 'undefined');
console.log('Contains literal "\\n"?', process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.includes('\\n') : false);
console.log('PRIVATE_KEY ends with:', process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.slice(-30) : 'undefined');

// Decode Base64 or unescape newlines
let rawKey;
if (process.env.FIREBASE_PRIVATE_KEY_B64) {
  rawKey = Buffer.from(process.env.FIREBASE_PRIVATE_KEY_B64, 'base64').toString('utf8');
} else {
  rawKey = process.env.FIREBASE_PRIVATE_KEY
    .replace(/\\r/g, '')          // strip any stray CR
    .replace(/\\n/g, '\n')       // unescape newlines
    .trim();                        // remove leading/trailing whitespace
}

// Build credentials from environment variables
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: rawKey,
};

// ─── DEBUG: Confirm serviceAccount load ─────────────────────────
try {
  fs.appendFileSync(
    path.join(__dirname, './debug.log'),
    `Loaded serviceAccount with keys: ${Object.keys(serviceAccount).join(', ')} at ${new Date().toISOString()}\n`
  );
} catch (e) {
  console.error('DEBUG LOG WRITE FAILED:', e);
}

// Initialize Firebase Admin
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log('✅ Firebase Admin initialized using environment variables');
  try {
    fs.appendFileSync(
      path.join(__dirname, './debug.log'),
      `Firebase Admin initialized at ${new Date().toISOString()}\n`
    );
  } catch (e) {
    console.error('DEBUG LOG WRITE FAILED:', e);
  }
} catch (err) {
  console.error('❌ Firebase Admin init error:', err);
  try {
    fs.appendFileSync(
      path.join(__dirname, './debug.log'),
      `Firebase init error: ${err.message}\n`,
    );
  } catch (e) {
    console.error('DEBUG LOG WRITE FAILED:', e);
  }
  throw err;
}

module.exports = admin;
