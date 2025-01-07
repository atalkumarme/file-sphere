// src/routes/folder.routes.js
const router = require('express').Router();
const folderController = require('../controllers/folder.controller');
const auth = require('../middleware/auth');

router.post('/', auth, folderController.create);
router.get('/', auth, folderController.list);
router.delete('/:id', auth, folderController.delete);
router.patch('/:id/rename', auth, folderController.rename);
router.patch('/:id/move', auth, folderController.move);

module.exports = router;