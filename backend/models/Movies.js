const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  id: String,
  title: String,
  category: [String],
  details: String,
  image: String,
  url: String,
  releaseDate: String,
  summary: String,
  rating: String,
  languages: String,
  countries: String,
  trailer: String,
  downloads: {
    "480p": String,
    "720p": String,
    "1080p": String,
  },
  poster: String,
  addedBy: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Movie', movieSchema);
