const Session = require('../models/Sessions');

exports.list = async (req, res) => {
  const sessions = await Session.find();
  res.json(sessions);
};
