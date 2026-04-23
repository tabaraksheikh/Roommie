const express        = require('express');
const router         = express.Router();
const authController = require('../controllers/authController');
const { requireAuth} = require('../middlewares/auth');

// Two-step registration
router.post(  '/send-verification', authController.sendVerification);
router.post(  '/verify-email',      authController.verifyEmail);
router.post(  '/forgot-password',   authController.requestPasswordReset);
router.post(  '/reset-password',    authController.resetPassword);

router.post(  '/login',    authController.login);
router.get(   '/me',       requireAuth, authController.getMe);
router.put(   '/password', requireAuth, authController.changePassword);
router.post(  '/email/change/request', requireAuth, authController.requestEmailChange);
router.put(   '/email/change/confirm', requireAuth, authController.confirmEmailChange);
router.delete('/account',  requireAuth, authController.deleteAccount);

module.exports = router;
