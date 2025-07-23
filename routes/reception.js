// routes/reception.js

const express          = require('express');
const admin            = require('../config/firebase');
const router           = express.Router();
const getManilaDateKey = require('../utils/getManilaDateKey');
const { isStaff }      = require('../middleware/auth');

// Protect all /reception routes so only staff can access
router.use(isStaff);

// GET Reception Dashboard
router.get('/', (req, res) => {
  const branch         = req.session.user.assignedBranch;
  const dateKey        = getManilaDateKey();
  const firebaseConfig = {
    apiKey:     process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId:  process.env.FIREBASE_PROJECT_ID,
    // add other client config fields as needed
  };

  res.render('reception/index', {
    title:          'Reception Dashboard',
    hideSidebar:    false,
    user:           req.session.user,
    branch,
    dateKey,
    firebaseConfig,
    layout:         'layouts/main'
  });
});

// GET External Display View
router.get('/display', async (req, res) => {
  try {
    const branch         = req.session.user.assignedBranch;
    const dateKey        = getManilaDateKey();
    const categories     = ['A', 'B', 'C'];
    const guests         = [];

    for (const cat of categories) {
      const snap = await admin.firestore()
        .collection('queues')
        .doc(branch)
        .collection(dateKey)
        .doc(cat)
        .collection('list')
        .where('status', '==', 'called')
        .orderBy('timestamp', 'asc')
        .get();

      snap.forEach(doc => guests.push(doc.data()));
    }

    const firebaseConfig = {
      apiKey:     process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId:  process.env.FIREBASE_PROJECT_ID,
      // add other fields if needed
    };

    res.render('reception/display', {
      title:          'Guest Queueing',
      hideSidebar:    true,
      branch,
      dateKey,
      firebaseConfig,
      guests,
      layout:         'layouts/main'
    });
  } catch (err) {
    console.error('External display error:', err);
    res.status(500).send('Failed to load external display.');
  }
});

module.exports = router;
