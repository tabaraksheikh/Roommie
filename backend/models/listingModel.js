/**
 * listingModel
 * ──────────────────────────────────────────────────────────────
 * Data-Access Layer for the `listings` table.
 * Raw SQL only — no HTTP, no business rules, no formatting.
 */
const { getDb } = require('../config/db');
const { parseLocationValue } = require('../database/reference-data/locationCatalog');
const { parseStoredAmenities, slugifyAmenity } = require('../domains/listing/listingStorage');
const { LISTING_AMENITIES_JOIN, LISTING_AMENITIES_SQL } = require('../domains/listing/listingAmenities');
const { LISTING_IMAGES_JOIN, LISTING_IMAGES_SQL, syncListingImages } = require('../domains/listing/listingImages');
const { LISTING_LOCATION_SQL } = require('../domains/listing/listingLocation');
const { parseDecimalPrice } = require('../utils/price');

function normalizePrice(price) {
  const parsed = parseDecimalPrice(price);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Number(parsed.toFixed(2)));
}

/**
 * Reusable SELECT + JOIN fragment that pulls the poster's public
 * profile columns alongside every listing row.
 */
const LISTING_SELECT = `
  l.*,
  ${LISTING_AMENITIES_SQL} AS amenities,
  ${LISTING_IMAGES_SQL} AS image_urls,
  ${LISTING_LOCATION_SQL} AS location,
  c.name       AS city_name,
  d.name       AS district_name,
  u.id         AS poster_id,
  u.email      AS poster_email,
  u.first_name AS poster_first,
  u.last_name  AS poster_last,
  u.gender     AS poster_gender,
  u.bio        AS poster_bio
`;

const LISTING_FROM = `
  FROM listings l
  LEFT JOIN users u ON l.user_id = u.id
  LEFT JOIN cities c ON l.city_id = c.id
  LEFT JOIN districts d ON l.district_id = d.id
  ${LISTING_IMAGES_JOIN}
  ${LISTING_AMENITIES_JOIN}
`;

/** Return a single listing row (with poster) by id */
async function findById(id) {
  const db     = getDb();
  const [rows] = await db.query(
    `SELECT ${LISTING_SELECT} ${LISTING_FROM} WHERE l.id = ?`,
    [id]
  );
  return rows[0] || null;
}

/** Return a single listing row WITHOUT the JOIN (for ownership checks) */
async function findRawById(id) {
  const db     = getDb();
  const [rows] = await db.query(
    `SELECT
       l.*,
       ${LISTING_AMENITIES_SQL} AS amenities,
       ${LISTING_IMAGES_SQL} AS image_urls,
       ${LISTING_LOCATION_SQL} AS location,
       c.name AS city_name,
       d.name AS district_name
     FROM listings l
     LEFT JOIN cities c ON l.city_id = c.id
     LEFT JOIN districts d ON l.district_id = d.id
     ${LISTING_IMAGES_JOIN}
     ${LISTING_AMENITIES_JOIN}
     WHERE l.id = ?`,
    [id]
  );
  return rows[0] || null;
}

/**
 * Filtered listing search.
 * @param {object} filters  - All optional WHERE criteria
 * @param {number} limit
 * @param {number} offset
 * @returns {{ rows: Array, total: number }}
 */
