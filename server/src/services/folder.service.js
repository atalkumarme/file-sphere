// src/services/folder.service.js
const Folder = require('../models/folder.model');
const File = require('../models/file.model');
const mongoose = require('mongoose');

const folderService = {
    async createFolder({ name, parent }, userId) {
        // const session = await mongoose.startSession();
        // session.startTransaction();

        try {
            const folder = new Folder({ name, owner: userId, parent: parent || null });
            await folder.updatePath();
            await folder.save();
            // await session.commitTransaction();
            return folder;
        } catch (error) {
            // await session.abortTransaction();
            throw error;
        }
        //  finally {
        //     session.endSession();
        // }
    },

    // Replace renameFolder method
    // Replace renameFolder method
    async renameFolder(folderId, newName) {
        try {
            const folder = await Folder.findById(folderId);
            if (!folder) throw new Error('Folder not found');

            const oldPath = folder.path;
            folder.name = newName;
            await folder.updatePath();
            await folder.save();

            // Find all affected folders and files
            const folderRegex = new RegExp(`^${oldPath}/`);
            const [subFolders, files] = await Promise.all([
                Folder.find({ path: folderRegex }),
                File.find({ path: folderRegex })
            ]);

            // Update paths
            await Promise.all([
                ...subFolders.map(subFolder => {
                    const newPath = folder.path + subFolder.path.slice(oldPath.length);
                    return Folder.updateOne(
                        { _id: subFolder._id },
                        { path: newPath }
                    );
                }),
                ...files.map(file => {
                    const newPath = folder.path + file.path.slice(oldPath.length);
                    return File.updateOne(
                        { _id: file._id },
                        { path: newPath }
                    );
                })
            ]);

            return folder;
        } catch (error) {
            throw error;
        }
    },
    // Replace moveFolder method
    async moveFolder(folderId, destinationId) {
        try {
            const folder = await Folder.findById(folderId);
            if (!folder) throw new Error('Folder not found');

            if (await this.isSubdirectory(folder._id, destinationId)) {
                throw new Error('Cannot move folder to its own subdirectory');
            }

            const oldPath = folder.path;
            folder.parent = destinationId || null;
            await folder.updatePath();
            await folder.save();

            // Find all affected folders and files
            const folderRegex = new RegExp(`^${oldPath}/`);
            const [subFolders, files] = await Promise.all([
                Folder.find({ path: folderRegex }),
                File.find({ path: folderRegex })
            ]);

            // Update paths
            await Promise.all([
                ...subFolders.map(subFolder => {
                    const newPath = folder.path + subFolder.path.slice(oldPath.length);
                    return Folder.updateOne(
                        { _id: subFolder._id },
                        { path: newPath }
                    );
                }),
                ...files.map(file => {
                    const newPath = folder.path + file.path.slice(oldPath.length);
                    return File.updateOne(
                        { _id: file._id },
                        { path: newPath }
                    );
                })
            ]);

            return folder;
        } catch (error) {
            throw error;
        }
    },
    // Replace deleteFolder method
    async deleteFolder(folderId) {
        try {
            const folder = await Folder.findById(folderId);
            if (!folder) throw new Error('Folder not found');

            const folderPath = new RegExp(`^${folder.path}/`);
            await Promise.all([
                Folder.deleteMany({ path: folderPath }),
                File.deleteMany({ path: folderPath }),
                Folder.findByIdAndDelete(folderId)
            ]);
        } catch (error) {
            throw error;
        }
    },
    async isSubdirectory(sourceId, targetId) {
        if (!targetId) return false; // If no targetId is provided, it's not a subdirectory.
        if (sourceId.equals(targetId)) return false; // A folder cannot be a subdirectory of itself.
    
        let currentFolder = await Folder.findById(targetId); // Start with the target folder.
    
        while (currentFolder && currentFolder.parent) {
            if (currentFolder.parent.equals(sourceId)) {
                return true; // Found the source folder in the ancestry chain.
            }
            currentFolder = await Folder.findById(currentFolder.parent); // Move up the chain.
        }
    
        return false; // Reached the root without finding the source folder.
    }
    
    
};

module.exports = folderService;
