const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../controllers/adminController');

router.get('/api/profile', auth, admin.profile);
router.post('/api/admins', auth, admin.addAdmin);
router.put('/api/admins/:username', auth, admin.updateAdmin);
router.delete('/api/admins/:username', auth, admin.deleteAdmin);
router.get('/api/admins', auth, admin.listAdmins);
router.post('/api/admin/login', admin.login);

module.exports = router;
