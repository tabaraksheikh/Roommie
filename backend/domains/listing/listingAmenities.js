const LISTING_AMENITIES_SQL = "COALESCE(amenity_data.amenities, '[]')";

const LISTING_AMENITIES_JOIN = `
  LEFT JOIN (
    SELECT
      la.listing_id,
      CONCAT('[', GROUP_CONCAT(JSON_QUOTE(a.name) ORDER BY a.name SEPARATOR ','), ']') AS amenities
    FROM listing_amenities la
    JOIN amenities a ON a.id = la.amenity_id
    GROUP BY la.listing_id
  ) amenity_data ON amenity_data.listing_id = l.id
`;

module.exports = {
  LISTING_AMENITIES_JOIN,
  LISTING_AMENITIES_SQL,
};
