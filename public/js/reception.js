// public/js/reception.js
console.log('🛎️ reception.js loaded', {
  branchCode: window.RECEPTION_BRANCH,
  dateKey:    window.RECEPTION_DATE_KEY
});

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// Initialize Firebase & Firestore
const app = initializeApp(window.FIREBASE_CONFIG);
const db  = getFirestore(app);

// Runtime globals
const branchCode = window.RECEPTION_BRANCH;
const dateKey    = window.RECEPTION_DATE_KEY;

// Track open action panel & currently called key
let openItemKey      = null;
let currentCalledKey = null;

// Renders a <li> for a queue item
function renderItem(data) {
  const li = document.createElement('li');
  li.className = 'queue-item';
  li.dataset.id     = data.id;
  li.dataset.group  = data.group;
  li.dataset.status = data.status;

  let displayName = `${data.number} | ${data.name}`;
  if (data.status === 'called') displayName += ' (Called)';

  li.innerHTML = `<span class="queue-name">${displayName}</span>`;

  if (data.status === 'called') {
    li.classList.add('called');
    currentCalledKey = `${data.group}:${data.id}`;
  } else {
    li.classList.remove('called');
  }

  li.onclick = () => toggleActions(li);
  return li;
}

// Adds the action buttons if not present
function attachActionsPanel(li) {
  if (li.querySelector('.actions')) return;
  const actions = document.createElement('div');
  actions.className = 'actions';
  actions.innerHTML = `
    <button class="btn-call">
      ${li.dataset.status === 'called' ? 'Cancel Call' : 'Call'}
    </button>
    <button class="btn-seat">Seat</button>
    <button class="btn-skip">No Show</button>
  `;
  actions.querySelector('.btn-call').onclick = e => {
    e.stopPropagation();
    handleCall(li);
  };
  actions.querySelector('.btn-seat').onclick = e => {
    e.stopPropagation();
    handleSeat(li);
  };
  actions.querySelector('.btn-skip').onclick = e => {
    e.stopPropagation();
    handleNoShow(li);
  };
  li.appendChild(actions);
}

// Toggles the action panel open/closed
function toggleActions(li) {
  const key = `${li.dataset.group}:${li.dataset.id}`;
  const existing = li.querySelector('.actions');
  if (existing) {
    existing.remove();
    openItemKey = null;
    return;
  }
  if (openItemKey && openItemKey !== key) {
    const [pg, pi] = openItemKey.split(':');
    document
      .querySelector(`.queue-item[data-group="${pg}"][data-id="${pi}"] .actions`)
      ?.remove();
  }
  attachActionsPanel(li);
  openItemKey = key;
}

// Handle Call / Cancel Call
async function handleCall(li) {
  const key = `${li.dataset.group}:${li.dataset.id}`;

  // Cancel existing call
  if (currentCalledKey === key && li.dataset.status === 'called') {
    await updateStatus(li, 'queued');
    li.querySelector('.actions')?.remove();
    currentCalledKey = null;
    openItemKey     = null;
    return;
  }

  // Un-call previous
  if (currentCalledKey && currentCalledKey !== key) {
    const [pg, pi] = currentCalledKey.split(':');
    await updateDoc(
      doc(db, 'queues', branchCode, dateKey, pg, 'list', pi),
      { status: 'queued' }
    );
  }

  // Call this one
  await updateStatus(li, 'called');
  currentCalledKey = key;
  openItemKey      = key;
}

// Handle Seat
async function handleSeat(li) {
  const key = `${li.dataset.group}:${li.dataset.id}`;
  await updateStatus(li, 'seated');
  if (currentCalledKey === key) currentCalledKey = null;
  openItemKey = null;
}

// Handle No Show
async function handleNoShow(li) {
  await updateStatus(li, 'no-show');
  openItemKey = null;
}

// Helper: update Firestore status field
async function updateStatus(li, newStatus) {
  const ref = doc(
    db,
    'queues',
    branchCode,
    dateKey,
    li.dataset.group,
    'list',
    li.dataset.id
  );
  await updateDoc(ref, { status: newStatus });
}

// Real-time listeners for A/B/C groups
['A','B','C'].forEach(group => {
  const q = query(
    collection(db, 'queues', branchCode, dateKey, group, 'list'),
    orderBy('timestamp')
  );
  onSnapshot(q, snap => {
    const ul = document.getElementById(`group-${group}`);
    if (!ul) return;
    ul.innerHTML = '';
    snap.forEach(docSnap => {
      const data = {
        id:     docSnap.id,
        number: docSnap.id,
        name:   docSnap.data().name,
        status: docSnap.data().status || 'queued',
        group
      };
      if (['seated','no-show'].includes(data.status)) return;
      const li = renderItem(data);
      ul.append(li);
      if (openItemKey === `${group}:${data.id}`) {
        attachActionsPanel(li);
      }
    });
  });
});

// Daily 9 AM reload
const now = new Date();
const next9 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9,0,0);
if (now >= next9) next9.setDate(next9.getDate() + 1);
setTimeout(() => window.location.reload(), next9 - now);
