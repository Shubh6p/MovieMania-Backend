const Series = require('../models/Series');
const { logNotification } = require('../utils/logger');

exports.list = async (req, res) => {
  try {
    const series = await Series.find();
    res.json(series);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch series.' });
  }
};

exports.getByCustomId = async (req, res) => {
  try {
    const s = await Series.findOne({ id: req.params.id });
    if (!s) return res.status(404).json({ error: 'Series not found.' });
    res.json(s);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch series.' });
  }
};

exports.create = async (req, res) => {
  try {
    const seriesKey = Object.keys(req.body)[0];
    const data = req.body[seriesKey];
    const { title, description, episodes } = data || {};

    if (!seriesKey || !title || !episodes) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }
    const exists = await Series.findOne({ id: seriesKey });
    if (exists) return res.status(409).json({ error: 'Series ID already exists.' });

    const doc = new Series({
      id: seriesKey,
      title,
      description,
      episodes,
      addedBy: data.addedBy || 'unknown'
    });

    await doc.save();
    logNotification(`Series added: ${title}`);
    res.status(201).json(doc);
  } catch (e) {
    console.error('❌ Failed to save series:', e);
    res.status(500).json({ error: 'Failed to add series.' });
  }
};

exports.deleteByCustomId = async (req, res) => {
  try {
    const { id } = req.body;
    await Series.deleteOne({ id });
    logNotification(`Series deleted: ${id}`);
    res.send(`✅ Series '${id}' deleted.`);
  } catch (e) {
    res.status(500).send('❌ Internal server error.');
  }
};
