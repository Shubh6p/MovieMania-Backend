const Admin = require('../models/Admins');
const Session = require('../models/Sessions');
const jwt = require('jsonwebtoken');
const { logNotification } = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'yourSuperSecretKey';

exports.profile = async (req, res) => {
  const admin = await Admin.findOne({ username: req.user.username });
  if (!admin) return res.status(404).json({ error: 'User not found' });
  res.json(admin);
};

exports.addAdmin = async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const exists = await Admin.findOne({ username });
    if (exists) return res.json({ success: false, error: 'Username exists' });
    await new Admin({ username, password, role, createdAt: new Date() }).save();
    logNotification(`Admin added: ${username}`);
    res.json({ success: true });
  } catch (e) {
    console.error('❌ Add admin error:', e);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

exports.updateAdmin = async (req, res) => {
  try {
    const { username, password, role, newUsername } = req.body;
    const updates = {};
    if (newUsername) updates.username = newUsername;
    if (password) updates.password = password; // Raw text password matching original design
    if (role) updates.role = role;

    const admin = await Admin.findOneAndUpdate(
      { username: req.params.username },
      { $set: updates },
      { new: true }
    );
    if (!admin) return res.json({ success: false, error: 'Not found' });
    res.json({ success: true });
  } catch (e) {
    console.error('❌ Update admin error:', e);
    if (e.code === 11000) {
      return res.json({ success: false, error: 'Username already exists' });
    }
    res.json({ success: false, error: 'Internal server error' });
  }
};

exports.deleteAdmin = async (req, res) => {
  try {
    await Admin.deleteOne({ username: req.params.username });
    logNotification(`Admin deleted: ${req.params.username}`);
    res.json({ success: true });
  } catch (e) {
    console.error('❌ Delete admin error:', e);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

exports.listAdmins = async (req, res) => {
  try {
    const admins = await Admin.find();
    res.json(admins);
  } catch (e) {
    console.error('❌ List admins error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username, password });
    if (!admin) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '2h' });
    await new Session({ token }).save();

    res.json({
      success: true,
      token,
      user: { username: admin.username, role: admin.role }
    });
  } catch (e) {
    console.error('❌ Internal login error:', e);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
