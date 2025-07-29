const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const admin = require('../config/firebase');

// =====================
// ADMIN DASHBOARD
// =====================
router.get('/', isAuthenticated, isAdmin, (req, res) => {
  res.render('admin/index', {
    user: req.session.user,
    title: 'Admin Dashboard',
    hideSidebar: false,
    layout: 'layouts/main'
  });
});

// =====================
// BRANCH MANAGEMENT
// =====================

// List all branches with pagination & case-insensitive substring search
router.get('/branches', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const pageSize = parseInt(req.query.pageSize) || 10;
    let search = (req.query.search || '').trim().toLowerCase();
    const cursor = req.query.cursor || null;
    const direction = req.query.direction || 'next';

    let query = admin.firestore().collection('branches').orderBy('name');
    let snap = await query.get();
    let allBranches = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    let filteredBranches = search
      ? allBranches.filter(branch =>
          branch.name && branch.name.toLowerCase().includes(search)
        )
      : allBranches;

    let startIndex = 0;
    let hasPrev = false;
    let hasNext = false;

    if (cursor) {
      const idx = filteredBranches.findIndex(b => b.id === cursor);
      if (direction === 'next') startIndex = idx + 1;
      else startIndex = Math.max(0, idx - pageSize);
      hasPrev = startIndex > 0;
    }

    const branches = filteredBranches.slice(startIndex, startIndex + pageSize);
    hasNext = (startIndex + pageSize) < filteredBranches.length;

    const firstDoc = branches[0] || null;
    const lastDoc = branches[branches.length - 1] || null;

    if (req.xhr) {
      return res.render('admin/branches-table.ejs', { branches }, (err, html) => {
        if (err) return res.status(500).send('Render error');
        res.send({
          html,
          hasNext,
          hasPrev,
          firstId: firstDoc ? firstDoc.id : '',
          lastId: lastDoc ? lastDoc.id : ''
        });
      });
    }

    res.render('admin/branches', {
      user: req.session.user,
      title: 'Branch Management',
      branches,
      pageSize,
      search,
      hasNext,
      hasPrev,
      firstId: firstDoc ? firstDoc.id : '',
      lastId: lastDoc ? lastDoc.id : '',
      hideSidebar: false,
      layout: 'layouts/main'
    });
  } catch (err) {
    req.session.error = 'Failed to load branches.';
    res.redirect('/admin/branches');
  }
});

// Add branch
router.post('/branches/add', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { name, code } = req.body;
    await admin.firestore().collection('branches').add({ name, code });
    req.session.success = 'Branch added successfully!';
    res.redirect('/admin/branches');
  } catch (err) {
    req.session.error = 'Failed to add branch.';
    res.redirect('/admin/branches');
  }
});

// Edit branch
router.post('/branches/edit/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { name, code } = req.body;
    const { id } = req.params;
    await admin.firestore().collection('branches').doc(id).update({ name, code });
    req.session.success = 'Branch updated successfully!';
    res.redirect('/admin/branches');
  } catch (err) {
    req.session.error = 'Failed to update branch.';
    res.redirect('/admin/branches');
  }
});

// Delete branch
router.post('/branches/delete/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await admin.firestore().collection('branches').doc(id).delete();
    req.session.success = 'Branch deleted.';
    res.redirect('/admin/branches');
  } catch (err) {
    req.session.error = 'Failed to delete branch.';
    res.redirect('/admin/branches');
  }
});

// =====================
// USER MANAGEMENT
// =====================

// List users
router.get('/users', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const usersSnap = await admin.firestore().collection('users').get();
    const users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Load branches for dropdown (for user creation form)
    const branchesSnap = await admin.firestore().collection('branches').get();
    const branches = branchesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.render('admin/users', {
      user: req.session.user,
      title: 'User Management',
      users,
      branches,
      hideSidebar: false,
      layout: 'layouts/main'
    });
  } catch (err) {
    req.session.error = 'Failed to load users.';
    res.redirect('/admin');
  }
});

// Add user (to Auth and Firestore)
router.post('/users/add', isAuthenticated, isAdmin, async (req, res) => {
  const { name, email, password, role, branch } = req.body;
  let userRecord;
  try {
    // 1. Create user in Firebase Auth
    userRecord = await admin.auth().createUser({
      email,
      password, // Make sure to validate in frontend and backend!
      displayName: name,
      disabled: false
    });

    // 2. Add user profile to Firestore
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      name,
      email,
      role,
      branch,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    req.session.success = 'User added successfully!';
    res.redirect('/admin/users');
  } catch (error) {
    // Clean up: if Auth user was created but Firestore failed
    if (userRecord && userRecord.uid) {
      await admin.auth().deleteUser(userRecord.uid);
    }
    req.session.error = `Failed to add user: ${error.message}`;
    res.redirect('/admin/users');
  }
});

// Delete user (from Auth and Firestore)
router.post('/users/delete/:uid', isAuthenticated, isAdmin, async (req, res) => {
  const { uid } = req.params;
  try {
    // 1. Delete from Firebase Auth
    await admin.auth().deleteUser(uid);
    // 2. Delete from Firestore
    await admin.firestore().collection('users').doc(uid).delete();
    req.session.success = 'User deleted.';
    res.redirect('/admin/users');
  } catch (err) {
    req.session.error = `Failed to delete user: ${err.message}`;
    res.redirect('/admin/users');
  }
});

// =====================
// REPORTS (stub)
// =====================
router.get('/reports', isAuthenticated, isAdmin, (req, res) => {
  res.render('admin/reports', {
    user: req.session.user,
    title: 'Reports',
    hideSidebar: false,
    layout: 'layouts/main'
  });
});

// =====================
// QUEUE MONITOR (stub)
// =====================
router.get('/queue-monitor', isAuthenticated, isAdmin, (req, res) => {
  res.render('admin/admin-queue-monitor', {
    user: req.session.user,
    title: 'Queue Monitor',
    hideSidebar: false,
    layout: 'layouts/main'
  });
});

module.exports = router;
