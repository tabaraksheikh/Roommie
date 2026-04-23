/**
 * savedController
 * ──────────────────────────────────────────────────────────────
 * HTTP adapter for saved-listing operations.
 */
const savedService = require('../services/savedService');
const catchAsync   = require('../utils/catchAsync');

/** GET /api/saved */
const getSavedListings = catchAsync(async (req, res) => {
  const listings = await savedService.getSavedListings(req.user.id);
  res.json({ listings });
});

/** GET /api/saved/check/:listingId */
const checkSaved = catchAsync(async (req, res) => {
  const saved = await savedService.checkSaved(req.user.id, req.params.listingId);
  res.json({ saved });
});

/** POST /api/saved/:listingId */
const saveListing = catchAsync(async (req, res) => {
  await savedService.saveListing(req.user.id, req.params.listingId);
  res.status(201).json({ message: 'Listing saved' });
});

/** DELETE /api/saved/:listingId */
const unsaveListing = catchAsync(async (req, res) => {
  await savedService.unsaveListing(req.user.id, req.params.listingId);
  res.json({ message: 'Removed from saved' });
});

module.exports = { getSavedListings, checkSaved, saveListing, unsaveListing };
