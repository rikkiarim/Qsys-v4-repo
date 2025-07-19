const express = require('express');
const path = require('path');
const engine = require('ejs-mate');
require('dotenv').config();

const session = require('express-session');

const app = express();

// Express session middleware without MySQL session store
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
app.engine('ejs', engine);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

// Body parsing middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const generalRoutes = require('./routes/general');
app.use('/', generalRoutes);

const adminRoutes = require('./routes/admin');
const staffRoutes = require('./routes/reception');
app.use('/admin', adminRoutes);
app.use('/reception', staffRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`QSys running at http://localhost:${PORT}`));
