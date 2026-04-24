/**
 * listingsService
 * Business-logic layer for listings.
 * Handles input normalization, validation, and authorization rules.
 * Delegates all DB work to listingModel.
 */
const listingModel = require('../models/listingModel');
const AppError = require('../utils/AppError');
const { formatListingResponse } = require('../domains/listing/listingResponses');
const {
  parseStoredImageUrls,
  serializeAmenities,
} = require('../domains/listing/listingStorage');
const { buildListingLocation } = require('../domains/listing/listingLocation');
const { deleteUploadFiles } = require('../utils/uploadCleanup');
const { parseDecimalPrice } = require('../utils/price');

function normalizeWhatsApp(value) {
  const raw = (value || '').trim();
  if (!raw) return { valid: true, normalized: '' };

  if (/^[+\d\s()-]+$/.test(raw)) {
    const digits = raw.replace(/\D/g, '');
    if (digits.length >= 7 && digits.length <= 15) {
      return { valid: true, normalized: `https://wa.me/${digits}` };
    }
    return { valid: false };
  }

  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase().replace(/^www\./, '');

    if (host === 'wa.me') {
      const digits = url.pathname.replace(/\//g, '').replace(/\D/g, '');
      if (digits.length >= 7 && digits.length <= 15) {
        return { valid: true, normalized: `https://wa.me/${digits}` };
      }
    }
    if (host === 'api.whatsapp.com' || host === 'whatsapp.com') {
      const digits = (url.searchParams.get('phone') || '').replace(/\D/g, '');
      if (digits.length >= 7 && digits.length <= 15) {
        return { valid: true, normalized: `https://wa.me/${digits}` };
      }
    }
  } catch {}

  return { valid: false };
}

function normalizeMapLocation(value) {
  const raw = (value || '').trim();
  if (!raw) return { valid: true, normalized: '' };

  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    const ok =
      host === 'maps.app.goo.gl' &&
      url.protocol === 'https:' &&
      url.pathname.length > 1;
    if (ok) return { valid: true, normalized: url.toString() };
    return { valid: false };
  } catch {
    return { valid: false };
  }
}

function normalizePhone(value) {
  return String(value || '').trim();
}

async function getListings(query) {
  const page = parseInt(query.page || 1);
  const limit = parseInt(query.limit || 50);
  const offset = (page - 1) * limit;

  const { rows, total } = await listingModel.findAll(query, limit, offset);
  return { listings: rows.map(formatListingResponse), total, page, limit };
}

async function getFeatured() {
  const rows = await listingModel.findFeatured();
  return rows.map(formatListingResponse);
}

async function getListingById(id) {
  const row = await listingModel.findById(id);
  if (!row) throw new AppError('Listing not found', 404);
  return formatListingResponse(row);
}

async function createListing(userId, body, imageUrls) {
  try {
    const {
      title, type, location, description, price,
      phone, whatsapp, mapLocation, amenities,
      prefsRoommates, prefsGender, prefsSmoking, prefsEnv, prefsPets,
    } = body;

    if (!title || price === undefined || price === null || price === '') {
      throw new AppError('Title and price are required', 400);
    }
    const parsedPrice = parseDecimalPrice(price);
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      throw new AppError('Price must be greater than 0', 400);
    }
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) throw new AppError('Phone number is required', 400);

    const whatsappResult = normalizeWhatsApp(whatsapp);
    if (!whatsappResult.valid) {
      throw new AppError('Please enter a valid WhatsApp link or phone number', 400);
    }

    const mapLocationResult = normalizeMapLocation(mapLocation);
    if (!mapLocationResult.valid) {
      throw new AppError('Please paste a Google Maps share link in maps.app.goo.gl format', 400);
    }

    const row = await listingModel.createListing({
      userId,
      title: title.trim(),
      type: type || 'Private',
      location: location || '',
      description: description || '',
      price: parsedPrice,
      phone: normalizedPhone,
      whatsapp: whatsappResult.normalized,
      mapLocation: mapLocationResult.normalized,
      amenities: serializeAmenities(amenities),
      prefsRoommates: parseInt(prefsRoommates) || 0,
      prefsGender: prefsGender || 'Any',
      prefsSmoking: prefsSmoking || 'Non-smoker only',
      prefsEnv: prefsEnv || 'Quiet environment',
      prefsPets: prefsPets || 'No pets',
      imageUrls,
    });

    return formatListingResponse(row);
  } catch (error) {
    await deleteUploadFiles(imageUrls);
    throw error;
  }
}

