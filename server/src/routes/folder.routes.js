// src/routes/folder.routes.js
const router = require('express').Router();
const folderController = require('../controllers/folder.controller');
const navigationController = require('../controllers/navigation.controller');
const auth = require('../middleware/auth');

// Folder operations
router.post('/', auth, folderController.create);
router.patch('/:id/rename', auth, folderController.rename);
router.patch('/:id/move', auth, folderController.move);
router.delete('/:id', auth, folderController.delete);

module.exports = router;