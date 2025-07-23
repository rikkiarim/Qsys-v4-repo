// /utils/getNextQueueNumber.js

const admin = require('../config/firebase');
const db    = admin.firestore();

/**
 * Atomically get the next queue number for a branch, date, and category.
 * @param {string} branchCode
 * @param {string} dateKey      // Format: YYYY-MM-DD
 * @param {string} category     // 'A', 'B', 'C'
 * @returns {Promise<number>}   // The next queue number (e.g., 1, 2, 3...)
 */
async function getNextQueueNumber(branchCode, dateKey, category) {
  // Reference a single counters document for today's queues
  const countersRef = db
    .collection('queues')
    .doc(branchCode)
    .collection(dateKey)
    .doc('counters');

  // Use a transaction to safely increment and retrieve the next value
  const nextNumber = await db.runTransaction(async tx => {
    const snap = await tx.get(countersRef);
    let last = 0;

    if (snap.exists) {
      const data = snap.data();
      if (typeof data[category] === 'number') {
        last = data[category];
      }
    } else {
      // Initialize counters doc on first use
      tx.set(countersRef, { A: 0, B: 0, C: 0 });
    }

    const updated = last + 1;
    tx.update(countersRef, { [category]: updated });
    return updated;
  });

  return nextNumber;
}

module.exports = getNextQueueNumber;
