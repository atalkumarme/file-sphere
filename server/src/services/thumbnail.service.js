// services/thumbnailService.js
const sharp = require('sharp');
const path = require('path');
const fs = require('fs/promises');
const { createHash } = require('crypto');

class ThumbnailService {
  constructor() {
    this.thumbnailDir = path.join(__dirname, '../public/thumbnails');
    this.maxThumbnails = 100;
    this.thumbnailSize = 200; // pixels
    this.init();
  }

  async init() {
    try {
      await fs.mkdir(this.thumbnailDir, { recursive: true });
    } catch (error) {
      console.error('Error creating thumbnail directory:', error);
    }
  }

  generateThumbnailName(originalName) {
    const hash = createHash('md5').update(originalName + Date.now()).digest('hex');
    return `${hash}.webp`;
  }

  async generateThumbnail(imageBuffer, originalName) {
    const thumbnailName = this.generateThumbnailName(originalName);
    const thumbnailPath = path.join(this.thumbnailDir, thumbnailName);

    try {
      await sharp(imageBuffer)
        .resize(this.thumbnailSize, this.thumbnailSize, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({ quality: 80 })
        .toFile(thumbnailPath);

      await this.cleanupOldThumbnails();
      
      return thumbnailName;
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      throw new Error('Thumbnail generation failed');
    }
  }

  async cleanupOldThumbnails() {
    try {
      const files = await fs.readdir(this.thumbnailDir);
      if (files.length > this.maxThumbnails) {
        const filePaths = files.map(file => ({
          name: file,
          path: path.join(this.thumbnailDir, file)
        }));

        // Get file stats and sort by creation time
        const fileStats = await Promise.all(
          filePaths.map(async (file) => ({
            ...file,
            stat: await fs.stat(file.path)
          }))
        );

        // Sort by creation time and delete oldest files
        const oldestFiles = fileStats
          .sort((a, b) => a.stat.ctimeMs - b.stat.ctimeMs)
          .slice(0, files.length - this.maxThumbnails);

        await Promise.all(
          oldestFiles.map(file => fs.unlink(file.path))
        );
      }
    } catch (error) {
      console.error('Error cleaning up thumbnails:', error);
    }
  }
}

module.exports = new ThumbnailService();
