const bcrypt = require('bcrypt');

async function hashPasswords() {
  const adminPass = await bcrypt.hash('admin1234', 10);
  const staffPass = await bcrypt.hash('moa1234', 10);
  console.log('Admin hash:', adminPass);
  console.log('Staff hash:', staffPass);
}

hashPasswords();