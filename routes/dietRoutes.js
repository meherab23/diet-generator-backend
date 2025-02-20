const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const dietController = require('../controllers/dietController.js');

// Public Routes
router.post('/create', dietController.creatDiet);
router.patch('/update', dietController.updateDiet);
router.patch('/weightupdate', dietController.weightupdateDiet);
router.patch('/updatestatus', dietController.updatestatusDiet);
router.delete('/delete', dietController.deleteDiet);
router.get('/get', dietController.getAllDiets);

module.exports = router;