
const Movie = require('../models/Movies');
const { logNotification } = require('../utils/logger');

exports.list = async (req, res) => {
  try {
    const movies = await Movie.find().sort({ createdAt: -1 });
    res.json(movies);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch movies.' });
  }
};

exports.getById = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ error: 'Movie not found' });
    res.json(movie);
  } catch (e) {
    res.status(500).json({ error: 'Error fetching movie' });
  }
};

exports.create = async (req, res) => {
  try {
    const movie = new Movie(req.body);
    await movie.save();
    logNotification(`Movie added: ${req.body.title}`);
    res.status(201).json(movie);
  } catch (e) {
    res.status(500).json({ error: 'Failed to add movie.' });
  }
};

exports.updateByCustomId = async (req, res) => {
  try {
    const movie = await Movie.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    if (!movie) return res.status(404).send('❌ Movie not found.');
    logNotification(`Post updated: ${req.params.id}`);
    res.send('✅ Post updated.');
  } catch (e) {
    res.status(500).send('❌ Internal server error.');
  }
};

exports.deleteByCustomId = async (req, res) => {
  try {
    const { id } = req.body;
    const movie = await Movie.findOne({ id });
    if (!movie) return res.status(404).send('❌ Movie not found.');

    const posterUrl = movie.poster;
    let publicId = null;
    if (posterUrl) {
      const match = posterUrl.match(/\/([^\/]+)\.(jpg|jpeg|png)$/);
      publicId = match ? `MovieManiaPosters/${match[1]}` : null;
    }

    if (publicId) {
      const { cloudinary } = require('../config/cloudinary');
      const result = await cloudinary.uploader.destroy(publicId);
      if (result.result !== 'not found') {
        console.log('🧹 Cloudinary deleted:', publicId);
      }
    }

    await Movie.deleteOne({ id });
    logNotification(`Movie deleted: ${id}`);
    res.send(`✅ Post '${id}' Deleted.`);
  } catch (e) {
    console.error('❌ Failed to delete movie/poster:', e);
    res.status(500).send('❌ Internal server error.');
  }
};
