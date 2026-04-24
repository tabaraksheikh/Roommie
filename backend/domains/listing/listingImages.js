const { parseStoredImageUrls } = require('./listingStorage');

const LISTING_IMAGES_SQL = "COALESCE(image_data.image_urls, '[]')";

const LISTING_IMAGES_JOIN = `
  LEFT JOIN (
    SELECT
      li.listing_id,
      CONCAT('[', GROUP_CONCAT(JSON_QUOTE(li.url) ORDER BY li.position ASC, li.id ASC SEPARATOR ','), ']') AS image_urls
    FROM listing_images li
    GROUP BY li.listing_id
  ) image_data ON image_data.listing_id = l.id
`;

async function syncListingImages(db, listingId, imageUrlsValue) {
  const imageUrls = parseStoredImageUrls(imageUrlsValue).slice(0, 6);

  await db.query('DELETE FROM listing_images WHERE listing_id = ?', [listingId]);
  if (!imageUrls.length) return;

  for (let index = 0; index < imageUrls.length; index += 1) {
    await db.query(
      'INSERT INTO listing_images (listing_id, url, position) VALUES (?, ?, ?)',
      [listingId, imageUrls[index], index]
    );
  }
}

module.exports = {
  LISTING_IMAGES_SQL,
  LISTING_IMAGES_JOIN,
  syncListingImages,
};
