const express = require('express');
const router = express.Router();
const admin = require('../config/firebase');
const renderWithLayout = require('../utils/renderWithLayout');

router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Firebase admin cannot sign in users with password directly
    // Instead, verify the account exists and is enabled
    const userRecord = await admin.auth().getUserByEmail(email);

    // Password validation must be done client-side (Firebase Admin SDK doesn't support password auth)
    // For server-side only, use Firebase REST API to verify password
    const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

    const resp = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyAmiP_m0d7FDDctbQfAsl3yOAiOO6VqTGE', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true
      })
    });

    const data = await resp.json();

    if (data.error) {
      return res.render('login', { error: 'Invalid email or password.' });
    }

    // You may want to store session data here for user
    // req.session.user = { uid: data.localId, email: data.email, token: data.idToken };

    // Role-based redirect logic (you'd fetch user role from Firestore, for now redirect to /admin)
    return res.redirect('/admin');
  } catch (err) {
    return res.render('login', { error: 'Invalid email or password.' });
  }
});

router.get('/login', (req, res) => {
  res.render('login', { error: null, success: null });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Firebase Auth logic here (see prior examples)
    // Use the REST API to sign in and get the user's idToken and localId

    // ... (after Firebase Auth success)
    // Assume user role fetched from Firestore or hardcoded for now:
    let role = 'staff'; // or 'admin'

    // Set session info:
    req.session.user = {
      uid: 'firebase-uid', // fill from data.localId
      email,
      role
    };

    // Prompt on success, then JS redirect after a short delay
    return res.render('login', {
      error: null,
      success: 'Login successful! Redirecting...',
      role
    });
  } catch (err) {
    return res.render('login', { error: 'Invalid email or password.', success: null });
  }
});

module.exports = router;
