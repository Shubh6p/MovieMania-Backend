const path = require('path');
const fs = require('fs');

const frontendDir = path.join(__dirname, '..', '..', 'MovieMania-Frontend-main');

exports.serveStatic = (req, res, next) => {
  const pagePath = path.join(frontendDir, `${req.params.page}.html`);
  if (fs.existsSync(pagePath)) res.sendFile(pagePath);
  else next();
};

exports.home = (req, res) => {
  res.sendFile(path.join(frontendDir, '/home'));
};
