const express            = require('express');
const router             = express.Router();
const listingsController = require('../controllers/listingsController');
const { requireAuth, optionalAuth } = require('../middlewares/auth');
const upload             = require('../middlewares/upload');

// NOTE: /featured must be declared before /:id so Express doesn't treat
// the word "featured" as a dynamic id parameter.
router.get( '/featured',  listingsController.getFeatured);
router.get( '/',          optionalAuth, listingsController.getListings);
router.get( '/:id',       optionalAuth, listingsController.getListingById);
router.post('/',          requireAuth,  upload.array('images', 6), listingsController.createListing);
router.put( '/:id',       requireAuth,  upload.array('images', 6), listingsController.updateListing);
router.delete('/:id',     requireAuth,  listingsController.deleteListing);

module.exports = router;
