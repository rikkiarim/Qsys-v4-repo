const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin } = require('../middleware/auth');

router.get('/', isAuthenticated, isAdmin, (req, res) => {
  res.render('admin/index', {
    user: req.session.user,
    title: 'Admin Dashboard',
    hideSidebar: false,
    layout: 'layouts/main'
  });
});

router.get('/branches', isAuthenticated, isAdmin, (req, res) => {
  res.render('admin/branches', {
    user: req.session.user,
    title: 'Branch Management',
    hideSidebar: false,
    layout: 'layouts/main'
  });
});

router.get('/users', isAuthenticated, isAdmin, (req, res) => {
  res.render('admin/users', {
    user: req.session.user,
    title: 'User Management',
    hideSidebar: false,
    layout: 'layouts/main'
  });
});

router.get('/reports', isAuthenticated, isAdmin, (req, res) => {
  res.render('admin/reports', {
    user: req.session.user,
    title: 'Reports',
    hideSidebar: false,
    layout: 'layouts/main'
  });
});

router.get('/queue-monitor', isAuthenticated, isAdmin, (req, res) => {
  res.render('admin/admin-queue-monitor', {
    user: req.session.user,
    title: 'Queue Monitor',
    hideSidebar: false,
    layout: 'layouts/main'
  });
});

module.exports = router;
