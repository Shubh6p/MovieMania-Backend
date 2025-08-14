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
  const { username, password, role } = req.body;
  const exists = await Admin.findOne({ username });
  if (exists) return res.json({ success: false, error: 'Username exists' });
  await new Admin({ username, password, role, createdAt: new Date() }).save();
  logNotification(`Admin added: ${username}`);
  res.json({ success: true });
};

exports.updateAdmin = async (req, res) => {
  const updates = req.body;
  const admin = await Admin.findOneAndUpdate({ username: req.params.username }, updates, { new: true });
  if (!admin) return res.json({ success: false, error: 'Not found' });
  res.json({ success: true });
};

exports.deleteAdmin = async (req, res) => {
  await Admin.deleteOne({ username: req.params.username });
  logNotification(`Admin deleted: ${req.params.username}`);
  res.json({ success: true });
};

exports.listAdmins = async (req, res) => {
  const admins = await Admin.find();
  res.json(admins);
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
