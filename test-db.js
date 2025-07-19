const mysql = require('mysql2/promise');
(async () => {
  try {
    const conn = await mysql.createConnection({
      host: 'onegourmetph.com', // try with your guess!
      user: 'onegourmet_qsys_admin',
      password: 'xVrT209X!',
      database: 'onegourmet_qsysv4'
    });
    console.log('Connected!');
    await conn.end();
  } catch (err) {
    console.error(err.message);
  }
})();