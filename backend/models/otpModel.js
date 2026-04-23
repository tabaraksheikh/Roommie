const { getDb } = require('../config/db');

async function replacePendingOtp({ email, purpose, otp, payload, expiresAt }) {
  const db = getDb();
  await db.query(
    'DELETE FROM otp_requests WHERE email = ? AND purpose = ? AND used_at IS NULL',
    [email, purpose]
  );
  await db.query(
    `INSERT INTO otp_requests (email, purpose, otp_code, payload_json, expires_at)
     VALUES (?, ?, ?, ?, ?)`,
    [email, purpose, otp, JSON.stringify(payload || {}), expiresAt]
  );
}

async function findLatestPendingOtp(email, purpose) {
  const db = getDb();
  const [rows] = await db.query(
    `SELECT *
       FROM otp_requests
      WHERE email = ? AND purpose = ? AND used_at IS NULL
      ORDER BY created_at DESC, id DESC
      LIMIT 1`,
    [email, purpose]
  );
  return rows[0] || null;
}

async function markOtpUsed(id) {
  const db = getDb();
  await db.query('UPDATE otp_requests SET used_at = NOW() WHERE id = ?', [id]);
}

module.exports = {
  replacePendingOtp,
  findLatestPendingOtp,
  markOtpUsed,
};
