// /utils/getManilaDateKey.js
module.exports = function getManilaDateKey() {
  const now = new Date();
  const manila = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
  if (manila.getHours() < 9) {
    manila.setDate(manila.getDate() - 1);
  }
  return manila.toISOString().slice(0, 10);
};
