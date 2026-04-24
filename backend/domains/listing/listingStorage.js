function tryParseJSON(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function parseStoredImageUrls(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value !== 'string') return [];

  const trimmed = value.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith('[')) {
    const parsed = tryParseJSON(trimmed, []);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  }

  return [trimmed];
}

function parseStoredAmenities(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value !== 'string') return [];

  const trimmed = value.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith('[')) {
    const parsed = tryParseJSON(trimmed, []);
    return Array.isArray(parsed)
      ? parsed.map((item) => String(item).trim()).filter(Boolean)
      : [];
  }

  return [trimmed];
}

function serializeAmenities(amenities) {
  if (typeof amenities === 'string' && amenities.trim().startsWith('[')) {
    return amenities;
  }
  return JSON.stringify(parseStoredAmenities(amenities));
}

function slugifyAmenity(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

module.exports = {
  parseStoredAmenities,
  parseStoredImageUrls,
  serializeAmenities,
  slugifyAmenity,
  tryParseJSON,
};
