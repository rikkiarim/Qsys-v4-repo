// routes/general.js

const express = require('express');
const admin = require('../config/firebase'); // Firebase Admin SDK
const router = express.Router();

// Node 18+ has built-in fetch; comment out node-fetch import to avoid missing module errors
// const fetch = require('node-fetch');

const fs = require('fs');
const path = require('path');
const getManilaDateKey = require('../utils/getManilaDateKey');
const getNextQueueNumber = require('../utils/getNextQueueNumber');
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;

// --- AUTH FLOW ---
router.get('/login', (req, res) => {
  console.log('>>> [LOGIN GET] Route hit');
  if (req.session && req.session.user) {
    const role = req.session.user.role;
    return res.redirect(role === 'admin' ? '/admin' : '/reception');
  }
  res.render('login', {
    hideSidebar: true,
    title:       'Login',
    layout:      'layouts/main'
  });
});

router.post('/login', async (req, res) => {
  console.log("🔐 Firebase Login Diagnostics:");
  console.log("🌐 PROJECT_ID:", process.env.FIREBASE_PROJECT_ID);
  console.log("📧 CLIENT_EMAIL:", process.env.FIREBASE_CLIENT_EMAIL);
  console.log("🔑 PRIVATE_KEY (first 50 chars):", process.env.FIREBASE_PRIVATE_KEY?.substring(0, 50));

  const debugEntry = JSON.stringify({
    time:             new Date().toISOString(),
    apiKey:           process.env.FIREBASE_API_KEY,
    authDomain:       process.env.FIREBASE_AUTH_DOMAIN,
    rawPrivateKey:    process.env.FIREBASE_PRIVATE_KEY?.substring(0, 50),
    decodedPrivateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n').substring(0, 50),
    body:             req.body
  }) + '\n';

  fs.appendFileSync(path.join(__dirname, './login-debug.log'), debugEntry);
  console.log('>>> [LOGIN POST] Data:', req.body);

  try {
    const { email, password } = req.body;

    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password, returnSecureToken: true })
      }
    );

    const data = await response.json();
    if (data.error) {
      console.error('Login error from Firebase:', data.error);
      return res.render('login', {
        error:       'Invalid email or password.',
        hideSidebar: true,
        title:       'Login',
        layout:      'layouts/main'
      });
    }

    const decodedToken = await admin.auth().verifyIdToken(data.idToken);
    const userRecord   = await admin.auth().getUser(decodedToken.uid);
    const role         = (decodedToken.role || 'staff').toLowerCase();

    const userDoc = await admin.firestore()
      .collection('users')
      .doc(decodedToken.uid)
      .get();

    const userData       = userDoc.exists ? userDoc.data() : {};
    const assignedBranch = userData.assignedBranch || '';

    req.session.user = {
      uid:            decodedToken.uid,
      email:          userRecord.email,
      role,
      assignedBranch
    };

    console.log('User logged in →', 'role:', role, 'assignedBranch:', assignedBranch);
    return res.redirect(role === 'admin' ? '/admin' : '/reception');
  } catch (err) {
    console.error('Login exception:', err);
    fs.appendFileSync(path.join(__dirname, '../login-debug.log'), '[LOGIN ERROR] ' + err.message + '\n');
    res.render('login', {
      error:       'An error occurred during login. Please try again.',
      hideSidebar: true,
      title:       'Login',
      layout:      'layouts/main'
    });
  }
});

router.post('/logout', async (req, res, next) => {
  try {
    await req.session.destroy();
    res.clearCookie('qsys_session');
    return res.redirect('/login');
  } catch (err) {
    console.error('Logout error:', err);
    next(err);
  }
});

// ... other guest registration and routes unchanged ...

module.exports = router;
