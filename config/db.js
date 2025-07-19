const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'onegourmetph.com',
  user: process.env.DB_USER || 'onegourmet_qsys_admin',
  password: process.env.DB_PASS || 'xVrT209X!',
  database: process.env.DB_NAME || 'onegourmet_qsysv4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
