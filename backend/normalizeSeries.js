// scripts/normalizeSeries.js
require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// 1. Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on('error', console.error);
db.once('open', () => console.log('✅ Connected to MongoDB for Series Normalization'));

// 2. Define Series model
const seriesSchema = new mongoose.Schema({
  title: String,
  description: String,
  episodes: mongoose.Schema.Types.Mixed,
});
const Series = mongoose.model('Series', seriesSchema);

// 3. Load the current nested series structure
const raw = fs.readFileSync(path.join(__dirname, 'old-series.json'), 'utf-8');
const data = JSON.parse(raw);

// 4. Transform & insert
async function normalize() {
  const firstDoc = Array.isArray(data) ? data[0] : data;
  const entries = Object.entries(firstDoc);

  for (const [slug, value] of entries) {
    if (!value.title) continue;

    const normalized = {
      title: value.title,
      description: value.description || "",
      episodes: value.episodes || {},
    };

    await Series.create(normalized);
    console.log(`✅ Inserted: ${value.title}`);
  }

  console.log("🎉 All series normalized and inserted.");
  mongoose.disconnect();
}

normalize();
