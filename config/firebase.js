// config/firebase.js
'use strict';

const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require(path.join(__dirname, 'serviceAccountKey.json'));

// Initialize the Admin SDK using static JSON key
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL || undefined
});

console.log('✅ [firebase.js] Initialized Firebase via serviceAccountKey.json');

module.exports = admin;
