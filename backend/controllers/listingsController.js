/**
 * listingsController
 * ──────────────────────────────────────────────────────────────
 * HTTP adapter for listing operations.
 * Reads from req, calls the service, writes to res.
 * No business logic, no SQL here.
 */
const listingsService = require('../services/listingsService');
const catchAsync      = require('../utils/catchAsync');

/** GET /api/listings */
const getListings = catchAsync(async (req, res) => {
  const result = await listingsService.getListings(req.query);
  res.json(result);
});

/** GET /api/listings/featured */
const getFeatured = catchAsync(async (req, res) => {
  const listings = await listingsService.getFeatured();
  res.json({ listings });
});

/** GET /api/listings/:id */
const getListingById = catchAsync(async (req, res) => {
  const listing = await listingsService.getListingById(req.params.id);
  res.json({ listing });
});

/** POST /api/listings */
const createListing = catchAsync(async (req, res) => {
  const imageUrls = (req.files || []).map((file) => `/uploads/${file.filename}`);
  const listing   = await listingsService.createListing(req.user.id, req.body, imageUrls);
  res.status(201).json({ message: 'Listing created', listing });
});

/** PUT /api/listings/:id */
const updateListing = catchAsync(async (req, res) => {
  const listing = await listingsService.updateListing(
    req.params.id,
    req.user.id,
    req.body,
    req.files || []
  );
  res.json({ message: 'Listing updated', listing });
});

/** DELETE /api/listings/:id */
const deleteListing = catchAsync(async (req, res) => {
  await listingsService.deleteListing(req.params.id, req.user.id);
  res.json({ message: 'Listing deleted' });
});

module.exports = {
  getListings,
  getFeatured,
  getListingById,
  createListing,
  updateListing,
  deleteListing,
};
