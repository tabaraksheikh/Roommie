/**
 * Global Express error handler.
 * Must be registered LAST in server.js (after all routes).
 *
 * Handles:
 *  - AppError instances  → send their statusCode + message
 *  - MySQL ER_DUP_ENTRY  → 409 Conflict
 *  - Everything else     → 500 Internal Server Error
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Each image must be under 5 MB' });
    }
    return res.status(400).json({ error: err.message || 'Upload failed' });
  }

  if (err.message && (
    err.message.includes('Only image files') ||
    err.message.includes('allowed')
  )) {
    return res.status(400).json({ error: err.message });
  }

  // Operational errors we threw on purpose
  if (err.isOperational) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // MySQL duplicate-entry constraint
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ error: 'Duplicate entry — resource already exists' });
  }

  // Unknown / programming errors — log full stack, hide details from client
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
}

module.exports = errorHandler;
