const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const bodyParser = require('body-parser');
const archiver = require('archiver');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'superSecretKey';

app.use(cors());
app.use(bodyParser.json());
app.use('/images', express.static(path.join(__dirname, '..', 'images')));
app.use('/admin', express.static(path.join(__dirname, '..', 'admin')));

// Serve frontend files (static HTML, CSS, etc.)
const frontendDir = path.join(__dirname, '..', '..', 'MovieMania-Frontend-main');
app.use(express.static(frontendDir));

// Clean URL routing (e.g., /about → //about/)
app.get('/:page', (req, res, next) => {
  const pagePath = path.join(frontendDir, `${req.params.page}.html`);
  if (fs.existsSync(pagePath)) {
    res.sendFile(pagePath);
  } else {
    next(); // proceed to other routes if page doesn't exist
  }
});

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendDir, '/home'));
});


const DATA_DIR = path.join(__dirname, '..', 'data');
const BACKEND_DIR = __dirname;

function readJSON(file, location = 'data') {
  const dir = location === 'backend' ? BACKEND_DIR : DATA_DIR;
  const filePath = path.join(dir, file);
  if (!fs.existsSync(filePath)) return file === 'series.json' ? {} : [];
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function writeJSON(file, data, location = 'data') {
  const dir = location === 'backend' ? BACKEND_DIR : DATA_DIR;
  fs.writeFileSync(path.join(dir, file), JSON.stringify(data, null, 2));
}

function logNotification(message) {
  const logPath = path.join(__dirname, '..', 'notifications.log');
  const log = `[${new Date().toISOString()}] ${message}\n`;
  fs.appendFileSync(logPath, log);
}

// ======= Auth Middleware =======

function authenticateToken(req, res, next) {
  let token;

  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (req.query.token) {
    token = req.query.token;
  }

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}


// ============ Movies & Series ============

app.get('/api/movies', (req, res) => {
  const moviesPath = path.join(__dirname, 'movies.json');
  fs.readFile(moviesPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading movies.json:', err);
      return res.status(500).json({ error: 'Failed to load movies data' });
    }
    try {
      const movies = JSON.parse(data);
      res.json(movies);
    } catch (parseError) {
      console.error('Error parsing movies.json:', parseError);
      res.status(500).json({ error: 'Invalid JSON format in movies.json' });
    }
  });
});

app.get('/api/series', (req, res) => {
  const seriesPath = path.join(__dirname, 'series.json');
  fs.readFile(seriesPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading series.json:', err);
      return res.status(500).json({ error: 'Failed to load series data' });
    }
    try {
      const series = JSON.parse(data);
      res.json(series);
    } catch (parseError) {
      console.error('Error parsing series.json:', parseError);
      res.status(500).json({ error: 'Invalid JSON format in series.json' });
    }
  });
});

// ============ Auth ============

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const admins = readJSON('admins.json');
  const user = admins.find(a => a.username === username && a.password === password);
  if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

  const token = jwt.sign({ username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '4h' });

  const sessions = readJSON('sessions.json');
  sessions.push({ username, ip: req.ip, timestamp: Date.now() });
  writeJSON('sessions.json', sessions);

  user.lastLogin = { timestamp: Date.now(), ip: req.ip };
  writeJSON('admins.json', admins);
  logNotification(`${username} logged in`);

  res.json({ success: true, token, user });
});

