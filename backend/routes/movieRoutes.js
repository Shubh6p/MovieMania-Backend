const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const movie = require('../controllers/movieController');

router.get('/api/movies', movie.list);
router.get('/api/movies/:id', movie.getById);
router.post('/api/movies', auth, movie.create);
router.put('/updatemovie.html:id', auth, movie.updateByCustomId);
router.delete('/api/delete/movie', auth, movie.deleteByCustomId);

module.exports = router;
