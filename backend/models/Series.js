// Series.js
const mongoose = require("mongoose");

const episodeSchema = new mongoose.Schema({
  episodeNumber: Number,
  downloads: {
    "480p": String,
    "720p": String,
    "1080p": String
  }
});

const seasonSchema = new mongoose.Schema({
  seasonNumber: Number,
  episodes: [episodeSchema]
});

const seriesSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: String,
  poster: String,
  seasons: [seasonSchema],
  addedBy: String
}, { timestamps: true });

// ✅ This must be a model
const Series = mongoose.model("Series", seriesSchema);

module.exports = Series;
