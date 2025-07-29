// utils/logger.js

module.exports = {
  debug: (...args) => console.log('[DEBUG]', ...args),
  error: (...args) => console.error('[ERROR]', ...args),
};
