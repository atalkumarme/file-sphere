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
});

module.exports = upload;