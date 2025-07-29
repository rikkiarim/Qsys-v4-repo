// config/firebase.js

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// ─── DEBUG: Raw PRIVATE_KEY env inspection ─────────────────────────
console.log('Loaded PRIVATE_KEY starts with:', process.env.FIREBASE_PRIVATE_KEY.slice(0,30));
console.log('Contains literal "\\n"?', process.env.FIREBASE_PRIVATE_KEY.includes('\\n'));

// Build credentials from environment variables
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
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

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  // ─── DEBUG: Firebase initialized ─────────────────────────────
  try {
    fs.appendFileSync(
      path.join(__dirname, './debug.log'),
      `Firebase Admin initialized using environment variables at ${new Date().toISOString()}\n`
    );
  } catch (e) {
    console.error('DEBUG LOG WRITE FAILED:', e);
  }
  console.log('✅ Firebase Admin initialized using environment variables');
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
