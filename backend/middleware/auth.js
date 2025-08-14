const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'yourSuperSecretKey';

module.exports = function authenticateToken(req, res, next) {
  const token = (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]) || req.query.token;
  if (!token) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};
