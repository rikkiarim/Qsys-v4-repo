function isAuthenticated(req, res, next) {
  if (req.session.user) return next();
  res.redirect('/login');
}

function isAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === 'admin') return next();
  res.redirect('/login');
}

function isStaff(req, res, next) {
  if (req.session.user && req.session.user.role === 'staff') return next();
  res.redirect('/login');
}

module.exports = { isAuthenticated, isAdmin, isStaff };
