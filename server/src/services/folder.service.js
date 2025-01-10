// src/services/folder.service.js
const Folder = require('../models/folder.model');
const File = require('../models/file.model');
const mongoose = require('mongoose');

const folderService = {
    async createFolder({ name, parent }, userId) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const folder = new Folder({ name, owner: userId, parent: parent || null });
            await folder.updatePath();
            await folder.save({ session });
            await session.commitTransaction();
            return folder;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    },

    async renameFolder(folderId, newName) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const folder = await Folder.findById(folderId);
            if (!folder) throw new Error('Folder not found');

            folder.name = newName;
            await folder.updatePath();
            await folder.save({ session });

            const folderRegex = new RegExp(`^${folder.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
            await Promise.all([
                Folder.updateMany(
                    { path: folderRegex },
                    { $set: { 'pathArray.$[].name': newName } },
                    { session }
                ),
                File.updateMany(
                    { path: folderRegex },
                    { $set: { path: { $concat: [folder.path, { $substr: ['$path', folder.path.length, -1] }] } } },
                    { session }
                ),
            ]);

            await session.commitTransaction();
            return folder;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    },

    async moveFolder(folderId, destinationId) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const folder = await Folder.findById(folderId);
            if (!folder) throw new Error('Folder not found');

            if (await this.isSubdirectory(folder._id, destinationId)) {
                throw new Error('Cannot move folder to its own subdirectory');
            }

            folder.parent = destinationId || null;
            await folder.updatePath();
            await folder.save({ session });

            const oldPath = folder.path;
            const folderRegex = new RegExp(`^${oldPath}/`);
            await Promise.all([
                Folder.updateMany(
                    { path: folderRegex },
                    { $set: { path: { $concat: [folder.path, { $substr: ['$path', oldPath.length, -1] }] } } },
                    { session }
                ),
                File.updateMany(
                    { path: folderRegex },
                    { $set: { path: { $concat: [folder.path, { $substr: ['$path', oldPath.length, -1] }] } } },
                    { session }
                ),
            ]);

            await session.commitTransaction();
            return folder;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    },

    async deleteFolder(folderId) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const folder = await Folder.findById(folderId);
            if (!folder) throw new Error('Folder not found');

            const folderPath = new RegExp(`^${folder.path}/`);
            await Promise.all([
                Folder.deleteMany({ path: folderPath }, { session }),
                File.deleteMany({ path: folderPath }, { session }),
            ]);

            await Folder.findByIdAndDelete(folderId, { session });
            await session.commitTransaction();
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    },

    async isSubdirectory(sourceId, targetId) {
        if (!targetId) return false;
        if (sourceId.equals(targetId)) return true;

        const target = await Folder.findById(targetId);
        if (!target) return false;

        return this.isSubdirectory(sourceId, target.parent);
    },
};

module.exports = folderService;
