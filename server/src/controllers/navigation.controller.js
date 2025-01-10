// src/controllers/navigation.controller.js
const navigationService = require('../services/navigation.service');

const navigationController = {
    async search(req, res) {
        try {
            const results = await navigationService.search(req.query, req.user.userId);
            res.json(results);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    async list(req, res) {
        try {
            const contents = await navigationService.listContents(req.query, req.user.userId);
            res.json(contents);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    async getBreadcrumb(req, res) {
        try {
            const breadcrumb = await navigationService.getBreadcrumb(req.params.id);
            res.json(breadcrumb);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },
};

module.exports = navigationController;