app.get('/api/profile', authenticateToken, (req, res) => {
  const admins = readJSON('admins.json');
  const user = admins.find(u => u.username === req.user.username);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// ============ Admin Management (NO GET route) ============

app.post('/api/admins', authenticateToken, (req, res) => {
  const admins = readJSON('admins.json');
  const { username, password, role } = req.body;
  if (admins.find(a => a.username === username)) {
    return res.json({ success: false, error: 'Username already exists' });
  }
  admins.push({ username, password, role, createdAt: new Date().toISOString() });
  writeJSON('admins.json', admins);
  logNotification(`Admin added: ${username}`);
  res.json({ success: true });
});

app.put('/api/admins/:username', authenticateToken, (req, res) => {
  const admins = readJSON('admins.json');
  const index = admins.findIndex(a => a.username === req.params.username);
  if (index === -1) return res.json({ success: false, error: 'Not found' });

  const updates = req.body;

  const current = admins[index];
  const updatedAdmin = {
    ...current,
    username: updates.newUsername || current.username,
    role: updates.role || current.role,
    password: updates.password || current.password,
    createdAt: current.createdAt // <- preserve it
  };

  admins[index] = updatedAdmin;
  writeJSON('admins.json', admins);
  res.json({ success: true });
});


app.delete('/api/admins/:username', authenticateToken, (req, res) => {
  let admins = readJSON('admins.json');
  admins = admins.filter(a => a.username !== req.params.username);
  writeJSON('admins.json', admins);
  logNotification(`Admin deleted: ${req.params.username}`);
  res.json({ success: true });
});

app.get('/api/admins', authenticateToken, (req, res) => {
  const admins = readJSON('admins.json');
  res.json(admins);
});


// ============ Sessions ============

app.get('/api/sessions', authenticateToken, (req, res) => {
  res.json(readJSON('sessions.json'));
});

// ============ Add Movies & Series ============

app.post('/save/movies', authenticateToken, (req, res) => {
  const movies = readJSON('movies.json', 'backend');
  const incoming = req.body;

  if (!incoming.id || !incoming.title) {
    return res.status(400).send("❌ Missing movie ID or title.");
  }

  movies.unshift(incoming);
  writeJSON('movies.json', movies, 'backend');

  logNotification(`Movie added: ${req.body.title} by ${req.body.addedBy || "unknown"}`);
  res.send('✅ Movie saved');
});

app.post('/save/series', authenticateToken, (req, res) => {
  const series = readJSON('series.json', 'backend');
  const incoming = req.body;

  const reordered = { ...incoming, ...series };
  writeJSON('series.json', reordered, 'backend');

  const seriesName = Object.keys(incoming)[0];
  const addedBy = incoming[seriesName].addedBy || "unknown";
  logNotification(`Series - ${seriesName} added by ${addedBy}`);
  res.send('✅ Series saved');
});

// ============== Edit Posts =============

app.put('/update/movie/:id', authenticateToken, (req, res) => {
  let movies = readJSON('movies.json', 'backend');
  const index = movies.findIndex(m => m.id === req.params.id);
  if (index === -1) return res.status(404).send("❌ Movie not found.");

  movies[index] = { ...movies[index], ...req.body };
  writeJSON('movies.json', movies, 'backend');

  logNotification(`Movie updated: ${req.params.id} by ${req.user.username}`);
  res.send("✅ Movie updated successfully.");
});



// ============ Poster Upload ============

const upload = multer({ dest: path.join(__dirname, '..', 'uploads') });

app.post('/upload-poster', upload.single('poster'), authenticateToken, (req, res) => {
  const ext = path.extname(req.file.originalname);
  const destName = `${Date.now()}${ext}`;
  const destPath = path.join(__dirname, '..', 'images', destName);
  fs.renameSync(req.file.path, destPath);
  res.send(`success:${destName}`);
});

// ============ Analytics ============

app.get('/api/stats', authenticateToken, (req, res) => {
  const movies = readJSON('movies.json', 'backend');
  const series = readJSON('series.json', 'backend');
  const admins = readJSON('admins.json');
  const sessions = readJSON('sessions.json');

  const recentLogins = sessions.filter(s =>
    Date.now() - s.timestamp < 7 * 24 * 60 * 60 * 1000
  ).length;

  res.json({
    totalMovies: movies.length,
    totalSeries: Object.keys(series).length,
    totalAdmins: admins.length,
    recentLogins
  });
});

// ============ Notifications ============

app.get('/api/notifications', authenticateToken, (req, res) => {
  const logPath = path.join(__dirname, '..', 'notifications.log');
  if (!fs.existsSync(logPath)) return res.json([]);
  const logs = fs.readFileSync(logPath, 'utf-8')
    .split('\n').filter(Boolean)
    .map(line => {
      const match = line.match(/\[(.*?)\]\s(.+)/);
      return { timestamp: new Date(match[1]).getTime(), message: match[2] };
    });
  res.json(logs);
});

app.delete('/api/notifications/delete', authenticateToken, (req, res) => {
  const { indexes } = req.body;
  if (!Array.isArray(indexes)) return res.status(400).send("❌ Invalid request format");

  const logPath = path.join(__dirname, '..', 'notifications.log');
  if (!fs.existsSync(logPath)) return res.status(404).send("❌ Log file not found");

  const original = fs.readFileSync(logPath, 'utf-8').split('\n').filter(Boolean);

  const filtered = original.filter(line => {
    const match = line.match(/\[(.*?)\]/);
    if (!match) return true; // Keep line if timestamp is missing
    const ts = new Date(match[1]).getTime();
    return !indexes.includes(ts); // Keep line if it's not in delete list
  });

  fs.writeFileSync(logPath, filtered.join('\n') + '\n');
  res.send("✅ Selected notifications deleted.");
});


// ============ Backup ============

app.get('/api/backup/:type', authenticateToken, (req, res) => {
  const type = req.params.type;
  const isBackend = ['movies', 'series'].includes(type);
  const filePath = path.join(isBackend ? BACKEND_DIR : DATA_DIR, `${type}.json`);
  if (!fs.existsSync(filePath)) return res.status(404).send("Not found");
  res.download(filePath);
});

app.get('/api/backup/zip', authenticateToken, (req, res) => {
  res.attachment('backup.zip');
  const zip = archiver('zip');
  zip.pipe(res);

  ['admins.json', 'sessions.json'].forEach(f => zip.file(path.join(DATA_DIR, f), { name: f }));
  ['movies.json', 'series.json'].forEach(f => zip.file(path.join(BACKEND_DIR, f), { name: f }));

  zip.finalize();
});

// ============ Delete Movies & Series ============

function getUserRole(username) {
  const admins = readJSON('admins.json');
  const user = admins.find(a => a.username === username);
  return user ? user.role : "unknown";
}

app.delete('/api/delete/movie', authenticateToken, (req, res) => {
  const { id, deletedBy } = req.body;
  const role = getUserRole(deletedBy);
  if (role !== "owner") return res.status(403).send("❌ Not authorized to delete movies.");

  let movies = readJSON('movies.json', 'backend');
  if (!movies.find(movie => movie.id === id)) return res.send("❌ Movie not found.");

  movies = movies.filter(m => m.id !== id);
  writeJSON('movies.json', movies, 'backend');

  logNotification(`Movie deleted: ${id} by ${deletedBy}`);
  res.send(`✅ Movie '${id}' deleted.`);
});

app.delete('/api/delete/series', authenticateToken, (req, res) => {
  const { id, deletedBy } = req.body;
  const role = getUserRole(deletedBy);
  if (role !== "owner") return res.status(403).send("❌ Not authorized to delete series.");

  let series = readJSON('series.json', 'backend');
  if (!series[id]) return res.send("❌ Series not found.");

  delete series[id];
  writeJSON('series.json', series, 'backend');

  logNotification(`Series deleted: ${id} by ${deletedBy}`);
  res.send(`✅ Series '${id}' deleted.`);
});

// ============ Start Server ============

app.listen(PORT, () => {
  console.log(`✅ MovieMania server running at http://localhost:${PORT}`);
});
