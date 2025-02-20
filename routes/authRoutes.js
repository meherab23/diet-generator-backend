const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticate = require('../middleware/authMiddleware');

// Public Routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected Routes
router.post('/logout', authenticate.protect, authController.logout);
router.post('/refresh', authController.refreshToken);
router.get('/me', authenticate.protect, async (req, res) => {
  res.status(200).json({ user: req.user });
});

router.get('/getuser',  authController.getUsers);

module.exports = router;
