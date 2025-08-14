const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
  token: { type: String, required: false },
  createdAt: { type: Date, default: Date.now, expires: '1d' }
});

module.exports = mongoose.model('Session', SessionSchema);
