const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const movie = require('../controllers/movieController');

router.get('/api/movies', movie.list);
router.get('/api/movie', movie.list); // ✅ Alias singular route for backward/frontend script compatibility
router.get('/api/movies/:id', movie.getById);
router.post('/api/movies', auth, movie.create);
router.put('/update/movie/:id', auth, movie.updateByCustomId);
router.delete('/api/delete/movie', auth, movie.deleteByCustomId);

module.exports = router;
