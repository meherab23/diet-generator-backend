const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticate = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');

// Public Routes
router.patch('/update', userController.updateUser);

router.get('/me', authenticate.protect, async (req, res) => {
  res.status(200).json({ user: req.user });
});

router.get('/getuser',  authController.getUsers);

module.exports = router;