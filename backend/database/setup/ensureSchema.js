const { parseStoredImageUrls } = require('../../domains/listing/listingStorage');

async function ensureUsersSchema(db, helpers) {
  const { ensureColumn } = helpers;

  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      email      VARCHAR(255) UNIQUE NOT NULL,
      password   VARCHAR(255) NOT NULL,
      first_name VARCHAR(100) DEFAULT '',
      last_name  VARCHAR(100) DEFAULT '',
      gender     VARCHAR(10)  DEFAULT '',
      bio        TEXT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await ensureColumn(db, 'users', 'password', 'ALTER TABLE users ADD COLUMN password VARCHAR(255) NULL AFTER email');
  await ensureColumn(db, 'users', 'bio', 'ALTER TABLE users ADD COLUMN bio TEXT NULL AFTER gender');
}

async function ensureReferenceSchema(db, helpers) {
  const { ensureColumn } = helpers;

  await db.query(`
    CREATE TABLE IF NOT EXISTS cities (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      name       VARCHAR(100) NOT NULL,
      slug       VARCHAR(120) NOT NULL,
      plate_code CHAR(2)      DEFAULT '',
      UNIQUE KEY uq_cities_name (name),
      UNIQUE KEY uq_cities_slug (slug)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await ensureColumn(db, 'cities', 'slug', 'ALTER TABLE cities ADD COLUMN slug VARCHAR(120) NULL AFTER name');
  await ensureColumn(
    db,
    'cities',
    'plate_code',
    "ALTER TABLE cities ADD COLUMN plate_code CHAR(2) NOT NULL DEFAULT '' AFTER slug"
  );

  await db.query(`
    CREATE TABLE IF NOT EXISTS districts (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      city_id    INT          NOT NULL,
      name       VARCHAR(100) NOT NULL,
      slug       VARCHAR(120) NOT NULL,
      UNIQUE KEY uq_district_city_name (city_id, name),
      UNIQUE KEY uq_district_city_slug (city_id, slug),
      CONSTRAINT fk_districts_city
        FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await ensureColumn(db, 'districts', 'slug', 'ALTER TABLE districts ADD COLUMN slug VARCHAR(120) NULL AFTER name');

  await db.query(`
    CREATE TABLE IF NOT EXISTS amenities (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      name       VARCHAR(100) NOT NULL,
      slug       VARCHAR(120) NOT NULL,
      UNIQUE KEY uq_amenities_name (name),
      UNIQUE KEY uq_amenities_slug (slug)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await ensureColumn(db, 'amenities', 'slug', 'ALTER TABLE amenities ADD COLUMN slug VARCHAR(120) NULL AFTER name');
}

async function ensureListingsSchema(db, helpers) {
  const { ensureColumn, ensureForeignKey, ensureIndex, getTableColumns } = helpers;

  await db.query(`
    CREATE TABLE IF NOT EXISTS listings (
      id               INT           AUTO_INCREMENT PRIMARY KEY,
      user_id          INT           NOT NULL,
      city_id          INT           NULL,
      district_id      INT           NULL,
      title            VARCHAR(255)  NOT NULL,
      type             VARCHAR(50)   NOT NULL DEFAULT 'Private',
      description      TEXT,
      price            DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      phone            VARCHAR(50)   DEFAULT '',
      whatsapp         VARCHAR(500)  DEFAULT '',
      map_location     VARCHAR(1000) DEFAULT '',
      prefs_roommates  INT           DEFAULT 0,
      prefs_gender     VARCHAR(50)   DEFAULT 'Any',
      prefs_smoking    VARCHAR(50)   DEFAULT 'Non-smoker only',
      prefs_env        VARCHAR(50)   DEFAULT 'Quiet environment',
      prefs_pets       VARCHAR(50)   DEFAULT 'No pets',
      created_at       DATETIME      DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE SET NULL,
      FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE SET NULL,
      INDEX idx_listings_city_id (city_id),
      INDEX idx_listings_district_id (district_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await ensureColumn(db, 'listings', 'type', "ALTER TABLE listings ADD COLUMN type VARCHAR(50) NOT NULL DEFAULT 'Private' AFTER title");
  await db.query("ALTER TABLE listings MODIFY COLUMN price DECIMAL(10,2) NOT NULL DEFAULT 0.00");
  await ensureColumn(db, 'listings', 'whatsapp', "ALTER TABLE listings ADD COLUMN whatsapp VARCHAR(500) NOT NULL DEFAULT '' AFTER phone");
  await ensureColumn(db, 'listings', 'map_location', "ALTER TABLE listings ADD COLUMN map_location VARCHAR(1000) DEFAULT ''");
  await ensureColumn(
    db,
    'listings',
    'prefs_roommates',
    'ALTER TABLE listings ADD COLUMN prefs_roommates INT NOT NULL DEFAULT 0 AFTER map_location'
  );
  await ensureColumn(
    db,
    'listings',
    'prefs_gender',
    "ALTER TABLE listings ADD COLUMN prefs_gender VARCHAR(50) NOT NULL DEFAULT 'Any' AFTER prefs_roommates"
  );
  await ensureColumn(
    db,
    'listings',
    'prefs_smoking',
    "ALTER TABLE listings ADD COLUMN prefs_smoking VARCHAR(50) NOT NULL DEFAULT 'Non-smoker only' AFTER prefs_gender"
  );
  await ensureColumn(
    db,
    'listings',
    'prefs_env',
    "ALTER TABLE listings ADD COLUMN prefs_env VARCHAR(50) NOT NULL DEFAULT 'Quiet environment' AFTER prefs_smoking"
  );
  await ensureColumn(
    db,
    'listings',
    'prefs_pets',
    "ALTER TABLE listings ADD COLUMN prefs_pets VARCHAR(50) NOT NULL DEFAULT 'No pets' AFTER prefs_env"
  );
  await ensureColumn(
    db,
    'listings',
    'created_at',
    'ALTER TABLE listings ADD COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP'
  );
  await ensureColumn(db, 'listings', 'city_id', 'ALTER TABLE listings ADD COLUMN city_id INT NULL AFTER user_id');
  await ensureColumn(db, 'listings', 'district_id', 'ALTER TABLE listings ADD COLUMN district_id INT NULL AFTER city_id');
  await ensureIndex(db, 'listings', 'idx_listings_city_id', 'ALTER TABLE listings ADD INDEX idx_listings_city_id (city_id)');
  await ensureIndex(
    db,
    'listings',
    'idx_listings_district_id',
    'ALTER TABLE listings ADD INDEX idx_listings_district_id (district_id)'
  );
  await ensureForeignKey(
    db,
    'listings',
    'city_id',
    'ALTER TABLE listings ADD CONSTRAINT fk_listings_city_id FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE SET NULL'
  );
  await ensureForeignKey(
    db,
    'listings',
    'district_id',
    'ALTER TABLE listings ADD CONSTRAINT fk_listings_district_id FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE SET NULL'
  );

  await db.query(`
    CREATE TABLE IF NOT EXISTS listing_images (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      listing_id INT NOT NULL,
      url        VARCHAR(500) NOT NULL,
      position   TINYINT NOT NULL DEFAULT 0,
      CONSTRAINT fk_listing_images_listing
        FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
      INDEX idx_listing_images_listing (listing_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const listingColumns = await getTableColumns(db, 'listings');
  if (listingColumns.has('image_url')) {
    const [rows] = await db.query('SELECT id, image_url FROM listings WHERE TRIM(COALESCE(image_url, \'\')) <> \'\'');

    for (const row of rows) {
      const imageUrls = parseStoredImageUrls(row.image_url);
      if (!imageUrls.length) continue;

      await db.query('DELETE FROM listing_images WHERE listing_id = ?', [row.id]);
      for (let index = 0; index < imageUrls.length && index < 6; index += 1) {
        await db.query(
          'INSERT INTO listing_images (listing_id, url, position) VALUES (?, ?, ?)',
          [row.id, imageUrls[index], index]
        );
      }
    }

    await db.query('ALTER TABLE listings DROP COLUMN image_url');
  }

  await db.query(`
    CREATE TABLE IF NOT EXISTS listing_amenities (
      listing_id  INT NOT NULL,
      amenity_id  INT NOT NULL,
      PRIMARY KEY (listing_id, amenity_id),
      CONSTRAINT fk_listing_amenities_listing
        FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
      CONSTRAINT fk_listing_amenities_amenity
        FOREIGN KEY (amenity_id) REFERENCES amenities(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

async function ensureSavedAndOtpSchema(db) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS saved_rooms (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      user_id    INT NOT NULL,
      listing_id INT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_save (user_id, listing_id),
      FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
      FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS otp_requests (
      id           INT AUTO_INCREMENT PRIMARY KEY,
      email        VARCHAR(255) NOT NULL,
      purpose      VARCHAR(50)  NOT NULL,
      otp_code     VARCHAR(6)   NOT NULL,
      payload_json TEXT,
      expires_at   DATETIME     NOT NULL,
      used_at      DATETIME     NULL,
      created_at   DATETIME     DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_otp_lookup (email, purpose, used_at, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

async function ensureAppSchema(db, helpers) {
  await ensureUsersSchema(db, helpers);
  await ensureReferenceSchema(db, helpers);
  await ensureListingsSchema(db, helpers);
  await ensureSavedAndOtpSchema(db);
}

module.exports = { ensureAppSchema };
