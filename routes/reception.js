const express = require('express');
const router = express.Router();
const { isAuthenticated, isStaff } = require('../middleware/auth');

router.get('/', isAuthenticated, isStaff, (req, res) => {
  res.render('reception/index', {
    user: req.session.user,
    title: 'Reception Dashboard'
  });
});

module.exports = router;