async function updateListing(listingId, userId, body, imageFiles) {
  const uploadedImageUrls = (imageFiles || []).map((file) => `/uploads/${file.filename}`);

  try {
    const existing = await listingModel.findRawById(listingId);
    if (!existing) throw new AppError('Listing not found', 404);
    if (existing.user_id !== userId) throw new AppError('Not authorized', 403);

    const {
      title, type, location, description, price,
      phone, whatsapp, mapLocation, amenities,
      prefsRoommates, prefsGender, prefsSmoking, prefsEnv, prefsPets,
    } = body;
    const nextPrice = price !== undefined ? parseDecimalPrice(price) : parseDecimalPrice(existing.price);
    if (!Number.isFinite(nextPrice) || nextPrice <= 0) {
      throw new AppError('Price must be greater than 0', 400);
    }
    const normalizedPhone = phone !== undefined ? normalizePhone(phone) : normalizePhone(existing.phone);
    if (!normalizedPhone) throw new AppError('Phone number is required', 400);

    const previousImageUrls = parseStoredImageUrls(existing.image_urls);
    const retainedImages = parseStoredImageUrls(body.retainedImages || existing.image_urls);
    const imageUrls = [...retainedImages, ...uploadedImageUrls];
    const whatsappResult = normalizeWhatsApp(whatsapp !== undefined ? whatsapp : existing.whatsapp);
    if (!whatsappResult.valid) {
      throw new AppError('Please enter a valid WhatsApp link or phone number', 400);
    }

    const mapLocationResult = normalizeMapLocation(
      mapLocation !== undefined ? mapLocation : existing.map_location
    );
    if (!mapLocationResult.valid) {
      throw new AppError('Please paste a Google Maps share link in maps.app.goo.gl format', 400);
    }

    const row = await listingModel.updateListing(listingId, {
      title: title !== undefined ? title.trim() : existing.title,
      type: type !== undefined ? type : existing.type,
      location: location !== undefined ? location : buildListingLocation(existing.city_name, existing.district_name),
      description: description !== undefined ? description : existing.description,
      price: nextPrice,
      phone: normalizedPhone,
      whatsapp: whatsappResult.normalized,
      mapLocation: mapLocationResult.normalized,
      amenities: amenities !== undefined ? serializeAmenities(amenities) : existing.amenities,
      prefsRoommates: prefsRoommates !== undefined ? parseInt(prefsRoommates) : existing.prefs_roommates,
      prefsGender: prefsGender !== undefined ? prefsGender : existing.prefs_gender,
      prefsSmoking: prefsSmoking !== undefined ? prefsSmoking : existing.prefs_smoking,
      prefsEnv: prefsEnv !== undefined ? prefsEnv : existing.prefs_env,
      prefsPets: prefsPets !== undefined ? prefsPets : existing.prefs_pets,
      imageUrls,
    });

    const removedImageUrls = previousImageUrls.filter((url) => !retainedImages.includes(url));
    await deleteUploadFiles(removedImageUrls);

    return formatListingResponse(row);
  } catch (error) {
    await deleteUploadFiles(uploadedImageUrls);
    throw error;
  }
}

async function deleteListing(listingId, userId) {
  const existing = await listingModel.findRawById(listingId);
  if (!existing) throw new AppError('Listing not found', 404);
  if (existing.user_id !== userId) throw new AppError('Not authorized', 403);
  const imageUrls = parseStoredImageUrls(existing.image_urls);
  await listingModel.deleteListing(listingId);
  await deleteUploadFiles(imageUrls);
}

module.exports = {
  getListings,
  getFeatured,
  getListingById,
  createListing,
  updateListing,
  deleteListing,
};
