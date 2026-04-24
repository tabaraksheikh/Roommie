const test = require('node:test');
const assert = require('node:assert/strict');

const listingsService = require('../backend/services/listingsService');
const listingModel = require('../backend/models/listingModel');
const AppError = require('../backend/utils/AppError');
const { parseDecimalPrice } = require('../backend/utils/price');

function patch(object, key, value) {
  const original = object[key];
  object[key] = value;
  return () => {
    object[key] = original;
  };
}

test('listingsService.getListings preserves pagination metadata', async () => {
  const restore = patch(listingModel, 'findAll', async (_query, limit, offset) => ({
    rows: [],
    total: 26,
    limit,
    offset,
  }));

  try {
    const result = await listingsService.getListings({ page: 2, limit: 12 });
    assert.equal(result.total, 26);
    assert.equal(result.page, 2);
    assert.equal(result.limit, 12);
  } finally {
    restore();
  }
});

test('listingsService.createListing rejects non-positive price', async () => {
  await assert.rejects(
    () => listingsService.createListing(1, {
      title: 'Test room',
      price: 0,
      phone: '+905551112233',
    }, []),
    (error) => error instanceof AppError && error.statusCode === 400
  );
});

test('listingModel normalize path preserves decimal prices through service pagination output', async () => {
  const restore = patch(listingModel, 'findAll', async () => ({
    rows: [{
      id: 1,
      user_id: 1,
      title: 'Decimal room',
      type: 'Private',
      location: 'Kadikoy, Istanbul',
      description: '',
      price: 1250.5,
      phone: '+905551112233',
      whatsapp: '',
      map_location: '',
      amenities: '[]',
      prefs_roommates: 0,
      prefs_gender: 'Any',
      prefs_smoking: 'No preference',
      prefs_env: 'Balanced',
      prefs_pets: 'No pets',
      image_urls: '[]',
      created_at: '2026-01-01T00:00:00.000Z',
      poster_id: 1,
      poster_email: 'user@example.com',
      poster_first: 'Test',
      poster_last: 'User',
      poster_gender: '',
      poster_bio: '',
    }],
    total: 1,
  }));

  try {
    const result = await listingsService.getListings({ page: 1, limit: 12 });
    assert.equal(result.listings[0].price, 1250.5);
  } finally {
    restore();
  }
});

test('backend decimal price parser accepts both comma and dot', async () => {
  assert.equal(parseDecimalPrice('1250.50'), 1250.5);
  assert.equal(parseDecimalPrice('1250,50'), 1250.5);
});

test('listingsService.deleteListing rejects unauthorized delete attempts', async () => {
  const restore = patch(listingModel, 'findRawById', async () => ({ id: 5, user_id: 99, image_urls: '[]' }));

  try {
    await assert.rejects(
      () => listingsService.deleteListing(5, 1),
      (error) => error instanceof AppError && error.statusCode === 403
    );
  } finally {
    restore();
  }
});
