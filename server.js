// server.js

// ─── Boot Marker ───────────────────────────────────────────────
const fs = require('fs');
fs.appendFileSync(__dirname + '/debug.log', `server.js loaded at ${new Date().toISOString()}\n`);

const express = require('express');
const path = require('path');
const engine = require('ejs-mate');
require('dotenv').config();

// ─── Logger Setup ───────────────────────────────────────────────
const logger = require('./utils/logger');
logger.debug('Starting QSys server...');

const receptionRoutes = require('./routes/reception');
const session = require('express-session');

const app = express();

// ─── Express session middleware ─────────────────────────────────
app.use(session({
  key: 'qsys_session',
  secret: process.env.SESSION_SECRET || 'f01a7775987fc5cc47...bf4ccf913cc14b19a7db759b72a75a85324780869648bcce7e994fbb6b9',
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
    if (req.session.user.role === 'admin') {
      return res.redirect('/admin');
    } else if (req.session.user.role === 'staff') {
      return res.redirect('/reception');
    }
  }
  res.redirect('/login');
});

// ─── Mount application routes ───────────────────────────────────
const generalRoutes = require('./routes/general');
app.use('/', generalRoutes);

const adminRoutes = require('./routes/admin');
app.use('/admin', adminRoutes);

const staffRoutes = require('./routes/reception');
app.use('/reception', staffRoutes);
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
