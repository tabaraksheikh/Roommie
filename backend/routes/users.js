const express         = require('express');
const router          = express.Router();
const usersController = require('../controllers/usersController');
const { requireAuth } = require('../middlewares/auth');

// NOTE: /me must come before /:id
router.get('/me',  requireAuth, usersController.getMe);
router.put('/me',  requireAuth, usersController.updateMe);
router.get('/:id',             usersController.getUserById);

module.exports = router;
