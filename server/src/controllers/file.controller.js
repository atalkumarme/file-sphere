// src/controllers/file.controller.js
const File = require('../models/file.model');
const User = require('../models/user.model');
const { getGfs } = require('../config/gridfs');

const fileController = {
    async uploadFile(req, res) {
        try {
            if (!req.file) {
                throw new Error('No file uploaded');
            }

            const fileDoc = new File({
                filename: req.file.filename,
                originalName: req.file.metadata.originalName,
                encoding: req.file.metadata.encoding,
                mimetype: req.file.metadata.mimetype,
                size: req.file.size,
                owner: req.user.userId,
                parent: req.body.folderId || null,
                gridFSId: req.file.id
            });

            await User.findByIdAndUpdate(req.user.userId, {
                $inc: { storageUsed: req.file.size }
            });

            await fileDoc.save();
            res.status(201).json(fileDoc);
        } catch (error) {
            // if (req.file && req.file.id) {
            //     try {
            //         await getGfs().delete(req.file.id);
            //     } catch (deleteError) {
            //         console.error('Error deleting file:', deleteError);
            //     }
            // }
            res.status(400).json({ error: error.message });
        }
    },

    async downloadFile(req, res) {
        try {
            const file = await File.findById(req.params.id);
            if (!file) throw new Error('File not found');

            const downloadStream = getGfs().openDownloadStream(file.gridFSId);
            res.set('Content-Type', file.mimetype);
            res.set('Content-Disposition', `attachment; filename="${file.originalName}"`);
            downloadStream.pipe(res);
        } catch (error) {
            res.status(404).json({ error: error.message });
        }
    },

    async deleteFile(req, res) {
        try {
            const file = await File.findById(req.params.id);
            if (!file) throw new Error('File not found');

            await getGfs().delete(file.gridFSId);
            await File.findByIdAndDelete(req.params.id);
            
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