const admin = require('./config/firebase'); // your Firebase Admin SDK

// Usage: node setRole.js user-email role
const [,, userEmail, role] = process.argv;

if (!userEmail || !role) {
  console.error('Usage: node setRole.js <user-email> <role>');
  process.exit(1);
}

async function setUserRole(email, role) {
  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, { role });
    console.log(`Set role "${role}" for user ${email}`);
  } catch (err) {
    console.error('Error setting user role:', err);
  }
}

setUserRole(userEmail, role);
