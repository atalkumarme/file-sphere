// src/controllers/preview.controller.js
const previewService = require('../services/preview.service');

class PreviewController {
    constructor() {
        this.supportedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        this.supportedPreviewTypes = [
            ...this.supportedImageTypes,
            'application/pdf',
            'text/plain',
            'video/mp4',
        ];
    }

    async handleFilePreview(req, res) {
        try {
            const { fileId } = req.params;
            const { file, downloadStream } = await previewService.getFileForPreview(
                fileId,
                req.app.locals.gridfs,
                this.supportedPreviewTypes
            );

            res.set('Content-Type', file.contentType);
            downloadStream.pipe(res);
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message });
        }
    }

    async handleThumbnail(req, res) {
        try {
            const { fileId } = req.params;
            const { file, thumbnailPath } = await previewService.getOrGenerateThumbnail(
                fileId,
                req.app.locals.gridfs,
                this.supportedImageTypes
            );

            res.sendFile(thumbnailPath);
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message });
        }
    }
}

module.exports = new PreviewController();
