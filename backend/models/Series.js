const mongoose = require('mongoose');

const EpisodeSchema = new mongoose.Schema({
  episodeNumber: { type: Number, required: true },
  title: String,
  thumbnail: String,
  downloads: {
    '480p': String,
    '720p': String,
    '1080p': String
  }
}, { _id: false });

const SeasonSchema = new mongoose.Schema({
  seasonNumber: { type: Number, required: true },
  episodes: [EpisodeSchema]
}, { _id: false });

const SeriesSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: String,
  poster: String,
  seasons: [SeasonSchema],
  addedBy: String,
}, { timestamps: true });

module.exports = mongoose.model('Series', SeriesSchema);
