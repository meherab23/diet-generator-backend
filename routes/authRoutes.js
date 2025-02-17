const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticate = require('../middleware/authMiddleware');

// Public Routes
router.post('/register', authController.register);
router.post('/login', authController.login);
// router.post('/verify-email', authController.verifyEmail);
// router.post('/verify-phone', authController.verifyPhone);
// router.post('/resend-verification-code', authController.resendVerificationCode);
// router.post('/verify-code', authController.verifyCode);

// Protected Routes
router.post('/logout', authenticate.protect, authController.logout);
router.post('/refresh', authController.refreshToken);
// router.post('/change-password', authenticate.protect, authController.changePassword);
// router.delete('/delete-account', authenticate.protect, authController.deleteAccount);
router.get('/me', authenticate.protect, async (req, res) => {
  res.status(200).json({ user: req.user });
});

router.get('/getuser',  authController.getUsers);

module.exports = router;
