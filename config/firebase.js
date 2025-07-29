// config/firebase.js

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// Load service account JSON directly
const serviceAccount = require(path.join(__dirname, 'serviceAccountKey.json'));

// ─── DEBUG: Confirm serviceAccount load ─────────────────────────
try {
  fs.appendFileSync(
    path.join(__dirname, '../debug.log'),
    `Loaded serviceAccount with keys: ${Object.keys(serviceAccount).join(', ')} at ${new Date().toISOString()}\n`
  );
} catch (e) {
  console.error('DEBUG LOG WRITE FAILED:', e);
}

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  // ─── DEBUG: Firebase initialized ─────────────────────────────
  try {
    fs.appendFileSync(
      path.join(__dirname, '../debug.log'),
      `Firebase Admin initialized using serviceAccountKey.json at ${new Date().toISOString()}\n`
    );
  } catch (e) {
    console.error('DEBUG LOG WRITE FAILED:', e);
  }
  console.log('✅ Firebase Admin initialized using serviceAccountKey.json');
} catch (err) {
  console.error('❌ Firebase Admin init error:', err);
  try {
    fs.appendFileSync(
      path.join(__dirname, '../debug.log'),
      `Firebase init error: ${err.message}\n`,
    );
  } catch (e) {
    console.error('DEBUG LOG WRITE FAILED:', e);
  }
  throw err;
}

module.exports = admin;
