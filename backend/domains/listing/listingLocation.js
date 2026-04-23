const LISTING_LOCATION_SQL = `
CASE
  WHEN d.name IS NOT NULL AND c.name IS NOT NULL THEN CONCAT(d.name, ', ', c.name)
  WHEN c.name IS NOT NULL THEN c.name
  ELSE ''
END
`;

function buildListingLocation(cityName, districtName) {
  if (districtName && cityName) return `${districtName}, ${cityName}`;
  if (cityName) return cityName;
  return '';
}

module.exports = {
  LISTING_LOCATION_SQL,
  buildListingLocation,
};
