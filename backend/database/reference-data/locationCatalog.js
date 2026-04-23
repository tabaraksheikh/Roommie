const rawLocations = require('./turkeyLocationsData');

let cachedLocations = null;

function repairText(value) {
  if (typeof value !== 'string' || !/[ÃÄÅ]/.test(value)) return value;
  try {
    return Buffer.from(value, 'latin1').toString('utf8');
  } catch {
    return value;
  }
}

function slugifyTurkish(value) {
  const normalized = repairText(String(value || ''))
    .trim()
    .replace(/İ/g, 'I')
    .replace(/I/g, 'i')
    .replace(/ı/g, 'i')
    .replace(/Ç/g, 'C')
    .replace(/ç/g, 'c')
    .replace(/Ğ/g, 'G')
    .replace(/ğ/g, 'g')
    .replace(/Ö/g, 'O')
    .replace(/ö/g, 'o')
    .replace(/Ş/g, 'S')
    .replace(/ş/g, 's')
    .replace(/Ü/g, 'U')
    .replace(/ü/g, 'u');

  return normalized
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function loadLocations() {
  if (cachedLocations) return cachedLocations;

  cachedLocations = rawLocations.map((city) => {
    const cityName = repairText(city.name);
    return {
      name: cityName,
      slug: slugifyTurkish(cityName),
      plateCode: String(city.plateCode || '').padStart(2, '0'),
      districts: (city.districts || []).map((district) => {
        const districtName = repairText(district);
        return {
          name: districtName,
          slug: slugifyTurkish(districtName),
        };
      }),
    };
  });

  return cachedLocations;
}

function parseLocationValue(locationValue) {
  const locations = loadLocations();
  const cityMap = new Map(locations.map((city) => [city.name, city]));
  const districtToCities = new Map();

  for (const city of locations) {
    for (const district of city.districts) {
      if (!districtToCities.has(district.name)) districtToCities.set(district.name, []);
      districtToCities.get(district.name).push(city.name);
    }
  }

  const raw = repairText(String(locationValue || '').trim());
  if (!raw) {
    return { city: '', district: '', display: '' };
  }

  const commaIndex = raw.lastIndexOf(',');
  if (commaIndex !== -1) {
    const district = raw.slice(0, commaIndex).trim();
    const city = raw.slice(commaIndex + 1).trim();
    if (cityMap.has(city)) {
      return { city, district, display: `${district}, ${city}` };
    }
  }

  if (cityMap.has(raw)) {
    return { city: raw, district: '', display: raw };
  }

  const guessedCities = districtToCities.get(raw) || [];
  if (guessedCities.length === 1) {
    return {
      city: guessedCities[0],
      district: raw,
      display: `${raw}, ${guessedCities[0]}`,
    };
  }

  return { city: '', district: raw, display: raw };
}

async function hasListingsLocationColumn(db) {
  const [rows] = await db.query("SHOW COLUMNS FROM listings LIKE 'location'");
  return rows.length > 0;
}

module.exports = {
  hasListingsLocationColumn,
  loadLocations,
  parseLocationValue,
  repairText,
  slugifyTurkish,
};
