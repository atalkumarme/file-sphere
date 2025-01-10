//src/services/file.service.js
const File = require('../models/file.model');
const User = require('../models/user.model');
const { getGfs } = require('../config/gridfsUtils');

const fileService = {
    async saveFile(file, userId, folderId) {
        const fileDoc = new File({
            filename: file.filename,
            originalName: file.metadata.originalName,
            encoding: file.metadata.encoding,
            mimetype: file.metadata.mimetype,
            size: file.size,
            owner: userId,
            parent: folderId || null,
            gridFSId: file.id,
        });

        await User.findByIdAndUpdate(userId, { $inc: { storageUsed: file.size } });
        return fileDoc.save();
    },

    async deleteFileById(fileId) {
        await getGfs().delete(fileId);
    },

    async findFileById(fileId) {
        return File.findById(fileId);
    },

    async getDownloadStream(fileId) {
        const file = await this.findFileById(fileId);
        if (!file) throw new Error('File not found');
        return { file, downloadStream: getGfs().openDownloadStream(file.gridFSId) };
    },

    async deleteFile(fileId, userId) {
        const file = await this.findFileById(fileId);
        if (!file) throw new Error('File not found');
        await this.deleteFileById(file.gridFSId);
        await File.findByIdAndDelete(fileId);
        await User.findByIdAndUpdate(userId, { $inc: { storageUsed: -file.size } });
    },

    async listUserFiles(userId, folderId) {
        return File.find({ owner: userId, parent: folderId || null });
    },
};

module.exports = fileService;
