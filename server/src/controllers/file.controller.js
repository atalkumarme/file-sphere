// src/controllers/file.controller.js
const File = require('../models/file.model');
const User = require('../models/user.model');
const { gfs } = require('../config/gridfs');

const fileController = {
  // Upload file
  async uploadFile(req, res) {
    try {
      const { file } = req;
      const fileDoc = new File({
        filename: file.filename,
        originalName: file.originalname,
        encoding: file.encoding,
        mimetype: file.mimetype,
        size: file.size,
        owner: req.user.userId,
        gridFSId: file.id
      });

      // Update user storage
      await User.findByIdAndUpdate(req.user.userId, {
        $inc: { storageUsed: file.size }
      });

      await fileDoc.save();
      res.status(201).json(fileDoc);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Download file
  async downloadFile(req, res) {
    try {
      const file = await File.findById(req.params.id);
      if (!file) throw new Error('File not found');

      const downloadStream = gfs.openDownloadStream(file.gridFSId);
      res.set('Content-Type', file.mimetype);
      res.set('Content-Disposition', `attachment; filename="${file.originalName}"`);
      downloadStream.pipe(res);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },

  // Delete file
  async deleteFile(req, res) {
    try {
      const file = await File.findById(req.params.id);
      if (!file) throw new Error('File not found');

      await gfs.delete(file.gridFSId);
      await File.findByIdAndDelete(req.params.id);
      
      // Update user storage
      await User.findByIdAndUpdate(req.user.userId, {
        $inc: { storageUsed: -file.size }
      });

      res.json({ message: 'File deleted' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // List user files
  async listFiles(req, res) {
    try {
      const files = await File.find({ 
        owner: req.user.userId,
        parent: req.query.folderId || null 
      });
      res.json(files);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
};

module.exports = fileController;