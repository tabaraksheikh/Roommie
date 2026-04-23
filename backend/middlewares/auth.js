const jwt       = require('jsonwebtoken');
const { getDb } = require('../config/db');

/**
 * requireAuth
 * Blocks the request if no valid JWT is present.
 * Attaches the full user row to req.user on success.
 */
async function requireAuth(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required' });
  }

  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const db      = getDb();
    const [rows]  = await db.query(
      'SELECT id, email, first_name, last_name, gender, bio FROM users WHERE id = ?',
      [decoded.id]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }
    req.user = rows[0];
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * optionalAuth
 * Attaches req.user if a valid token is present; never blocks the request.
 */
async function optionalAuth(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const db      = getDb();
    const [rows]  = await db.query(
      'SELECT id, email, first_name, last_name, gender, bio FROM users WHERE id = ?',
      [decoded.id]
    );
    req.user = rows[0] || null;
  } catch {
    req.user = null;
  }
  next();
}

module.exports = { requireAuth, optionalAuth };
