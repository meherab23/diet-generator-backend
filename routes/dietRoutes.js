const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const dietController = require('../controllers/dietController.js');

// Public Routes
router.post('/create', dietController.creatDiet);
router.patch('/update', dietController.updateDiet);
router.get('/get', dietController.getAllDiets);

module.exports = router;