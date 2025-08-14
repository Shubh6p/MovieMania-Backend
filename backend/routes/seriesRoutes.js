const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const series = require('../controllers/seriesController');

router.get('/api/series', series.list);
router.get('/api/series/:id', series.getByCustomId);
router.post('/api/series', auth, series.create);
router.delete('/api/delete/series', auth, series.deleteByCustomId);

module.exports = router;
