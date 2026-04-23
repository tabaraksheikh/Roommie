const mysql = require('mysql2/promise');
const { ensureAppSchema } = require('../database/setup/ensureSchema');
const schemaHelpers = require('../database/setup/schemaHelpers');
const {
  seedAmenities,
  seedLocationReferences,
} = require('../database/setup/referenceSync');

let pool;
const REQUIRED_TABLES = ['users', 'listings', 'listing_images', 'saved_rooms', 'otp_requests', 'cities', 'districts', 'amenities', 'listing_amenities'];
const REQUIRED_COLUMNS = {
  users: ['id', 'email', 'password', 'first_name', 'last_name', 'gender', 'bio'],
  cities: ['id', 'name', 'slug', 'plate_code'],
  districts: ['id', 'city_id', 'name', 'slug'],
  amenities: ['id', 'name', 'slug'],
  listings: [
    'id', 'user_id', 'city_id', 'district_id', 'title', 'type', 'description', 'price',
    'phone', 'whatsapp', 'map_location', 'prefs_roommates', 'prefs_gender',
    'prefs_smoking', 'prefs_env', 'prefs_pets', 'created_at',
  ],
  listing_images: ['id', 'listing_id', 'url', 'position'],
  listing_amenities: ['listing_id', 'amenity_id'],
  saved_rooms: ['id', 'user_id', 'listing_id', 'created_at'],
  otp_requests: ['id', 'email', 'purpose', 'otp_code', 'payload_json', 'expires_at', 'used_at', 'created_at'],
};
const REQUIRED_INDEX_SPECS = [
  { table: 'users', unique: true, columns: ['email'] },
  { table: 'cities', unique: true, columns: ['name'] },
  { table: 'cities', unique: true, columns: ['slug'] },
  { table: 'districts', unique: true, columns: ['city_id', 'name'] },
  { table: 'districts', unique: true, columns: ['city_id', 'slug'] },
  { table: 'amenities', unique: true, columns: ['name'] },
  { table: 'amenities', unique: true, columns: ['slug'] },
  { table: 'listings', unique: false, columns: ['user_id'] },
  { table: 'listings', unique: false, columns: ['city_id'] },
  { table: 'listings', unique: false, columns: ['district_id'] },
  { table: 'listing_images', unique: false, columns: ['listing_id'] },
  { table: 'saved_rooms', unique: true, columns: ['user_id', 'listing_id'] },
  { table: 'otp_requests', unique: false, columns: ['email', 'purpose', 'used_at', 'created_at'] },
];

function getDb() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'roommie',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: 'utf8mb4',
    });
  }
  return pool;
}

async function closeDb() {
  if (!pool) return;
  const existingPool = pool;
  pool = null;
  await existingPool.end();
}

async function initDatabase() {
  const db = getDb();

  await ensureAppSchema(db, schemaHelpers);

  await seedLocationReferences(db);
  await seedAmenities(db);

  await schemaHelpers.ensureIndex(
    db,
    'cities',
    'uq_cities_slug',
    'ALTER TABLE cities ADD UNIQUE INDEX uq_cities_slug (slug)'
  );
  await schemaHelpers.ensureIndex(
    db,
    'districts',
    'uq_district_city_slug',
    'ALTER TABLE districts ADD UNIQUE INDEX uq_district_city_slug (city_id, slug)'
  );
  await schemaHelpers.ensureIndex(
    db,
    'amenities',
    'uq_amenities_slug',
    'ALTER TABLE amenities ADD UNIQUE INDEX uq_amenities_slug (slug)'
  );

  console.log('Database ready');
}

async function assertDatabaseReady() {
  const db = getDb();
  const databaseName = process.env.DB_NAME || 'roommie';
  const [rows] = await db.query(
    `SELECT TABLE_NAME
       FROM information_schema.tables
      WHERE table_schema = ?
        AND TABLE_NAME IN (${REQUIRED_TABLES.map(() => '?').join(', ')})`,
    [databaseName, ...REQUIRED_TABLES]
  );

  const existingTables = new Set(rows.map((row) => row.TABLE_NAME));
  const missingTables = REQUIRED_TABLES.filter((tableName) => !existingTables.has(tableName));

  if (missingTables.length) {
    throw new Error(
      `Database schema is not initialized. Missing tables: ${missingTables.join(', ')}. Run "npm run db:init" first.`
    );
  }

  const [columnRows] = await db.query(
    `SELECT TABLE_NAME, COLUMN_NAME
       FROM information_schema.columns
      WHERE table_schema = ?
        AND TABLE_NAME IN (${REQUIRED_TABLES.map(() => '?').join(', ')})`,
    [databaseName, ...REQUIRED_TABLES]
  );

  const columnsByTable = new Map();
  for (const row of columnRows) {
    if (!columnsByTable.has(row.TABLE_NAME)) columnsByTable.set(row.TABLE_NAME, new Set());
    columnsByTable.get(row.TABLE_NAME).add(row.COLUMN_NAME);
  }

  const missingColumns = [];
  for (const [tableName, requiredColumns] of Object.entries(REQUIRED_COLUMNS)) {
    const existingColumns = columnsByTable.get(tableName) || new Set();
    for (const columnName of requiredColumns) {
      if (!existingColumns.has(columnName)) {
        missingColumns.push(`${tableName}.${columnName}`);
      }
    }
  }

  if (missingColumns.length) {
    throw new Error(
      `Database schema is incomplete. Missing columns: ${missingColumns.join(', ')}. Run "npm run db:init" first.`
    );
  }

  const [indexRows] = await db.query(
    `SELECT TABLE_NAME, INDEX_NAME, NON_UNIQUE, COLUMN_NAME, SEQ_IN_INDEX
       FROM information_schema.statistics
      WHERE table_schema = ?
        AND TABLE_NAME IN (${[...new Set(REQUIRED_INDEX_SPECS.map((spec) => spec.table))].map(() => '?').join(', ')})`,
    [databaseName, ...new Set(REQUIRED_INDEX_SPECS.map((spec) => spec.table))]
  );

  const indexesByTable = new Map();
  for (const row of indexRows) {
    if (!indexesByTable.has(row.TABLE_NAME)) indexesByTable.set(row.TABLE_NAME, new Map());
    const tableIndexes = indexesByTable.get(row.TABLE_NAME);
    if (!tableIndexes.has(row.INDEX_NAME)) {
      tableIndexes.set(row.INDEX_NAME, { unique: row.NON_UNIQUE === 0, columns: [] });
    }
    tableIndexes.get(row.INDEX_NAME).columns[row.SEQ_IN_INDEX - 1] = row.COLUMN_NAME;
  }

  const missingIndexSpecs = [];
  for (const spec of REQUIRED_INDEX_SPECS) {
    const existingIndexes = [...(indexesByTable.get(spec.table)?.values() || [])];
    const match = existingIndexes.some((index) => {
      if (index.unique !== spec.unique) return false;
      if (index.columns.length !== spec.columns.length) return false;
      return spec.columns.every((columnName, indexPosition) => index.columns[indexPosition] === columnName);
    });
    if (!match) {
      missingIndexSpecs.push(`${spec.table}(${spec.columns.join(', ')})`);
    }
  }

  if (missingIndexSpecs.length) {
    throw new Error(
      `Database schema is incomplete. Missing indexes: ${missingIndexSpecs.join(', ')}. Run "npm run db:init" first.`
    );
  }
}

module.exports = { getDb, closeDb, initDatabase, assertDatabaseReady };
