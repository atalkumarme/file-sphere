// src/controllers/share.controller.js
const Share = require('../models/share.model');
const File = require('../models/file.model');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { getGfs } = require('../config/gridfs');

const shareController = {
  // Create share link
  async createShare(req, res) {
    try {
      const { fileId, password, expiresIn, maxAccess } = req.body;

      // Verify file exists and user owns it
      const file = await File.findOne({
        _id: fileId,
        owner: req.user.userId
      });

      if (!file) {
        throw new Error('File not found');
      }

      // Generate unique token
      const token = crypto.randomBytes(32).toString('hex');

      // Hash password if provided
      let hashedPassword = null;
      if (password) {
        hashedPassword = await bcrypt.hash(password, 10);
      }

      // Calculate expiration
      let expiresAt = null;
      if (expiresIn) {
        expiresAt = new Date(Date.now() + expiresIn * 1000);
      }

      const share = new Share({
        file: fileId,
        owner: req.user.userId,
        token,
        password: hashedPassword,
        expiresAt,
        maxAccess: maxAccess || null
      });

      await share.save();

      res.status(201).json({
        shareUrl: `${process.env.BASE_URL}/api/share/${token}`,
        share
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Access shared file
  async accessShare(req, res) {
    try {
      const { token } = req.params;
      const { password } = req.body;

      const share = await Share.findOne({ token, isActive: true })
        .populate('file');

      if (!share) {
        throw new Error('Share link not found or expired');
      }

      // Check expiration
      if (share.expiresAt && share.expiresAt < new Date()) {
        throw new Error('Share link has expired');
      }

      // Check max access
      if (share.maxAccess && share.accessCount >= share.maxAccess) {
        throw new Error('Maximum access limit reached');
      }

      // Verify password if set
      if (share.password) {
        if (!password) {
          return res.status(401).json({ 
            requiresPassword: true,
            message: 'Password required'
          });
        }
        
        const isValid = await bcrypt.compare(password, share.password);
        if (!isValid) {
          throw new Error('Invalid password');
        }
      }

      // Increment access count
      share.accessCount += 1;
      await share.save();

      // Stream file
      const downloadStream = getGfs().openDownloadStream(share.file.gridFSId);
      res.set('Content-Type', share.file.mimetype);
      res.set('Content-Disposition', `attachment; filename="${share.file.originalName}"`);
      downloadStream.pipe(res);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // List user's shared files
  async listShares(req, res) {
    try {
      const shares = await Share.find({ owner: req.user.userId })
        .populate('file', 'originalName mimetype size')
        .sort('-createdAt');

      res.json(shares);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Update share settings
  async updateShare(req, res) {
    try {
      const { password, expiresIn, maxAccess, isActive } = req.body;
      const share = await Share.findOne({
        _id: req.params.id,
        owner: req.user.userId
      });

      if (!share) {
        throw new Error('Share not found');
      }

      // Update password if provided
      if (password !== undefined) {
        share.password = password ? await bcrypt.hash(password, 10) : null;
      }

      // Update expiration
      if (expiresIn !== undefined) {
        share.expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;
      }

      // Update max access
      if (maxAccess !== undefined) {
        share.maxAccess = maxAccess || null;
      }

      // Update active status
      if (isActive !== undefined) {
        share.isActive = isActive;
      }

      await share.save();
      res.json(share);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Delete share
  async deleteShare(req, res) {
    try {
      const result = await Share.findOneAndDelete({
        _id: req.params.id,
        owner: req.user.userId
      });

      if (!result) {
        throw new Error('Share not found');
      }

      res.json({ message: 'Share deleted successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
};

module.exports = shareController;