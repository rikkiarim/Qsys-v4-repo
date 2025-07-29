// server.js

// ─── Boot Marker (with safe fallback) ───────────────────────────
const fs = require('fs');
const path = require('path');
try {
  fs.appendFileSync(path.join(__dirname, 'debug.log'), `server.js loaded at ${new Date().toISOString()}\n`);
} catch (err) {
  console.error('DEBUG LOGGING FAILED:', err);
}

const express = require('express');
const engine = require('ejs-mate');
require('dotenv').config();

// ─── Logger Setup ───────────────────────────────────────────────
const logger = require('../utils/logger');
logger.debug('Starting QSys server...');

const app = express();

// ─── Time Sync Check Endpoint ──────────────────────────────────
app.get('/_time', (req, res) => {
  res.json({ serverTime: new Date().toISOString() });
});

// ─── Express session middleware ─────────────────────────────────
const session = require('express-session');
app.use(session({
  key: 'qsys_session',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    // your cookie settings
  }
}));

// ─── Setup EJS with ejs-mate ────────────────────────────────────
app.engine('ejs', engine);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ─── Static assets ──────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ─── Body parsing middleware ───────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ─── Request Logging ────────────────────────────────────────────
app.use((req, res, next) => {
  logger.debug(`→ ${req.method} ${req.originalUrl}`);
  next();
});

// ─── Root route with redirect logic ─────────────────────────────
app.get('/', (req, res) => {
  if (req.session && req.session.user) {
    const role = req.session.user.role;
    return res.redirect(role === 'admin' ? '/admin' : '/reception');
  }
  res.redirect('/login');
});

// ─── Mount application routes ───────────────────────────────────
const generalRoutes   = require('./routes/general');
const adminRoutes     = require('./routes/admin');
const receptionRoutes = require('./routes/reception');

app.use('/', generalRoutes);
app.use('/admin', adminRoutes);
app.use('/reception', receptionRoutes);

// ─── Centralized Error Handler ─────────────────────────────────
app.use((err, req, res, next) => {
  logger.error(err.stack || err);
  res.status(500).render('error', {
    title: 'Server Error',
    message: 'Something went wrong—our team has been notified.'
  });
});

// ─── Catch Unhandled Rejections & Exceptions ────────────────────
process.on('unhandledRejection', reason => {
  logger.error(`Unhandled Rejection: ${reason}`);
});
process.on('uncaughtException', err => {
  logger.error(`Uncaught Exception: ${err.stack || err}`);
  process.exit(1);
});

// ─── Start the server ───────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`QSys running at http://localhost:${PORT}`);
  logger.debug(`Listening on port ${PORT}`);
});
