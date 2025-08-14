const multer = require('multer');
const { storage } = require('../config/cloudinary');

const upload = multer({ storage });

exports.singlePoster = [
  upload.single('poster'),
  (req, res) => {
    try {
      if (!req.file || !req.file.path) {
        return res.status(400).send('Error: No file uploaded.');
      }
      const imageUrl = req.file.path;
      if (!imageUrl.startsWith('http')) {
        return res.status(500).send('Error: Invalid Cloudinary URL.');
      }
      res.send(`success:${imageUrl}`);
    } catch (err) {
      console.error('❌ Upload error:', err);
      res.status(500).send('Internal server error.');
    }
  }
];
