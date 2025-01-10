// src/routes/share.routes.js
const router = require('express').Router();
const shareController = require('../controllers/share.controller');
const auth = require('../middleware/auth');

// Protected routes
router.post('/', auth, shareController.createShare);
router.get('/list', auth, shareController.listShares);
router.patch('/:id', auth, shareController.updateShare);
router.delete('/:id', auth, shareController.deleteShare);

// Public route for accessing shared files
router.post('/:token', shareController.accessShare);

module.exports = router;