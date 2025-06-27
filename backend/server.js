// Updated server.js with MongoDB logic replacing JSON operations
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const archiver = require('archiver');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'yourSuperSecretKey';

app.use(cors());
app.use(bodyParser.json());
app.use('/images', express.static(path.join(__dirname, '..', 'images')));
app.use('/admin', express.static(path.join(__dirname, '..', 'admin')));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Models
const Movie = require('./models/Movies');
const Series = require('./models/Series');
const Admin = require('./models/Admins');
const Session = require('./models/Sessions');

const frontendDir = path.join(__dirname, '..', '..', 'MovieMania-Frontend-main');
app.use(express.static(frontendDir));

app.get('/:page', (req, res, next) => {
  const pagePath = path.join(frontendDir, `${req.params.page}.html`);
  if (fs.existsSync(pagePath)) res.sendFile(pagePath);
  else next();
});

app.get('/', (req, res) => {
  res.sendFile(path.join(frontendDir, '/home'));
});

function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(" ")[1] || req.query.token;
  if (!token) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

function logNotification(message) {
  const logPath = path.join(__dirname, '..', 'notifications.log');
  const log = `[${new Date().toISOString()}] ${message}\n`;
  fs.appendFileSync(logPath, log);
}

app.get('/api/movies', async (req, res) => {
  try {
    const movies = await Movie.find().sort({ createdAt: -1 }); // newest first
    res.json(movies);
  } catch {
    res.status(500).json({ error: 'Failed to fetch movies.' });
  }
});


app.post('/api/movies', authenticateToken, async (req, res) => {
  try {
    const movie = new Movie(req.body);
    await movie.save();
    logNotification(`Movie added: ${req.body.title}`);
    res.status(201).json(movie);
  } catch { res.status(500).json({ error: 'Failed to add movie.' }); }
});

app.get("/api/movies/:id", async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ error: "Movie not found" });
    res.json(movie);
  } catch (err) {
    res.status(500).json({ error: "Error fetching movie" });
  }
});



app.get('/api/series', async (req, res) => {
  try {
    const series = await Series.find();
    res.json(series);
  } catch { res.status(500).json({ error: 'Failed to fetch series.' }); }
});

// ✅ GET a single series by ID
app.get('/api/series/:id', async (req, res) => {
  try {
    const series = await Series.findOne({ id: req.params.id });
    if (!series) return res.status(404).json({ error: "Series not found." });
    res.json(series);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch series." });
  }
});


