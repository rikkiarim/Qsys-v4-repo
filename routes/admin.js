const express = require('express');
const router = express.Router();
const moment = require('moment');
const { db } = require('../config/firebase');

// Helper to count statuses for all branches/groups for today
async function getQueueStats() {
  const stats = { queued: 0, served: 0, completed: 0, skipped: 0 };
  const today = moment().format('YYYY-MM-DD');
  const branchesSnap = await db.collection('branches').get();

  for (const branchDoc of branchesSnap.docs) {
    const branchCode = branchDoc.id;
    for (const group of ['A', 'B', 'C']) {
      const groupRef = db.collection(`queues/${branchCode}/${today}/${group}`);
      const groupSnap = await groupRef.get();
      groupSnap.forEach(doc => {
        const status = doc.data().status;
        if (status && stats.hasOwnProperty(status)) stats[status]++;
      });
    }
  }
  return stats;
}

// Admin dashboard
router.get('/', async (req, res) => {
  try {
    const stats = await getQueueStats();
    res.render('admin/index', {
      user: req.session.user,
      stats
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    res.render('admin/index', {
      user: req.session.user,
      stats: { queued: 0, served: 0, completed: 0, skipped: 0 },
      error: 'Failed to load dashboard stats.'
    });
  }
});

module.exports = router;
