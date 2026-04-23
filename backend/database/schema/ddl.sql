-- ============================================================
--  NewRoommie – DDL  (Data Definition Language)
--  Run this once to create the database and all tables.
--  MySQL 5.7+ / MariaDB 10.3+
-- ============================================================

CREATE DATABASE IF NOT EXISTS roommie
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE roommie;

-- ── users ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id         INT          AUTO_INCREMENT PRIMARY KEY,
  email      VARCHAR(255) NOT NULL,
  password   VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL DEFAULT '',
  last_name  VARCHAR(100) NOT NULL DEFAULT '',
  gender     VARCHAR(10)  NOT NULL DEFAULT '',
  bio        TEXT,

  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cities (
  id         INT          AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  slug       VARCHAR(120) NOT NULL,
  plate_code CHAR(2)      NOT NULL DEFAULT '',

  UNIQUE KEY uq_cities_name (name),
  UNIQUE KEY uq_cities_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS districts (
  id         INT          AUTO_INCREMENT PRIMARY KEY,
  city_id    INT          NOT NULL,
  name       VARCHAR(100) NOT NULL,
  slug       VARCHAR(120) NOT NULL,

  CONSTRAINT fk_districts_city
    FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE CASCADE,

  UNIQUE KEY uq_district_city_name (city_id, name),
  UNIQUE KEY uq_district_city_slug (city_id, slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS amenities (
  id         INT          AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  slug       VARCHAR(120) NOT NULL,

  UNIQUE KEY uq_amenities_name (name),
  UNIQUE KEY uq_amenities_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── listings ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS listings (
  id               INT           AUTO_INCREMENT PRIMARY KEY,
  user_id          INT           NOT NULL,
  city_id          INT           NULL,
  district_id      INT           NULL,

  title            VARCHAR(255)  NOT NULL,
  type             VARCHAR(50)   NOT NULL DEFAULT 'Private',
  description      TEXT,
  price            DECIMAL(10,2) NOT NULL DEFAULT 0.00,

  phone            VARCHAR(50)   NOT NULL DEFAULT '',
  whatsapp         VARCHAR(500)  NOT NULL DEFAULT '',
  map_location     VARCHAR(1000) NOT NULL DEFAULT '',
  prefs_roommates  INT           NOT NULL DEFAULT 0,
  prefs_gender     VARCHAR(50)   NOT NULL DEFAULT 'Any',
  prefs_smoking    VARCHAR(50)   NOT NULL DEFAULT 'Non-smoker only',
  prefs_env        VARCHAR(50)   NOT NULL DEFAULT 'Quiet environment',
  prefs_pets       VARCHAR(50)   NOT NULL DEFAULT 'No pets',
  created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_listings_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_listings_city
    FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE SET NULL,
  CONSTRAINT fk_listings_district
    FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE SET NULL,

  INDEX idx_listings_user_id    (user_id),
  INDEX idx_listings_city_id    (city_id),
  INDEX idx_listings_district_id (district_id),
  INDEX idx_listings_created_at (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS listing_images (
  id         INT          AUTO_INCREMENT PRIMARY KEY,
  listing_id INT          NOT NULL,
  url        VARCHAR(500) NOT NULL,
  position   TINYINT      NOT NULL DEFAULT 0,

  CONSTRAINT fk_listing_images_listing
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,

  INDEX idx_listing_images_listing (listing_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS listing_amenities (
  listing_id INT NOT NULL,
  amenity_id INT NOT NULL,

  PRIMARY KEY (listing_id, amenity_id),

  CONSTRAINT fk_listing_amenities_listing
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
  CONSTRAINT fk_listing_amenities_amenity
    FOREIGN KEY (amenity_id) REFERENCES amenities(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── saved_rooms ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS saved_rooms (
  id         INT      AUTO_INCREMENT PRIMARY KEY,
  user_id    INT      NOT NULL,
  listing_id INT      NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uq_saved_user_listing (user_id, listing_id),

  CONSTRAINT fk_saved_user
    FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  CONSTRAINT fk_saved_listing
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,

  INDEX idx_saved_user_id    (user_id),
  INDEX idx_saved_listing_id (listing_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── otp_requests ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS otp_requests (
  id           INT          AUTO_INCREMENT PRIMARY KEY,
  email        VARCHAR(255) NOT NULL,
  purpose      VARCHAR(50)  NOT NULL,
  otp_code     VARCHAR(6)   NOT NULL,
  payload_json TEXT,
  expires_at   DATETIME     NOT NULL,
  used_at      DATETIME     NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_otp_lookup (email, purpose, used_at, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
