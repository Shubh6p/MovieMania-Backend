const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const backup = require('../controllers/backupController');

// All backup endpoints are secured by authentication (supporting header or query token)
router.get('/api/backup/zip', auth, backup.downloadZipBackup);
router.get('/api/backup/:type', auth, backup.downloadBackup);

module.exports = router;
