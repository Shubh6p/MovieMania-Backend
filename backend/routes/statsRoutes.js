const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const stats = require('../controllers/statsController');

router.get('/api/stats', auth, stats.getStats);

module.exports = router;
