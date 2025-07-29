const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const admin = require('../config/firebase'); // Adjust path as needed

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

// List all branches
router.get('/branches', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const branchesSnap = await admin.firestore().collection('branches').get();
    const branches = branchesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.render('admin/branches', {
      user: req.session.user,
      title: 'Branch Management',
      branches,
      hideSidebar: false,
      layout: 'layouts/main'
    });
  } catch (err) {
    res.render('error', { title: 'Error', message: 'Failed to load branches.' });
  }
});

// Add branch
router.post('/branches/add', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { name, code } = req.body;
    await admin.firestore().collection('branches').add({ name, code });
    res.redirect('/admin/branches');
  } catch (err) {
    res.render('error', { title: 'Error', message: 'Failed to add branch.' });
  }
});

// Edit branch
router.post('/branches/edit/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { name, code } = req.body;
    const { id } = req.params;
    await admin.firestore().collection('branches').doc(id).update({ name, code });
    res.redirect('/admin/branches');
  } catch (err) {
    res.render('error', { title: 'Error', message: 'Failed to edit branch.' });
  }
});

// Delete branch
router.post('/branches/delete/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await admin.firestore().collection('branches').doc(id).delete();
    res.redirect('/admin/branches');
  } catch (err) {
    res.render('error', { title: 'Error', message: 'Failed to delete branch.' });
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
