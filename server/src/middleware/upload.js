// src/middleware/upload.js
const multer = require('multer');
const { storage } = require('../config/gridfs');

const FILE_SIZE_LIMIT = 100 * 1024 * 1024; // 100MB

const upload = multer({
  storage,
  limits: {
    fileSize: FILE_SIZE_LIMIT,
  },
  fileFilter: (req, file, cb) => {
    // Add file type validation if needed
    cb(null, true);
  }
}).single('file');

// Wrap multer middleware to handle errors
const uploadMiddleware = (req, res, next) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: 'File upload error: ' + err.message });
    } else if (err) {
      return res.status(500).json({ error: 'Server error during upload' });
    }
    next();
  });
};

module.exports = uploadMiddleware;