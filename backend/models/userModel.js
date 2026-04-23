/**
 * userModel
 * ──────────────────────────────────────────────────────────────
 * Data-Access Layer for the `users` table.
 * Every function speaks directly to the database.
 * No business logic, no HTTP, no token handling here.
 */
const { getDb } = require('../config/db');
const { LISTING_IMAGES_SQL, LISTING_IMAGES_JOIN } = require('../domains/listing/listingImages');
const { LISTING_LOCATION_SQL } = require('../domains/listing/listingLocation');

const SAFE_FIELDS =
  'id, email, first_name, last_name, gender, bio';

/** Return one user by primary key (safe fields only) */
async function findById(id) {
  const db     = getDb();
  const [rows] = await db.query(
    `SELECT ${SAFE_FIELDS} FROM users WHERE id = ?`,
    [id]
  );
  return rows[0] || null;
}

/** Return one user including the hashed password (for auth checks) */
async function findByIdWithPassword(id) {
  const db     = getDb();
  const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
  return rows[0] || null;
}

/** Return one user by e-mail including hashed password */
async function findByEmail(email) {
  const db     = getDb();
  const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0] || null;
}

/** Insert a new user row; returns the newly created user */
async function createUser({ email, hashedPassword, firstName, lastName }) {
  const db       = getDb();
  const [result] = await db.query(
    'INSERT INTO users (email, password, first_name, last_name) VALUES (?, ?, ?, ?)',
    [email, hashedPassword, firstName, lastName]
  );
  return findById(result.insertId);
}
