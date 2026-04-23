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

/** Partial update — only the fields passed will be changed */
async function updateUser(id, { firstName, lastName, gender, bio }) {
  const db       = getDb();
  const existing = await findById(id);
  if (!existing) return null;

  await db.query(
    'UPDATE users SET first_name = ?, last_name = ?, gender = ?, bio = ? WHERE id = ?',
    [
      firstName !== undefined ? firstName : existing.first_name,
      lastName  !== undefined ? lastName  : existing.last_name,
      gender    !== undefined ? gender    : existing.gender,
      bio       !== undefined ? bio       : existing.bio,
      id,
    ]
  );
  return findById(id);
}

async function updateEmail(id, email) {
  const db = getDb();
  await db.query('UPDATE users SET email = ? WHERE id = ?', [email, id]);
  return findById(id);
}

/** Update only the hashed password */
async function updatePassword(id, hashedPassword) {
  const db = getDb();
  await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);
}

/** Hard-delete a user (cascades to listings + saved_rooms) */
async function deleteUser(id) {
  const db = getDb();
  await db.query('DELETE FROM users WHERE id = ?', [id]);
}

/** Return a user's listings (lightweight – used in public profile) */
async function findUserListings(userId) {
  const db     = getDb();
  const [rows] = await db.query(
    `SELECT
       l.id,
       l.title,
       l.type,
       ${LISTING_LOCATION_SQL} AS location,
       l.price,
       ${LISTING_IMAGES_SQL} AS image_urls,
       l.created_at
     FROM listings l
     LEFT JOIN cities c ON l.city_id = c.id
     LEFT JOIN districts d ON l.district_id = d.id
     ${LISTING_IMAGES_JOIN}
     WHERE l.user_id = ?
     ORDER BY l.created_at DESC`,
    [userId]
  );
  return rows;
}

module.exports = {
  findById,
  findByIdWithPassword,
  findByEmail,
  createUser,
  updateUser,
  updateEmail,
  updatePassword,
  deleteUser,
  findUserListings,
};