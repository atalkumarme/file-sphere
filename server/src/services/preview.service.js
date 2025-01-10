// src/services/preview.service.js
const path = require('path');
const fs = require('fs/promises');
const thumbnailService = require('../services/thumbnail.service');

const previewService = {
    async getFileForPreview(fileId, gridfs, supportedPreviewTypes) {
        const file = await gridfs.findOne({ _id: fileId });
        if (!file) {
            throw { status: 404, message: 'File not found' };
        }

        if (!supportedPreviewTypes.includes(file.contentType)) {
            throw { status: 400, message: 'File type not supported for preview' };
        }

        const downloadStream = gridfs.openDownloadStream(file._id);
        return { file, downloadStream };
    },

    async getOrGenerateThumbnail(fileId, gridfs, supportedImageTypes) {
        const file = await gridfs.findOne({ _id: fileId });
        if (!file) {
            throw { status: 404, message: 'File not found' };
        }

        if (!supportedImageTypes.includes(file.contentType)) {
            throw { status: 400, message: 'Thumbnails only supported for images' };
        }

        const thumbnailName = `${fileId}.webp`;
        const thumbnailPath = path.join(thumbnailService.thumbnailDir, thumbnailName);

        try {
            await fs.access(thumbnailPath);
            // Thumbnail exists
            return { file, thumbnailPath };
        } catch {
            // Thumbnail doesn't exist, generate it
            const chunks = [];
            const downloadStream = gridfs.openDownloadStream(file._id);

            await new Promise((resolve, reject) => {
                downloadStream.on('data', chunk => chunks.push(chunk));
                downloadStream.on('error', reject);
                downloadStream.on('end', resolve);
            });

            const buffer = Buffer.concat(chunks);
            await thumbnailService.generateThumbnail(buffer, file.filename);
            return { file, thumbnailPath };
        }
    },
};

module.exports = previewService;
