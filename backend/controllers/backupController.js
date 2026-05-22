const Movie = require('../models/Movies');
const Series = require('../models/Series');
const Admin = require('../models/Admins');
const Session = require('../models/Sessions');
const { readNotifications } = require('../utils/logger');
const archiver = require('archiver');

exports.downloadBackup = async (req, res) => {
  try {
    const { type } = req.params;
    let data;
    let filename;

    switch (type) {
      case 'movies':
        data = await Movie.find();
        filename = 'movies.json';
        break;
      case 'series':
        data = await Series.find();
        filename = 'series.json';
        break;
      case 'admins':
        data = await Admin.find();
        filename = 'admins.json';
        break;
      case 'sessions':
        data = await Session.find();
        filename = 'sessions.json';
        break;
      case 'notifications':
        data = readNotifications();
        filename = 'notifications.json';
        break;
      default:
        return res.status(400).json({ error: `Invalid backup type: ${type}` });
    }

    res.setHeader('Content-disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-type', 'application/json');
    res.send(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`❌ Backup download error for ${req.params.type}:`, err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.downloadZipBackup = async (req, res) => {
  try {
    const archive = archiver('zip', { zlib: { level: 9 } });

    res.setHeader('Content-disposition', 'attachment; filename=moviemania_backup.zip');
    res.setHeader('Content-type', 'application/zip');

    archive.on('error', (err) => {
      console.error('❌ Zip archiver error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: err.message });
      }
    });

    archive.pipe(res);

    // Fetch all collection data in parallel
    const [movies, series, admins, sessions] = await Promise.all([
      Movie.find(),
      Series.find(),
      Admin.find(),
      Session.find()
    ]);
    const notifications = readNotifications();

    // Append JSON data directly as virtual files
    archive.append(JSON.stringify(movies, null, 2), { name: 'movies.json' });
    archive.append(JSON.stringify(series, null, 2), { name: 'series.json' });
    archive.append(JSON.stringify(admins, null, 2), { name: 'admins.json' });
    archive.append(JSON.stringify(sessions, null, 2), { name: 'sessions.json' });
    archive.append(JSON.stringify(notifications, null, 2), { name: 'notifications.json' });

    await archive.finalize();
  } catch (err) {
    console.error('❌ Zip backup error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate backup zip.' });
    }
  }
};
