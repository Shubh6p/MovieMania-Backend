const Series = require("../models/Series");

// ➤ Create new series
exports.createSeries = async (req, res) => {
  try {
    const { id, title, description, poster, seasons, addedBy } = req.body;

    if (!id || !title) {
      return res.status(400).json({ error: "Series ID and title are required." });
    }

    // Prevent duplicates
    const existing = await Series.findOne({ id });
    if (existing) {
      return res.status(400).json({ error: "Series with this ID already exists." });
    }

    const newSeries = new Series({
      id,
      title,
      description,
      poster,
      seasons, // ✅ save seasons instead of flat episodes
      addedBy
    });

    await newSeries.save();
    res.status(201).json(newSeries);
  } catch (err) {
    console.error("❌ Error creating series:", err);
    res.status(500).json({ error: "Server error while creating series." });
  }
};

// ➤ Get all series
exports.getAllSeries = async (req, res) => {
  try {
    const series = await Series.find();
    res.json(series);
  } catch (err) {
    console.error("Error fetching series:", err);
    res.status(500).json({ error: "Server error while fetching series." });
  }
};


// ➤ Get single series by ID (slug)
exports.getSeriesById = async (req, res) => {
  try {
    const { id } = req.params;
    const series = await Series.findOne({ id });

    if (!series) {
      return res.status(404).json({ error: "Series not found." });
    }

    res.json(series);
  } catch (err) {
    console.error("❌ Error fetching series by ID:", err);
    res.status(500).json({ error: "Server error while fetching series." });
  }
};

// ➤ Update series
exports.updateSeries = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedSeries = await Series.findOneAndUpdate(
      { id },
      updates,
      { new: true }
    );

    if (!updatedSeries) {
      return res.status(404).json({ error: "Series not found." });
    }

    res.json(updatedSeries);
  } catch (err) {
    console.error("❌ Error updating series:", err);
    res.status(500).json({ error: "Server error while updating series." });
  }
};

// ➤ Delete series
exports.deleteSeries = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Series.findOneAndDelete({ id });

    if (!deleted) {
      return res.status(404).json({ error: "Series not found." });
    }

    res.json({ message: "✅ Series deleted successfully." });
  } catch (err) {
    console.error("❌ Error deleting series:", err);
    res.status(500).json({ error: "Server error while deleting series." });
  }
};
