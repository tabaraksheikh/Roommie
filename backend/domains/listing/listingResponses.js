const { parseStoredAmenities, parseStoredImageUrls } = require('./listingStorage');
const { buildListingLocation } = require('./listingLocation');

function buildPoster(row) {
  if (!row.poster_id) return undefined;

  return {
    id: row.poster_id,
    name: `${row.poster_first || ''} ${row.poster_last || ''}`.trim() || row.poster_email,
    email: row.poster_email,
    gender: row.poster_gender,
    bio: row.poster_bio,
  };
}

function buildListingPreferences(row) {
  return {
    roommates: row.prefs_roommates,
    gender: row.prefs_gender,
    smoking: row.prefs_smoking,
    env: row.prefs_env,
    pets: row.prefs_pets,
  };
}

function formatListingResponse(row, overrides = {}) {
  const imageUrls = parseStoredImageUrls(row.image_urls);
  const location = row.location || buildListingLocation(row.city_name, row.district_name);

  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    type: row.type,
    location,
    description: row.description,
    price: row.price,
    phone: row.phone,
    whatsapp: row.whatsapp,
    mapLocation: row.map_location,
    amenities: parseStoredAmenities(row.amenities),
    prefs: buildListingPreferences(row),
    imageUrl: imageUrls[0] || '',
    imageUrls,
    createdAt: row.created_at,
    poster: buildPoster(row),
    ...overrides,
  };
}

function formatSavedListingResponse(row) {
  return formatListingResponse(row, {
    savedAt: row.saved_at,
  });
}

module.exports = {
  formatListingResponse,
  formatSavedListingResponse,
};
