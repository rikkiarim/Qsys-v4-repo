// config/firebase.js

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// Decode the Base64-encoded service account JSON from ENV
const rawJsonBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_JSON_BASE64 || '';
let serviceAccount;
try {
  const jsonString = Buffer.from(rawJsonBase64, 'base64').toString('utf8');
  serviceAccount = JSON.parse(jsonString);
  // Optional: write debug info
  fs.appendFileSync(path.join(__dirname, '../debug.log'), `Service account JSON length: ${jsonString.length}\n`);
  fs.appendFileSync(path.join(__dirname, '../debug.log'), `Service account keys: ${Object.keys(serviceAccount).join(', ')}\n`);
} catch (err) {
  console.error('❌ Failed to parse service account JSON:', err);
  fs.appendFileSync(path.join(__dirname, '../debug.log'), `Failed to parse JSON: ${err.message}\n`);
  throw err;
}

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    // databaseURL: process.env.FIREBASE_DATABASE_URL, // if needed
  });
  fs.appendFileSync(path.join(__dirname, '../debug.log'), `Firebase Admin initialized at ${new Date().toISOString()}\n`);
  console.log('✅ Firebase Admin initialized');
} catch (err) {
  console.error('❌ Firebase Admin init error:', err);
  fs.appendFileSync(path.join(__dirname, '../debug.log'), `Firebase init error: ${err.message}\n`);
  throw err;
}

module.exports = admin;
