require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// Global middleware
app.use(cors());
app.use(bodyParser.json());
app.use('/images', express.static(path.join(__dirname, '..', 'images')));
app.use('/admin', express.static(path.join(__dirname, '..', 'admin')));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Static frontend (as in original)
const frontendDir = path.join(__dirname, '..', '..', 'MovieMania-Frontend-main');
app.use(express.static(frontendDir));

// Routes
app.use(require('./routes/movieRoutes'));
app.use(require('./routes/seriesRoutes'));
app.use(require('./routes/adminRoutes'));
app.use(require('./routes/sessionRoutes'));
app.use(require('./routes/notificationRoutes'));
app.use(require('./routes/statsRoutes'));
app.use(require('./routes/uploadRoutes'));
app.use(require('./routes/pageRoutes'));

app.listen(PORT, () => {
  console.log(`✅ MovieMania server running at http://localhost:${PORT}`);
});
