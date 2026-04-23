/**
 * savedModel
 * ──────────────────────────────────────────────────────────────
 * Data-Access Layer for the `saved_rooms` table.
 */
const { getDb } = require('../config/db');
const { LISTING_AMENITIES_JOIN, LISTING_AMENITIES_SQL } = require('../domains/listing/listingAmenities');
const { LISTING_IMAGES_JOIN, LISTING_IMAGES_SQL } = require('../domains/listing/listingImages');
const { LISTING_LOCATION_SQL } = require('../domains/listing/listingLocation');

/** Return all saved listings for a user (with listing + poster data) */
async function findAllByUser(userId) {
  const db     = getDb();
  const [rows] = await db.query(
    `SELECT
       l.id, l.title, l.type, ${LISTING_LOCATION_SQL} AS location, l.price,
       ${LISTING_IMAGES_SQL} AS image_urls, l.created_at, l.prefs_gender,
       l.prefs_smoking, l.prefs_env, l.prefs_pets, l.prefs_roommates,
       ${LISTING_AMENITIES_SQL} AS amenities, l.description, l.phone, l.whatsapp,
       u.id         AS poster_id,
       u.first_name AS poster_first,
       u.last_name  AS poster_last,
       u.email      AS poster_email,
       u.gender     AS poster_gender,
       u.bio        AS poster_bio,
       s.created_at AS saved_at
     FROM saved_rooms s
     JOIN listings l ON s.listing_id = l.id
     JOIN users    u ON l.user_id    = u.id
     LEFT JOIN cities c ON l.city_id = c.id
     LEFT JOIN districts d ON l.district_id = d.id
     ${LISTING_IMAGES_JOIN}
     ${LISTING_AMENITIES_JOIN}
     WHERE s.user_id = ?
     ORDER BY s.created_at DESC`,
    [userId]
  );
  return rows;
}

/** Check whether a (user, listing) pair exists */
async function isSaved(userId, listingId) {
  const db     = getDb();
  const [rows] = await db.query(
    'SELECT id FROM saved_rooms WHERE user_id = ? AND listing_id = ?',
    [userId, listingId]
  );
  return rows.length > 0;
}

/** Insert a saved-room record */
async function saveListing(userId, listingId) {
  const db = getDb();
  await db.query(
    'INSERT INTO saved_rooms (user_id, listing_id) VALUES (?, ?)',
    [userId, listingId]
  );
}

/** Remove a saved-room record; returns affectedRows */
async function unsaveListing(userId, listingId) {
  const db       = getDb();
  const [result] = await db.query(
    'DELETE FROM saved_rooms WHERE user_id = ? AND listing_id = ?',
    [userId, listingId]
  );
  return result.affectedRows;
}

module.exports = { findAllByUser, isSaved, saveListing, unsaveListing };
