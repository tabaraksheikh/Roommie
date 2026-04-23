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
