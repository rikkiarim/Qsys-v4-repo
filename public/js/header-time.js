// public/js/header-time.js
const liveTimeEl = document.getElementById('live-time');
const countdownEl = document.getElementById('refresh-countdown');
let count = 60;

setInterval(() => {
  const now = new Date();
  liveTimeEl.textContent = now.toLocaleTimeString('en-PH', {
    timeZone: 'Asia/Manila',
    hour12: false
  });
  count = count === 0 ? 60 : count - 1;
  countdownEl.textContent = count;
  if (count === 0) window.dispatchEvent(new Event('firestore-refresh'));
}, 1000);
