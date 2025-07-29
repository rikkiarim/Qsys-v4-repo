const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const admin = require('../config/firebase');

// ADMIN DASHBOARD
router.get('/', isAuthenticated, isAdmin, (req, res) => {
  res.render('admin/index', {
    user: req.session.user,
    title: 'Admin Dashboard',
    hideSidebar: false,
    layout: 'layouts/main'
  });
});

// BRANCH MANAGEMENT

// List all branches with pagination & search
router.get('/branches', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const pageSize = parseInt(req.query.pageSize) || 10;
    const search = (req.query.search || '').trim();
    const cursor = req.query.cursor || null; // Last visible doc's ID
    const direction = req.query.direction || 'next';

    let query = admin.firestore().collection('branches');
    if (search) {
      // Prefix search (case sensitive; for more robust, use lower-cased field)
      query = query
        .orderBy('name')
        .where('name', '>=', search)
        .where('name', '<=', search + '\uf8ff');
    } else {
      query = query.orderBy('name');
    }

    // Handle pagination cursor
    if (cursor) {
      const snapshot = await admin.firestore().collection('branches').doc(cursor).get();
      if (snapshot.exists) {
        query = direction === 'next'
          ? query.startAfter(snapshot)
          : query.endBefore(snapshot);
      }
    }

    // Get docs (fetch pageSize+1 to check for next page)
    const snap = await query.limit(pageSize + 1).get();
    let branches = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    let hasNext = branches.length > pageSize;
    if (hasNext) branches = branches.slice(0, pageSize);

    const firstDoc = branches[0] || null;
    const lastDoc = branches[branches.length - 1] || null;

    // AJAX request? Render partial.
    if (req.xhr) {
      return res.render('admin/branches-table.ejs', { branches }, (err, html) => {
        if (err) return res.status(500).send('Render error');
        res.send({ html, hasNext, firstId: firstDoc ? firstDoc.id : '', lastId: lastDoc ? lastDoc.id : '' });
      });
    }

    // Normal page load: render full page
    res.render('admin/branches', {
      user: req.session.user,
      title: 'Branch Management',
      branches,
      pageSize,
      search,
      hasNext,
      hasPrev: !!cursor,
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

// USER MANAGEMENT (stub)
router.get('/users', isAuthenticated, isAdmin, (req, res) => {
  res.render('admin/users', {
    user: req.session.user,
    title: 'User Management',
    hideSidebar: false,
    layout: 'layouts/main'
  });
});

// REPORTS (stub)
router.get('/reports', isAuthenticated, isAdmin, (req, res) => {
  res.render('admin/reports', {
    user: req.session.user,
    title: 'Reports',
    hideSidebar: false,
    layout: 'layouts/main'
  });
});

// QUEUE MONITOR (stub)
router.get('/queue-monitor', isAuthenticated, isAdmin, (req, res) => {
  res.render('admin/admin-queue-monitor', {
    user: req.session.user,
    title: 'Queue Monitor',
    hideSidebar: false,
    layout: 'layouts/main'
  });
});

module.exports = router;
