// src/routes/file.routes.js
const router = require('express').Router();
const fileController = require('../controllers/file.controller');
const auth = require('../middleware/auth');
const uploadMiddleware = require('../middleware/upload');

router.post('/upload', auth, uploadMiddleware, fileController.uploadFile);
router.get('/download/:id', auth, fileController.downloadFile);
router.delete('/:id', auth, fileController.deleteFile);
router.get('/', auth, fileController.listFiles);

module.exports = router;