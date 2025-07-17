const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');

const generalRoutes = require('./routes/general');

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));

// --- SESSION CONFIGURATION ---
app.use(session({
  secret: process.env.SESSION_SECRET || 'super-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI || 'mongodb://localhost:27017/qsys_sessions',
    ttl: 7 * 24 * 60 * 60 // 7 days
  }),
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    httpOnly: true,
    secure: false, // set to true if using HTTPS
    sameSite: true
  }
}));
app.use((req, res, next) => {
  res.locals.user = req.session ? req.session.user : null;
  next();
});

app.use('/', generalRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`QSys server running at http://localhost:${PORT}`);
});
