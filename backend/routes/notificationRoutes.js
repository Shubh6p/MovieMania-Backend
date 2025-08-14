const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const n = require('../controllers/notificationController');

router.get('/api/notifications', auth, n.list);
router.delete('/api/notifications/delete', auth, n.delete);

module.exports = router;
