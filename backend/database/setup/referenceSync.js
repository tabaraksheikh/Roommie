const amenityCatalog = require('../reference-data/aminityCatalog');
const { loadLocations } = require('../reference-data/locationCatalog');
const { slugifyAmenity } = require('../../domains/listing/listingStorage');

async function seedLocationReferences(db) {
  const locations = loadLocations();

  for (const city of locations) {
    await db.query(
      `INSERT INTO cities (name, slug, plate_code)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
         slug = VALUES(slug),
         plate_code = VALUES(plate_code)`,
      [city.name, city.slug, city.plateCode]
    );
  }

  const [cityRows] = await db.query('SELECT id, name FROM cities');
  const cityIds = new Map(cityRows.map((row) => [row.name, row.id]));

  for (const city of locations) {
    const cityId = cityIds.get(city.name);
    if (!cityId) continue;

    for (const district of city.districts) {
      await db.query(
        `INSERT INTO districts (city_id, name, slug)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE
           slug = VALUES(slug)`,
        [cityId, district.name, district.slug]
      );
    }
  }
}

async function seedAmenities(db) {
  for (const name of amenityCatalog) {
    await db.query(
      `INSERT INTO amenities (name, slug)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE
         slug = VALUES(slug)`,
      [name, slugifyAmenity(name)]
    );
  }
}

module.exports = {
  seedAmenities,
  seedLocationReferences,
};
