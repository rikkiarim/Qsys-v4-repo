// config/firebase.js
'use strict';

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  throw new Error('❌ Missing serviceAccountKey.json in /config');
}

const serviceAccount = require(serviceAccountPath);

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL || undefined
  });
  console.log('✅ Firebase initialized via serviceAccountKey.json');
} catch (err) {
  console.error('🔥 Firebase init failed:', err.message);
  throw err;
}

module.exports = admin;
