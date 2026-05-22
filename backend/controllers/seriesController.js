const Series = require('../models/Series');
const { logNotification } = require('../utils/logger');

exports.list = async (req, res) => {
  try {
    const series = await Series.find().sort({ createdAt: -1 });
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
    const { id, title, description, poster, seasons, addedBy } = req.body;

    if (!id || !title) {
      return res.status(400).json({ error: 'Missing required fields: id and title are required.' });
    }

    const exists = await Series.findOne({ id });
    if (exists) {
      return res.status(409).json({ error: `Series ID '${id}' already exists.` });
    }

    const doc = new Series({
      id,
      title,
      description,
      poster,
      seasons,
      addedBy: addedBy || 'unknown'
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
    const id = req.params.id || req.body.id;
    if (!id) {
      return res.status(400).json({ success: false, error: 'Missing series ID.' });
    }

    const result = await Series.deleteOne({ id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Series not found.' });
    }

    logNotification(`Series deleted: ${id}`);
    res.json({ success: true, message: `✅ Series '${id}' deleted.` });
  } catch (e) {
    console.error('❌ Error deleting series:', e);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
};
