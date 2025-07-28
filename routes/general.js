// routes/general.js



const express               = require('express');

const fetch                 = require('node-fetch');

const admin                 = require('../config/firebase');

const router                = express.Router();

const fs                    = require('fs');

const path                  = require('path');

const getManilaDateKey      = require('../utils/getManilaDateKey');

const getNextQueueNumber    = require('../utils/getNextQueueNumber');

const FIREBASE_API_KEY      = process.env.FIREBASE_API_KEY;



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

  // DEBUG: log every login attempt to a file
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


  fs.appendFileSync(path.join(__dirname, '../login-debug.log'), debugEntry);



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

    const userData      = userDoc.exists ? userDoc.data() : {};

    const assignedBranch = userData.assignedbranch || '';



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



// --- GUEST REGISTRATION FLOW ---



router.get('/guest/register/:branchCode', (req, res) => {

  console.log('>>> [GUEST REGISTER GET] Branch:', req.params.branchCode);

  res.render('guest/register', {

    branchCode:  req.params.branchCode,

    hideSidebar: true,

    title:       'Reserve Your Seat',

    layout:      'layouts/main',

    user:        null

  });

});



router.post('/guest/register/:branchCode', async (req, res) => {

  console.log(

    '>>> [GUEST REGISTER POST] Branch:', req.params.branchCode,

    'Data:', req.body

  );

  try {

    const { name, pax, phone } = req.body;

    const paxNum     = parseInt(pax, 10) || 1;

    const category   = paxNum <= 2 ? 'A' : paxNum <= 4 ? 'B' : 'C';

    const branchCode = req.params.branchCode;

    const dateKey    = getManilaDateKey();



    // 1) Atomically fetch & increment the counter for this category

    const nextNum = await getNextQueueNumber(branchCode, dateKey, category);



    // 2) Build the full queue number (e.g., "A2")

    const queueNo = `${category}${nextNum}`;

    const queueData = {

      name,

      pax:        paxNum,

      phone:      phone || '',

      status:     'queued',

      queueNo,                                   // store full label

      timestamp:  admin.firestore.FieldValue.serverTimestamp()

    };



    // 3) Persist under /queues/{branchCode}/{dateKey}/{category}/list/{docId}

    await admin.firestore()

      .collection('queues')

      .doc(branchCode)

      .collection(dateKey)

      .doc(category)

      .collection('list')

      .doc(nextNum.toString())

      .set(queueData);



    // 4) Render confirmation with the correct sequential label

    res.render('guest/confirmation', {

      queueNumber: queueNo,

      name,

      hideSidebar: true,

      title:       'Queue Confirmation',

      layout:      'layouts/main',

      user:        null

    });

  } catch (err) {

    console.error('Guest registration error:', err);

    res.status(500).send('An error occurred. Please try again.');

  }

});



// --- DEBUG / TEST ROUTE ---



router.get('/test-ejs', (req, res) => {

  console.log('>>> [TEST-EJS ROUTE] Rendering test with layout');

  res.render('test', {

    hideSidebar: true,

    title:       'Test EJS Layout',

    layout:      'layouts/main'

  });

});



module.exports = router;

