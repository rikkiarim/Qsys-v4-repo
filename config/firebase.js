// config/firebase.js

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// Decode the Base64-encoded private key from ENV
const rawBase64 = process.env.FIREBASE_PRIVATE_KEY_BASE64 || '';
const privateKey = Buffer
  .from(rawBase64, 'base64')
  .toString('utf8');

// ─── DEBUG: Write key info to debug.log ──────────────────────────
try {
  const debugPath = path.join(__dirname, '../debug.log');
  fs.appendFileSync(debugPath, `FIREBASE_PRIVATE_KEY_BASE64 length: ${rawBase64.length}\n`);
  fs.appendFileSync(debugPath, `Decoded privateKey starts: ${privateKey.substring(0, 30).replace(/\n/g, '\\n')}\n`);
} catch (err) {
  // Fallback to stderr if file write fails
  console.error('DEBUG LOG WRITE FAILED:', err);
}

// Assemble service-account credentials
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
  // Log successful initialization
  try {
    fs.appendFileSync(path.join(__dirname, '../debug.log'), `Firebase Admin initialized at ${new Date().toISOString()}\n`);
  } catch (e) {
    console.error('DEBUG LOG WRITE FAILED:', e);
  }
  console.log('✅ Firebase Admin initialized');
} catch (err) {
  console.error('❌ Firebase Admin init error:', err);
  // Write error details to debug.log
  try {
    fs.appendFileSync(path.join(__dirname, '../debug.log'), `Firebase init error: ${err.message}\n`);
  } catch (e) {
    console.error('DEBUG LOG WRITE FAILED:', e);
  }
  throw err; // Crash to show in cPanel Errors
}

module.exports = admin;
