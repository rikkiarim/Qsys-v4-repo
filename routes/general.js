const express = require('express');
const fetch = require('node-fetch');
const admin = require('../config/firebase');
const router = express.Router();

const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;

// GET login page
router.get('/login', (req, res) => {
  if (req.session.user) {
    // Normalize role before checking
    const role = (req.session.user.role || '').toLowerCase();
    return res.redirect(role === 'admin' ? '/admin' : '/reception');
  }
  res.render('login', { error: null, success: null });
});

// POST login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    // Call Firebase REST API to sign in user
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    });

    const data = await response.json();

    if (data.error) {
      // Log full Firebase error object for debugging
      console.error('Firebase login error:', JSON.stringify(data.error, null, 2));
      return res.render('login', { error: 'Invalid email or password.', success: null });
    }

    // Verify ID token with Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(data.idToken);

    // Get user record (optional: to get email or other info)
    const userRecord = await admin.auth().getUser(decodedToken.uid);

    // Get role from custom claims or default to 'staff', normalize to lowercase
    const role = (decodedToken.role || 'staff').toLowerCase();

    // Assign session user data here
    req.session.user = {
      uid: decodedToken.uid,
      email: userRecord.email,
      role: role,
    };

    // Log user role for debugging
    console.log('User role:', req.session.user.role);

    // Redirect user to appropriate dashboard using normalized role
    return res.redirect(req.session.user.role === 'admin' ? '/admin' : '/reception');
  } catch (err) {
    console.error('Login error:', err);
    res.render('login', { error: 'Server error.', success: null });
  }
});

// POST logout route
router.post('/logout', (req, res, next) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Logout error:', err);
      return next(err);
    }
    res.clearCookie('qsys_session');
    res.redirect('/login');
  });
});

module.exports = router;
