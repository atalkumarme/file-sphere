// src/routes/file.routes.js
const router = require('express').Router();
const fileController = require('../controllers/file.controller');
const auth = require('../middleware/auth');
const uploadMiddleware = require('../middleware/upload');
const previewController = require('../controllers/preview.controller');

router.post('/upload', auth, uploadMiddleware, fileController.uploadFile);
router.get('/download/:id', auth, fileController.downloadFile);
router.delete('/:id', auth, fileController.deleteFile);
router.get('/', auth, fileController.listFiles);

// Route for file previews
router.get('/:fileId/preview', 
    auth, 
    previewController.handleFilePreview.bind(previewController)
  );
  
  // Route for thumbnails
  router.get('/:fileId/thumbnail', 
    auth, 
    previewController.handleThumbnail.bind(previewController)
  );
module.exports = router;