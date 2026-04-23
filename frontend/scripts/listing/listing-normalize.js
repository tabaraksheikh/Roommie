/**
 * common-listing-normalize.js - Listing API normalization helpers.
 */

function normalizeApiListing(listing) {
  if (!listing) return {};

  let imageUrls = Array.isArray(listing.imageUrls) ? listing.imageUrls.filter(Boolean) : [];
  if (!imageUrls.length && typeof listing.image_url === 'string') {
    const raw = listing.image_url.trim();
    if (raw.startsWith('[')) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) imageUrls = parsed.filter(Boolean);
      } catch {}
    } else if (raw) {
      imageUrls = [raw];
    }
  }
  if (!imageUrls.length && listing.imageUrl) imageUrls = [listing.imageUrl];

  return {
    id: listing.id,
    title: listing.title,
    type: listing.type,
    location: listing.location,
    desc: listing.description || listing.desc || '',
    description: listing.description || listing.desc || '',
    price: listing.price,
    createdAt: listing.createdAt || listing.created_at || '',
    phone: listing.phone || '',
    wa: listing.whatsapp || listing.wa || '',
    whatsapp: listing.whatsapp || listing.wa || '',
    mapLocation: listing.mapLocation || listing.map_location || '',
    amenities: listing.amenities || [],
    prefs: listing.prefs || {},
    roommates: listing.prefs?.roommates ?? listing.roommates ?? 0,
    prefGender: listing.prefs?.gender || listing.prefGender || 'Any',
    smoking: listing.prefs?.smoking || listing.smoking || '',
    env: listing.prefs?.env || listing.env || '',
    pets: listing.prefs?.pets || listing.pets || '',
    imageUrl: listing.imageUrl || imageUrls[0] || '',
    imageUrls,
    userId: listing.userId || listing.user_id,
    poster: listing.poster
      ? {
          id: listing.poster.id,
          name: listing.poster.name || listing.poster.fullName || '',
          gender: listing.poster.gender || '',
          bio: listing.poster.bio || '',
          sub: listing.poster.gender || '',
        }
      : null,
  };
}

window.normalizeApiListing = normalizeApiListing;
