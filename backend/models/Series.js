const mongoose = require('mongoose');

const EpisodeSchema = new mongoose.Schema({
  title: String,
  link: String,
}, { _id: false });

const QualitySchema = new mongoose.Schema({
  '480p': [EpisodeSchema],
  '720p': [EpisodeSchema],
  '1080p': [EpisodeSchema],
}, { _id: false });

const SeriesSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // ✅ manual id field
  title: { type: String, required: true },
  description: String,
  episodes: QualitySchema,
  addedBy: String,
}, { timestamps: true });

module.exports = mongoose.model('Series', SeriesSchema);
