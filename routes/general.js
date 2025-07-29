// routes/general.js
console.log('general.js __dirname:', __dirname);

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// Import initialized Firebase Admin SDK from environment-based config
const admin = require('../config/firebase');

const getManilaDateKey = require('../utils/getManilaDateKey');
const getNextQueueNumber = require('../utils/getNextQueueNumber');
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;

// --- AUTH FLOW ---
router.get('/login', (req, res) => {
  logger.debug('GET /login');
  if (req.session && req.session.user) {
    const role = req.session.user.role;
    return res.redirect(role === 'admin' ? '/admin' : '/reception');
  }
  res.render('login', {
    hideSidebar: true,
    title: 'Login',
    layout: 'layouts/main'
  });
});

router.post('/login', async (req, res) => {
  logger.debug(`POST /login body: ${JSON.stringify(req.body)}`);
  try {
    const { email, password } = req.body;
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true })
      }
    );
    const data = await response.json();
    if (data.error) {
      logger.error(`Login error from Firebase: ${JSON.stringify(data.error)}`);
      return res.render('login', {
        error: 'Invalid email or password.',
        hideSidebar: true,
        title: 'Login',
        layout: 'layouts/main'
      });
    }

    const decodedToken = await admin.auth().verifyIdToken(data.idToken);
    const userRecord = await admin.auth().getUser(decodedToken.uid);
    const role = (decodedToken.role || 'staff').toLowerCase();
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(decodedToken.uid)
      .get();
    const userData = userDoc.exists ? userDoc.data() : {};
    const assignedBranch = userData.assignedBranch || '';

    req.session.user = {
      uid: decodedToken.uid,
      email: userRecord.email,
      role,
      assignedBranch
    };

    logger.debug(`User logged in → role: ${role}, assignedBranch: ${assignedBranch}`);
    return res.redirect(role === 'admin' ? '/admin' : '/reception');
  } catch (err) {
    logger.error(`Login exception: ${err.stack || err}`);
    return res.render('login', {
      error: 'An error occurred during login. Please try again.',
      hideSidebar: true,
      title: 'Login',
      layout: 'layouts/main'
    });
  }
});

router.post('/logout', async (req, res, next) => {
  try {
    await req.session.destroy();
    res.clearCookie('qsys_session');
    logger.debug('POST /logout - user session destroyed');
    return res.redirect('/login');
  } catch (err) {
    logger.error(`Logout error: ${err.stack || err}`);
    next(err);
  }
});

// ... other guest registration and routes unchanged ...

module.exports = router;
