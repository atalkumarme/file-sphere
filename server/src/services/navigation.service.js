// src/services/navigation.service.js
const File = require('../models/file.model');
const Folder = require('../models/folder.model');

const navigationService = {
    async search({ query, type }, userId) {
        const searchRegex = new RegExp(query, 'i');
        const results = { folders: [], files: [] };

        if (!type || type === 'folder') {
            results.folders = await Folder.find({
                owner: userId,
                name: searchRegex,
            }).select('name path level createdAt');
        }

        if (!type || type === 'file') {
            results.files = await File.find({
                owner: userId,
                originalName: searchRegex,
            }).select('originalName path mimetype size createdAt');
        }

        return results;
    },

    async listContents({ parent = null, sort = 'name', order = 'asc' }, userId) {
        const sortOption = { [sort]: order === 'asc' ? 1 : -1 };

        const [folders, files] = await Promise.all([
            Folder.find({ owner: userId, parent: parent || null }).sort(sortOption),
            File.find({ owner: userId, parent: parent || null }).sort(sortOption),
        ]);

        return {
            folders,
            files,
            total: folders.length + files.length,
        };
    },

    async getBreadcrumb(folderId) {
        const folder = await Folder.findById(folderId).populate('pathArray._id');
        if (!folder) {
            throw new Error('Folder not found');
        }

        return [
            { _id: null, name: 'Root' },
            ...folder.pathArray,
            { _id: folder._id, name: folder.name },
        ];
    },
};

module.exports = navigationService;