// src/controllers/share.controller.js
const shareService = require('../services/share.service');

const shareController = {
    async createShare(req, res) {
        try {
            const { fileId, password, expiresIn, maxAccess } = req.body;
            const share = await shareService.createShare(req.user.userId, fileId, password, expiresIn, maxAccess);
            res.status(201).json({
                shareUrl: `${process.env.BASE_URL}/api/share/${share.token}`,
                share,
            });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    async accessShare(req, res) {
        try {
            const { token } = req.params;
            const { password } = req.body;
            const { file, downloadStream } = await shareService.accessShare(token, password);
            res.set('Content-Type', file.mimetype);
            res.set('Content-Disposition', `attachment; filename="${file.originalName}"`);
            downloadStream.pipe(res);
        } catch (error) {
            res.status(error.status || 400).json({ error: error.message });
        }
    },

    async listShares(req, res) {
        try {
            const shares = await shareService.listShares(req.user.userId);
            res.json(shares);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    async updateShare(req, res) {
        try {
            const updatedShare = await shareService.updateShare(req.params.id, req.user.userId, req.body);
            res.json(updatedShare);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    async deleteShare(req, res) {
        try {
            await shareService.deleteShare(req.params.id, req.user.userId);
            res.json({ message: 'Share deleted successfully' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },
};

module.exports = shareController;