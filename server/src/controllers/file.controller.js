//src/controllers/file.controller.js
const fileService = require('../services/file.service');

const fileController = {
    async uploadFile(req, res) {
        try {
            if (!req.file) throw new Error('No file uploaded');

            const fileDoc = await fileService.saveFile(req.file, req.user.userId, req.body.folderId);
            res.status(201).json(fileDoc);
        } catch (error) {
            if (req.file?.id) await fileService.deleteFileById(req.file.id);
            res.status(400).json({ error: error.message });
        }
    },

    async downloadFile(req, res) {
        try {
            const { file, downloadStream } = await fileService.getDownloadStream(req.params.id);
            res.set('Content-Type', file.mimetype);
            res.set('Content-Disposition', `attachment; filename="${file.originalName}"`);
            downloadStream.pipe(res);
        } catch (error) {
            res.status(404).json({ error: error.message });
        }
    },

    async deleteFile(req, res) {
        try {
            await fileService.deleteFile(req.params.id, req.user.userId);
            res.json({ message: 'File deleted' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    async listFiles(req, res) {
        try {
            const files = await fileService.listUserFiles(req.user.userId, req.query.folderId);
            res.json(files);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },
};

module.exports = fileController;
