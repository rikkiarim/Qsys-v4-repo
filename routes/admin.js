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

// USER MANAGEMENT WITH PAGINATION
router.get('/users', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const pageSize = 10;
    let usersQuery = admin.firestore().collection('users').orderBy('name');
    const { direction, cursor } = req.query;

    let usersSnap;
    if (cursor) {
      const cursorDoc = await admin.firestore().collection('users').doc(cursor).get();
      if (cursorDoc.exists) {
        if (direction === 'prev') {
          // For previous, reverse direction and limitToLast
          usersQuery = usersQuery.endBefore(cursorDoc).limitToLast(pageSize);
        } else {
          usersQuery = usersQuery.startAfter(cursorDoc).limit(pageSize);
        }
      }
      // else fallback to first page if bad cursor
      else usersQuery = usersQuery.limit(pageSize);
    } else {
      usersQuery = usersQuery.limit(pageSize);
    }

    usersSnap = await usersQuery.get();

    let users = usersSnap.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        branch: data.branch || data.assignedBranch || data.assignedbranch || data.branchCode || "",
        uid: data.uid || doc.id
      };
    });

    if (direction === 'prev') users = users.reverse();

    // For paging
    const firstUser = users[0];
    const lastUser = users[users.length - 1];

    // For Next: fetch one more user to check if there's more (for "hasNext")
    let hasNext = false;
    if (users.length === pageSize) {
      let nextQuery = admin.firestore().collection('users').orderBy('name').startAfter(usersSnap.docs[usersSnap.docs.length - 1]).limit(1);
      let nextSnap = await nextQuery.get();
      hasNext = !nextSnap.empty;
    }

    // For Previous: if cursor given, show prev button
    const hasPrev = !!cursor;

    // Get branches for dropdown
    const branchesSnap = await admin.firestore().collection('branches').get();
    const branches = branchesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.render('admin/users', {
      user: req.session.user,
      title: 'User Management',
      users,
      branches,
      hideSidebar: false,
      layout: 'layouts/main',
      pageSize,
      prevCursor: firstUser ? firstUser.uid : null,
      nextCursor: lastUser ? lastUser.uid : null,
      hasPrev,
      hasNext
    });
  } catch (err) {
    req.session.error = 'Failed to load users: ' + err.message;
    res.redirect('/admin');
  }
});

// Add user (to Auth and Firestore)
router.post('/users/add', isAuthenticated, isAdmin, async (req, res) => {
  const { name, email, password, role, branch } = req.body;
  let userRecord;
  try {
    userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
      disabled: false
    });

    // Write both fields for compatibility
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      name,
      email,
      role,
      branch: branch || "",
      assignedBranch: branch || "",
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    req.session.success = 'User added successfully!';
    res.redirect('/admin/users');
  } catch (error) {
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
    await admin.auth().deleteUser(uid);
    await admin.firestore().collection('users').doc(uid).delete();
    req.session.success = 'User deleted.';
    res.redirect('/admin/users');
  } catch (err) {
    req.session.error = `Failed to delete user: ${err.message}`;
    res.redirect('/admin/users');
  }
});

// Edit user (name, role, branch)
router.post('/users/edit/:uid', isAuthenticated, isAdmin, async (req, res) => {
  const { uid } = req.params;
  let { name, role, branch } = req.body;
  // Defensive: ensure branch is always string for Firestore!
  if (role === 'admin' || typeof branch === 'undefined' || branch === null) {
    branch = '';
  }
  try {
    await admin.firestore().collection('users').doc(uid).update({
      name,
      role,
      branch: branch,
      assignedBranch: branch,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    await admin.auth().updateUser(uid, { displayName: name });
    req.session.success = 'User updated successfully!';
    res.redirect('/admin/users');
  } catch (err) {
    req.session.error = 'Failed to update user: ' + err.message;
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
