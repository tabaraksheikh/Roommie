/**
 * savedService
 * ──────────────────────────────────────────────────────────────
 * Business-logic layer for saved listings.
 */
const savedModel   = require('../models/savedModel');
const listingModel = require('../models/listingModel');
const AppError     = require('../utils/AppError');
const { formatSavedListingResponse } = require('../domains/listing/listingResponses');

/** Return all saved listings for the authenticated user */
async function getSavedListings(userId) {
  const rows = await savedModel.findAllByUser(userId);
  return rows.map(formatSavedListingResponse);
}

/** Check whether the user has saved a specific listing */
async function checkSaved(userId, listingId) {
  return savedModel.isSaved(userId, listingId);
}

/** Save a listing (validates it exists) */
async function saveListing(userId, listingId) {
  const listing = await listingModel.findRawById(listingId);
  if (!listing) throw new AppError('Listing not found', 404);

  try {
    await savedModel.saveListing(userId, listingId);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') throw new AppError('Already saved', 409);
    throw err;
  }
}

/** Remove a listing from the user's saved list */
async function unsaveListing(userId, listingId) {
  const affected = await savedModel.unsaveListing(userId, listingId);
  if (affected === 0) throw new AppError('Not found in saved list', 404);
}

module.exports = { getSavedListings, checkSaved, saveListing, unsaveListing };
