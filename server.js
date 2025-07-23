const express = require('express');
const path = require('path');
const engine = require('ejs-mate');
require('dotenv').config();
const receptionRoutes = require('./routes/reception');
const session = require('express-session');

const app = express();

// Express session middleware
app.use(session({
  key: 'qsys_session',
  secret: process.env.SESSION_SECRET || 'f01a7775987fc5cc479b5fdb93862682ed65bf4ccf913cc14b19a7db759b72a75a85324780869648bcce7e994fbb6b9',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    sameSite: true,
    secure: false, // Set to true only if using HTTPS
  }
}));

// Setup EJS with ejs-mate
app.engine('ejs', engine);                // CRITICAL: Register ejs-mate as engine!
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

// Body parsing middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- Root route with redirect logic ---
app.get('/', (req, res) => {
  if (req.session && req.session.user) {
    if (req.session.user.role === 'admin') {
      return res.redirect('/admin');
    } else if (req.session.user.role === 'staff') {
      return res.redirect('/reception');
    }
    // Add more roles as needed
  }
  res.redirect('/login');
});

// Mount general routes (should include /login)
const generalRoutes = require('./routes/general');
app.use('/', generalRoutes);

const adminRoutes = require('./routes/admin');
app.use('/admin', adminRoutes);

const staffRoutes = require('./routes/reception');
app.use('/reception', staffRoutes);
app.use('/reception', receptionRoutes);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`QSys running at http://localhost:${PORT}`));
