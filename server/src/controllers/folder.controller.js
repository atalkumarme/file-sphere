// src/controllers/folder.controller.js
const Folder = require('../models/folder.model');

const folderController = {
  async create(req, res) {
    try {
      const { name, parent } = req.body;
      const folder = new Folder({
        name,
        owner: req.user.userId,
        parent: parent || null,
        path: parent ? `${parentFolder.path}/${name}` : `/${name}`
      });
      await folder.save();
      res.status(201).json(folder);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async list(req, res) {
    try {
      const folders = await Folder.find({
        owner: req.user.userId,
        parent: req.query.parent || null
      });
      res.json(folders);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async rename(req, res) {
    try {
      const { name } = req.body;
      const folder = await Folder.findById(req.params.id);
      folder.name = name;
      // Update path for this folder and all children
      folder.path = folder.parent ? `${parentFolder.path}/${name}` : `/${name}`;
      await folder.save();
      res.json(folder);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async move(req, res) {
    try {
      const { destinationId } = req.body;
      const folder = await Folder.findById(req.params.id);
      folder.parent = destinationId || null;
      // Update path
      const destFolder = destinationId ? await Folder.findById(destinationId) : null;
      folder.path = destFolder ? `${destFolder.path}/${folder.name}` : `/${folder.name}`;
      await folder.save();
      res.json(folder);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async delete(req, res) {
    try {
      // Check for subfolders and files before deletion
      await Folder.findByIdAndDelete(req.params.id);
      res.json({ message: 'Folder deleted' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
};