// server.js

const fs = require('fs');
const path = require('path');
const express = require('express');
const engine = require('ejs-mate');
require('dotenv').config();
const session = require('express-session');
const FileStore = require('session-file-store')(session);  // <-- Add this line
const logger = require('./utils/logger');

const app = express();


logger.debug('Starting QSys server...');

// ─── Trust Proxy (REQUIRED for cPanel/Render/hosted envs) ───────
app.set('trust proxy', 1);

// Time sync check endpoint
app.get('/_time', (req, res) => {
  res.json({ serverTime: new Date().toISOString() });
});

// ─── Express session middleware with FileStore ─────────────────
app.use(session({
  store: new FileStore({ path: './sessions', logFn: function(){} }), // <-- Persistent session storage
  key: 'qsys_session',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,                // Set to true ONLY for HTTPS production
    httpOnly: true,               // Helps mitigate XSS
    maxAge: 1000 * 60 * 60 * 2,   // 2 hours session expiry
    sameSite: 'lax'               // Good default
  }
}));

// Flash message middleware (for all views)
app.use((req, res, next) => {
  res.locals.success = req.session.success || null;
  res.locals.error = req.session.error || null;
  delete req.session.success;
  delete req.session.error;
  next();
});

// EJS with ejs-mate
app.engine('ejs', engine);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static assets
app.use(express.static(path.join(__dirname, 'public')));

// Body parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  logger.debug(`→ ${req.method} ${req.originalUrl}`);
  next();
});

// Root route: redirects by role
app.get('/', (req, res) => {
  if (req.session && req.session.user) {
    const role = req.session.user.role;
    return res.redirect(role === 'admin' ? '/admin' : '/reception');
  }
  res.redirect('/login');
});

// Application routes
const generalRoutes   = require('./routes/general');
const adminRoutes     = require('./routes/admin');
const receptionRoutes = require('./routes/reception');

app.use('/', generalRoutes);
app.use('/admin', adminRoutes);
app.use('/reception', receptionRoutes);

// Centralized error handler
app.use((err, req, res, next) => {
  logger.error(err.stack || err);
  res.status(500).render('error', {
    title: 'Server Error',
    message: 'Something went wrong—our team has been notified.'
  });
});

// Handle unhandled rejections & exceptions
process.on('unhandledRejection', reason => {
  logger.error(`Unhandled Rejection: ${reason}`);
});
process.on('uncaughtException', err => {
  logger.error(`Uncaught Exception: ${err.stack || err}`);
  process.exit(1);
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`QSys running at http://localhost:${PORT}`);
  logger.debug(`Listening on port ${PORT}`);
});
