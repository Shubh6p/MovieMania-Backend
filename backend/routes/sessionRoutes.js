const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const session = require('../controllers/sessionController');

router.get('/api/sessions', auth, session.list);

module.exports = router;
