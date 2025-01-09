// src/controllers/folder.controller.js
const Folder = require('../models/folder.model');
const File = require('../models/file.model');
const mongoose = require('mongoose');

const folderController = {
  // Create folder
  async create(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { name, parent } = req.body;

      // Create folder
      const folder = new Folder({
        name,
        owner: req.user.userId,
        parent: parent || null
      });

      // Update path
      await folder.updatePath();
      await folder.save({ session });

      await session.commitTransaction();
      res.status(201).json(folder);
    } catch (error) {
      await session.abortTransaction();
      res.status(400).json({ error: error.message });
    } finally {
      session.endSession();
    }
  },


  // Rename folder
  async rename(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { name } = req.body;
      const folder = await Folder.findById(req.params.id);
      
      if (!folder) {
        throw new Error('Folder not found');
      }

      folder.name = name;
      await folder.updatePath();
      await folder.save({ session });

      // Update paths of all subfolders and files
      const folderRegex = new RegExp(`^${folder.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
      
      await Promise.all([
        // Update subfolders
        Folder.updateMany(
          { path: folderRegex },
          { $set: { 'pathArray.$[].name': name } },
          { session }
        ),
        // Update files
        File.updateMany(
          { path: folderRegex },
          { $set: { path: { $concat: [folder.path, { $substr: ['$path', folder.path.length, -1] }] } } },
          { session }
        )
      ]);

      await session.commitTransaction();
      res.json(folder);
    } catch (error) {
      await session.abortTransaction();
      res.status(400).json({ error: error.message });
    } finally {
      session.endSession();
    }
  },

  // Move folder
  async move(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { destinationId } = req.body;
      const folder = await Folder.findById(req.params.id);
      
      if (!folder) {
        throw new Error('Folder not found');
      }

      // Prevent moving to own subdirectory
      if (await this.isSubdirectory(folder._id, destinationId)) {
        throw new Error('Cannot move folder to its own subdirectory');
      }

      folder.parent = destinationId || null;
      await folder.updatePath();
      await folder.save({ session });

      // Update all children
      const oldPath = folder.path;
      const folderRegex = new RegExp(`^${oldPath}/`);
      
      await Promise.all([
        // Update subfolders
        Folder.updateMany(
          { path: folderRegex },
          { $set: { path: { $concat: [folder.path, { $substr: ['$path', oldPath.length, -1] }] } } },
          { session }
        ),
        // Update files
        File.updateMany(
          { path: folderRegex },
          { $set: { path: { $concat: [folder.path, { $substr: ['$path', oldPath.length, -1] }] } } },
          { session }
        )
      ]);

      await session.commitTransaction();
      res.json(folder);
    } catch (error) {
      await session.abortTransaction();
      res.status(400).json({ error: error.message });
    } finally {
      session.endSession();
    }
  },

  // Helper method to check if target is subdirectory
  async isSubdirectory(sourceId, targetId) {
    if (!targetId) return false;
    if (sourceId.equals(targetId)) return true;

    const target = await Folder.findById(targetId);
    if (!target) return false;

    return this.isSubdirectory(sourceId, target.parent);
  },

  // Delete folder
  async delete(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const folder = await Folder.findById(req.params.id);
      if (!folder) {
        throw new Error('Folder not found');
      }

      const folderPath = new RegExp(`^${folder.path}/`);

      // Delete all subfolders and files
      await Promise.all([
        Folder.deleteMany({ path: folderPath }, { session }),
        File.deleteMany({ path: folderPath }, { session })
      ]);

      // Delete the folder itself
      await Folder.findByIdAndDelete(req.params.id, { session });

      await session.commitTransaction();
      res.json({ message: 'Folder and contents deleted successfully' });
    } catch (error) {
      await session.abortTransaction();
      res.status(400).json({ error: error.message });
    } finally {
      session.endSession();
    }
  },

  
};

module.exports = folderController;