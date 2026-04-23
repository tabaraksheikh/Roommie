const express         = require('express');
const router          = express.Router();
const savedController = require('../controllers/savedController');
const { requireAuth } = require('../middlewares/auth');

// NOTE: /check/:listingId must come before /:listingId
router.get(   '/',                   requireAuth, savedController.getSavedListings);
router.get(   '/check/:listingId',   requireAuth, savedController.checkSaved);
router.post(  '/:listingId',         requireAuth, savedController.saveListing);
router.delete('/:listingId',         requireAuth, savedController.unsaveListing);

module.exports = router;
