const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const dietController = require('../controllers/dietController.js');

// Public Routes
router.post('/create', dietController.creatDiet);
router.get('/get', dietController.getAllDiets);

module.exports = router;