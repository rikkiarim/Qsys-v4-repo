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

module.exports = router;
