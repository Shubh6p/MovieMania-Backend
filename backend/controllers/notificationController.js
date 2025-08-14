const { readNotifications, deleteNotificationsByTimestamps } = require('../utils/logger');

exports.list = (req, res) => {
  const logs = readNotifications();
  res.json(logs);
};

exports.delete = (req, res) => {
  const { indexes } = req.body;
  deleteNotificationsByTimestamps(indexes || []);
  res.send('✅ Selected notifications deleted.');
};
