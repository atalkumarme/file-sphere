// src/controllers/folder.controller.js
const folderService = require('../services/folder.service');

const folderController = {
    async create(req, res) {
        try {
            const folder = await folderService.createFolder(req.body, req.user.userId);
            res.status(201).json(folder);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    async rename(req, res) {
        try {
            const folder = await folderService.renameFolder(req.params.id, req.body.name);
            res.json(folder);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    async move(req, res) {
        try {
            const folder = await folderService.moveFolder(req.params.id, req.body.destinationId);
            res.json(folder);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    async delete(req, res) {
        try {
            await folderService.deleteFolder(req.params.id);
            res.json({ message: 'Folder and contents deleted successfully' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },
};

module.exports = folderController;