function slugify(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

app.post('/api/series', authenticateToken, async (req, res) => {
  try {
    const seriesKey = Object.keys(req.body)[0]; // e.g., "hells-paradise"
    const seriesData = req.body[seriesKey];

    const { title, description, episodes } = seriesData;

    if (!seriesKey || !title || !episodes) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    // ✅ Prevent duplicate series ID
    const exists = await Series.findOne({ id: seriesKey });
    if (exists) {
      return res.status(409).json({ error: 'Series ID already exists.' });
    }

    if (!seriesKey || !title || !episodes) {
  return res.status(400).json({ error: "Missing required fields." });
}

    const series = new Series({
      id: seriesKey,
      title,
      description,
      episodes,
      addedBy: seriesData.addedBy || "unknown"
    });


    await series.save();
    logNotification(`Series added: ${title}`);
    res.status(201).json(series);

  } catch (err) {
    console.error("❌ Failed to save series:", err);
    res.status(500).json({ error: 'Failed to add series.' });
  }
});


app.get('/api/profile', authenticateToken, async (req, res) => {
  const admin = await Admin.findOne({ username: req.user.username });
  if (!admin) return res.status(404).json({ error: 'User not found' });
  res.json(admin);
});

app.post('/api/admins', authenticateToken, async (req, res) => {
  const { username, password, role } = req.body;
  const exists = await Admin.findOne({ username });
  if (exists) return res.json({ success: false, error: 'Username exists' });
  await new Admin({ username, password, role, createdAt: new Date() }).save();
  logNotification(`Admin added: ${username}`);
  res.json({ success: true });
});

app.put('/api/admins/:username', authenticateToken, async (req, res) => {
  const updates = req.body;
  const admin = await Admin.findOneAndUpdate(
    { username: req.params.username },
    updates,
    { new: true }
  );
  if (!admin) return res.json({ success: false, error: 'Not found' });
  res.json({ success: true });
});

app.delete('/api/admins/:username', authenticateToken, async (req, res) => {
  await Admin.deleteOne({ username: req.params.username });
  logNotification(`Admin deleted: ${req.params.username}`);
  res.json({ success: true });
});

app.get('/api/admins', authenticateToken, async (req, res) => {
  const admins = await Admin.find();
  res.json(admins);
});

app.get('/api/sessions', authenticateToken, async (req, res) => {
  const sessions = await Session.find();
  res.json(sessions);
});

app.put('/update/movie/:id', authenticateToken, async (req, res) => {
  const movie = await Movie.findOneAndUpdate(
    { id: req.params.id },
    req.body,
    { new: true }
  );
  if (!movie) return res.status(404).send("❌ Movie not found.");
  logNotification(`Post updated: ${req.params.id}`);
  res.send("✅ Post updated.");
});


app.delete('/api/delete/movie', authenticateToken, async (req, res) => {
  try {
    const { id } = req.body;
    const movie = await Movie.findOne({ id });

    if (!movie) return res.status(404).send("❌ Movie not found.");

    // 🧹 Extract public_id from Cloudinary poster URL
    const posterUrl = movie.poster;
    const match = posterUrl.match(/\/([^\/]+)\.(jpg|jpeg|png)$/);
    const publicId = match ? `MovieManiaPosters/${match[1]}` : null;

    // 🧹 Delete image from Cloudinary if publicId is valid
    if (publicId) {
    const result = await cloudinary.uploader.destroy(publicId);
    if (result.result !== 'not found') {
    console.log("🧹 Cloudinary deleted:", publicId);
  }
}


    await Movie.deleteOne({ id });
    logNotification(`Movie deleted: ${id}`);
    res.send(`✅ Post '${id}' Deleted.`);
  } catch (err) {
    console.error("❌ Failed to delete movie/poster:", err);
    res.status(500).send("❌ Internal server error.");
  }
});


app.delete('/api/delete/series', authenticateToken, async (req, res) => {
  const { id } = req.body;
  await Series.deleteOne({ id });
  logNotification(`Series deleted: ${id}`);
  res.send(`✅ Series '${id}' deleted.`);
});

const { cloudinary, storage } = require('./cloudinary');
const upload = multer({ storage });


app.post('/upload-poster', authenticateToken, upload.single('poster'), (req, res) => {
  try {
    if (!req.file || !req.file.path) {
      return res.status(400).send("Error: No file uploaded.");
    }

    const imageUrl = req.file.path; // Cloudinary provides this

    if (!imageUrl.startsWith("http")) {
      return res.status(500).send("Error: Invalid Cloudinary URL.");
    }

    res.send(`success:${imageUrl}`);
  } catch (err) {
    console.error("❌ Upload error:", err);
    res.status(500).send("Internal server error.");
  }
});



app.get('/api/notifications', authenticateToken, (req, res) => {
  const logPath = path.join(__dirname, '..', 'notifications.log');
  if (!fs.existsSync(logPath)) return res.json([]);
  const logs = fs.readFileSync(logPath, 'utf-8').split('\n').filter(Boolean)
    .map(line => {
      const match = line.match(/\[(.*?)\]\s(.+)/);
      return { timestamp: new Date(match[1]).getTime(), message: match[2] };
    });
  res.json(logs);
});

app.delete('/api/notifications/delete', authenticateToken, (req, res) => {
  const { indexes } = req.body;
  const logPath = path.join(__dirname, '..', 'notifications.log');
  const lines = fs.readFileSync(logPath, 'utf-8').split('\n');
  const filtered = lines.filter(line => {
    const match = line.match(/\[(.*?)\]/);
    const ts = match ? new Date(match[1]).getTime() : null;
    return ts ? !indexes.includes(ts) : true;
  });
  fs.writeFileSync(logPath, filtered.join('\n') + '\n');
  res.send("✅ Selected notifications deleted.");
});



// ========== Admin Login Route Fix ==========
app.post('/api/admin/login', async (req, res) => {
  console.log("🟡 Incoming admin login:", req.body);

  try {
    const { username, password } = req.body;

    const admin = await Admin.findOne({ username, password });
    if (!admin) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "2h" });

    await new Session({
      username,
      token,
      timestamp: Date.now()
    }).save();

    res.json({
      success: true,
      token,
      user: {
        username: admin.username,
        role: admin.role
      }
    });
  } catch (err) {
    console.error("❌ Internal login error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

app.get('/api/stats', authenticateToken, async (req, res) => {
  try {
    const [totalMovies, totalSeries, totalAdmins, sessions] = await Promise.all([
      Movie.countDocuments(),
      Series.countDocuments(),
      Admin.countDocuments(),
      Session.find({ timestamp: { $gte: Date.now() - 7 * 24 * 60 * 60 * 1000 } }) // last 7 days
    ]);

    res.json({
      totalMovies,
      totalSeries,
      totalAdmins,
      recentLogins: sessions.length
    });
  } catch (err) {
    console.error("❌ Error fetching analytics:", err);
    res.status(500).json({ error: "Failed to load analytics" });
  }
});


app.listen(PORT, () => {
  console.log(`✅ MovieMania server running at http://localhost:${PORT}`);
});