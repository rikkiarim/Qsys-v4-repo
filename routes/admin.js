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

// List all branches with pagination & case-insensitive substring search
router.get('/branches', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const pageSize = parseInt(req.query.pageSize) || 10;
    let search = (req.query.search || '').trim().toLowerCase();
    const cursor = req.query.cursor || null;
    const direction = req.query.direction || 'next';

    // Fetch all branches ordered by name
    let query = admin.firestore().collection('branches').orderBy('name');
    let snap = await query.get();
    let allBranches = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Case-insensitive substring filter
    let filteredBranches = search
      ? allBranches.filter(branch =>
          branch.name && branch.name.toLowerCase().includes(search)
        )
      : allBranches;

    // In-memory pagination
    let startIndex = 0;
    let hasPrev = false;
    let hasNext = false;

    // If paginating, find index for cursor
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

    // AJAX (partial table render)
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

    // Full page render
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
