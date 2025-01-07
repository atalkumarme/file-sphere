// src/controllers/search.controller.js
const File = require('../models/file.model');
const Folder = require('../models/folder.model');

const searchController = {
  async search(req, res) {
    try {
      const { query } = req.query;
      const regex = new RegExp(query, 'i');

      const [files, folders] = await Promise.all([
        File.find({
          owner: req.user.userId,
          $or: [
            { originalName: regex },
            { mimetype: regex }
          ]
        }),
        Folder.find({
          owner: req.user.userId,
          name: regex
        })
      ]);

      res.json({ files, folders });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
};