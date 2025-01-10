// controllers/previewController.js
const path = require('path');
const fs = require('fs/promises');
const thumbnailService = require('../services/thumbnail.service');

class PreviewController {
  constructor() {
    this.supportedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    this.supportedPreviewTypes = [
      ...this.supportedImageTypes,
      'application/pdf',
      'text/plain',
      'video/mp4'
    ];
  }

  async handleFilePreview(req, res) {
    const { fileId } = req.params;
    const file = await req.app.locals.gridfs.findOne({ _id: fileId });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (!this.supportedPreviewTypes.includes(file.contentType)) {
      return res.status(400).json({ error: 'File type not supported for preview' });
    }

    // Stream the file directly for preview
    const downloadStream = req.app.locals.gridfs.openDownloadStream(file._id);

    res.set('Content-Type', file.contentType);
    return downloadStream.pipe(res);
  }

  async handleThumbnail(req, res) {
    const { fileId } = req.params;
    const file = await req.app.locals.gridfs.findOne({ _id: fileId });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (!this.supportedImageTypes.includes(file.contentType)) {
      return res.status(400).json({ error: 'Thumbnails only supported for images' });
    }

    try {
      // Check if thumbnail exists
      const thumbnailName = `${fileId}.webp`;
      const thumbnailPath = path.join(thumbnailService.thumbnailDir, thumbnailName);
      
      try {
        await fs.access(thumbnailPath);
        // Thumbnail exists, serve it
        return res.sendFile(thumbnailPath);
      } catch {
        // Thumbnail doesn't exist, generate it
        const chunks = [];
        const downloadStream = req.app.locals.gridfs.openDownloadStream(file._id);
        
        downloadStream.on('data', chunk => chunks.push(chunk));
        downloadStream.on('error', error => {
          console.error('Error downloading file:', error);
          res.status(500).json({ error: 'Error generating thumbnail' });
        });
        downloadStream.on('end', async () => {
          const buffer = Buffer.concat(chunks);
          const thumbnailName = await thumbnailService.generateThumbnail(buffer, file.filename);
          res.sendFile(path.join(thumbnailService.thumbnailDir, thumbnailName));
        });
      }
    } catch (error) {
      console.error('Error handling thumbnail:', error);
      res.status(500).json({ error: 'Error processing thumbnail' });
    }
  }
}

module.exports = new PreviewController();
