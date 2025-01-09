// src/controllers/navigation.controller.js
const File = require('../models/file.model');
const Folder = require('../models/folder.model');

const navigationController = {
  // Search
  async search(req, res) {
    try {
      const { query, type } = req.query;
      const searchRegex = new RegExp(query, 'i');

      const results = {
        folders: [],
        files: []
      };

      if (!type || type === 'folder') {
        results.folders = await Folder.find({
          owner: req.user.userId,
          name: searchRegex
        }).select('name path level createdAt');
      }

      if (!type || type === 'file') {
        results.files = await File.find({
          owner: req.user.userId,
          originalName: searchRegex
        }).select('originalName path mimetype size createdAt');
      }

      res.json(results);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
  // List contents of a folder
  async list(req, res) {
    try {
      const { parent = null, sort = 'name', order = 'asc' } = req.query;
      const sortOption = { [sort]: order === 'asc' ? 1 : -1 };

      const [folders, files] = await Promise.all([
        Folder.find({
          owner: req.user.userId,
          parent: parent || null
        }).sort(sortOption),
        File.find({
          owner: req.user.userId,
          parent: parent || null
        }).sort(sortOption)
      ]);

      res.json({
        folders,
        files,
        total: folders.length + files.length
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
  
  // Get breadcrumb
  async getBreadcrumb(req, res) {
    try {
      const folder = await Folder.findById(req.params.id)
        .populate('pathArray._id');
      
      if (!folder) {
        throw new Error('Folder not found');
      }

      const breadcrumb = [
        { _id: null, name: 'Root' },
        ...folder.pathArray,
        { _id: folder._id, name: folder.name }
      ];

      res.json(breadcrumb);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
  
};
module.exports = navigationController;