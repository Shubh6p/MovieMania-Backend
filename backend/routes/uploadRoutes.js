const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../controllers/uploadController');

router.post('/upload-poster', auth, upload.singlePoster);

module.exports = router;