async function findAll(filters, limit, offset) {
  const db         = getDb();
  const conditions = [];
  const params     = [];

  const {
    userId, type, location, maxPrice, minPrice,
    roommates, prefGender, smoking, env, pets, search, city, district, amenities,
  } = filters;

  if (userId) {
    conditions.push('l.user_id = ?');
    params.push(parseInt(userId));
  }
  if (type && type !== 'All') {
    conditions.push('l.type = ?');
    params.push(type);
  }
  if (location && location !== 'All Locations') {
    conditions.push(`(${LISTING_LOCATION_SQL}) = ?`);
    params.push(location);
  }
  if (city && city !== 'All Cities') {
    conditions.push('c.name = ?');
    params.push(city);
  }
  if (district && district !== 'All Districts') {
    conditions.push('d.name = ?');
    params.push(district);
  }
  if (maxPrice) {
    conditions.push('l.price <= ?');
    params.push(parseDecimalPrice(maxPrice));
  }
  if (minPrice) {
    conditions.push('l.price >= ?');
    params.push(parseDecimalPrice(minPrice));
  }
  if (roommates !== undefined && roommates !== '') {
    conditions.push('l.prefs_roommates <= ?');
    params.push(parseInt(roommates));
  }
  if (prefGender) {
    conditions.push("(l.prefs_gender = ? OR l.prefs_gender = 'Any')");
    params.push(prefGender);
  }
  if (smoking) {
    conditions.push('l.prefs_smoking = ?');
    params.push(smoking);
  }
  if (env) {
    conditions.push('l.prefs_env = ?');
    params.push(env);
  }
  if (pets) {
    conditions.push('l.prefs_pets = ?');
    params.push(pets);
  }
  if (search) {
    conditions.push(`(l.title LIKE ? OR (${LISTING_LOCATION_SQL}) LIKE ? OR l.description LIKE ?)`);
    const q = `%${search}%`;
    params.push(q, q, q);
  }
  if (amenities) {
    const amenityList = String(amenities)
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);

    amenityList.forEach((amenityName, index) => {
      conditions.push(`EXISTS (
        SELECT 1
          FROM listing_amenities la${index}
          JOIN amenities a${index} ON a${index}.id = la${index}.amenity_id
         WHERE la${index}.listing_id = l.id
           AND a${index}.name = ?
      )`);
      params.push(amenityName);
    });
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [rows] = await db.query(
    `SELECT ${LISTING_SELECT} ${LISTING_FROM} ${where} ORDER BY l.created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  const [countRows] = await db.query(
    `SELECT COUNT(DISTINCT l.id) AS cnt ${LISTING_FROM} ${where}`,
    params
  );

  return { rows, total: countRows[0].cnt };
}

/** Return the 6 most recent listings (featured section) */
async function findFeatured() {
  const db     = getDb();
  const [rows] = await db.query(
    `SELECT ${LISTING_SELECT} ${LISTING_FROM} ORDER BY l.created_at DESC LIMIT 6`
  );
  return rows;
}

async function resolveLocationRefs(locationValue) {
  const parsed = parseLocationValue(locationValue);
  const db = getDb();

  if (!parsed.city) {
    return { cityId: null, districtId: null };
  }

  const [cityRows] = await db.query('SELECT id FROM cities WHERE name = ? LIMIT 1', [parsed.city]);
  const cityId = cityRows[0]?.id || null;

  if (!cityId || !parsed.district) {
    return { cityId, districtId: null };
  }

  const [districtRows] = await db.query(
    'SELECT id FROM districts WHERE city_id = ? AND name = ? LIMIT 1',
    [cityId, parsed.district]
  );

  return {
    cityId,
    districtId: districtRows[0]?.id || null,
  };
}

async function syncListingAmenities(db, listingId, amenitiesValue) {
  const amenityNames = parseStoredAmenities(amenitiesValue);

  await db.query('DELETE FROM listing_amenities WHERE listing_id = ?', [listingId]);
  if (!amenityNames.length) return;

  for (const amenityName of amenityNames) {
    await db.query(
      `INSERT INTO amenities (name, slug)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE
         slug = VALUES(slug)`,
      [amenityName, slugifyAmenity(amenityName)]
    );
  }

  const placeholders = amenityNames.map(() => '?').join(', ');
  const [allAmenities] = await db.query(
    `SELECT id, name FROM amenities WHERE name IN (${placeholders})`,
    amenityNames
  );

  const amenityIdByName = new Map(allAmenities.map((row) => [row.name, row.id]));

  for (const amenityName of amenityNames) {
    const amenityId = amenityIdByName.get(amenityName);
    if (!amenityId) continue;
    await db.query(
      'INSERT IGNORE INTO listing_amenities (listing_id, amenity_id) VALUES (?, ?)',
      [listingId, amenityId]
    );
  }
}

/** Insert a new listing row; returns the full row with poster join */
async function createListing(data) {
  const db = getDb();
  const connection = await db.getConnection();
  const locationRefs = await resolveLocationRefs(data.location);

  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      `INSERT INTO listings
        (user_id, city_id, district_id, title, type, description, price,
         phone, whatsapp, map_location, prefs_roommates, prefs_gender,
         prefs_smoking, prefs_env, prefs_pets)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.userId,
        data.cityId ?? locationRefs.cityId,
        data.districtId ?? locationRefs.districtId,
        data.title,
        data.type,
        data.description,
        normalizePrice(data.price),
        data.phone,
        data.whatsapp,
        data.mapLocation,
        data.prefsRoommates,
        data.prefsGender,
        data.prefsSmoking,
        data.prefsEnv,
        data.prefsPets,
      ]
    );

    await syncListingAmenities(connection, result.insertId, data.amenities);
    await syncListingImages(connection, result.insertId, data.imageUrls);
    await connection.commit();

    return findById(result.insertId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/** Full update of a listing row; returns the updated row with poster join */
async function updateListing(id, data) {
  const db = getDb();
  const connection = await db.getConnection();
  const locationRefs = await resolveLocationRefs(data.location);

  try {
    await connection.beginTransaction();

    await connection.query(
      `UPDATE listings SET
        city_id = ?, district_id = ?, title = ?, type = ?, description = ?,
        price = ?, phone = ?, whatsapp = ?, map_location = ?,
        prefs_roommates = ?, prefs_gender = ?,
        prefs_smoking = ?, prefs_env = ?, prefs_pets = ?
       WHERE id = ?`,
      [
        data.cityId ?? locationRefs.cityId,
        data.districtId ?? locationRefs.districtId,
        data.title,
        data.type,
        data.description,
        normalizePrice(data.price),
        data.phone,
        data.whatsapp,
        data.mapLocation,
        data.prefsRoommates,
        data.prefsGender,
        data.prefsSmoking,
        data.prefsEnv,
        data.prefsPets,
        id,
      ]
    );

    await syncListingAmenities(connection, id, data.amenities);
    await syncListingImages(connection, id, data.imageUrls);
    await connection.commit();

    return findById(id);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/** Hard-delete a listing row */
async function deleteListing(id) {
  const db = getDb();
  await db.query('DELETE FROM listings WHERE id = ?', [id]);
}

module.exports = {
  findById,
  findRawById,
  findAll,
  findFeatured,
  createListing,
  updateListing,
  deleteListing,
  resolveLocationRefs,
};
