// src/routes/navigation.routes.js
const router = require('express').Router();
const navigationController = require('../controllers/navigation.controller');
const auth = require('../middleware/auth');

router.get('/list', auth, navigationController.list);
router.get('/search', auth, navigationController.search);
router.get('/breadcrumb/:id', auth, navigationController.getBreadcrumb);

module.exports = router;