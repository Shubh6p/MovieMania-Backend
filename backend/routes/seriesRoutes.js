const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const seriesController = require("../controllers/seriesController");

// 📌 Get all series
router.get("/api/series", seriesController.getAllSeries);

// 📌 Get a single series by custom ID (slug)
router.get("/api/series/:id", seriesController.getSeriesById);

// 📌 Create a new series (protected)
router.post("/api/series", auth, seriesController.createSeries);

// 📌 Update an existing series (protected)
router.put("/api/series/:id", auth, seriesController.updateSeries);

// 📌 Delete a series (protected)
router.delete("/api/series/:id", auth, seriesController.deleteSeries);

module.exports = router;
