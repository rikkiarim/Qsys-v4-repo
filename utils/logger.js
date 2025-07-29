// utils/logger.js
const { createLogger, format, transports } = require('winston');
const path = require('path');

const logger = createLogger({
  level: 'debug',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(({ timestamp, level, message }) =>
      `${timestamp} [${level.toUpperCase()}] ${message}`
    )
  ),
  transports: [
    // write all logs (debug and up) to debug.log at project root
    new transports.File({ filename: path.join(__dirname, '../debug.log'), level: 'debug' }),
    // also show errors on console
    new transports.Console({ level: 'error', format: format.simple() })
  ],
});

// utils/logger.js

module.exports = {
  debug: (...args) => console.log('[DEBUG]', ...args),
  error: (...args) => console.error('[ERROR]', ...args),
};

