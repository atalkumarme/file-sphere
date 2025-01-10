// src/services/share.service.js
const Share = require('../models/share.model');
const File = require('../models/file.model');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { getGfs } = require('../config/gridfsUtils');

const shareService = {
    async createShare(userId, fileId, password, expiresIn, maxAccess) {
        const file = await File.findOne({ _id: fileId, owner: userId });
        if (!file) throw new Error('File not found');

        const token = crypto.randomBytes(32).toString('hex');
        const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
        const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;

        const share = new Share({
            file: fileId,
            owner: userId,
            token,
            password: hashedPassword,
            expiresAt,
            maxAccess: maxAccess || null,
        });

        return await share.save();
    },

    async accessShare(token, password) {
        const share = await Share.findOne({ token, isActive: true }).populate('file');
        if (!share) throw { status: 404, message: 'Share link not found or expired' };

        if (share.expiresAt && share.expiresAt < new Date()) throw { status: 400, message: 'Share link has expired' };
        if (share.maxAccess && share.accessCount >= share.maxAccess) throw { status: 400, message: 'Maximum access limit reached' };

        if (share.password) {
            if (!password) throw { status: 401, message: 'Password required', requiresPassword: true };
            const isValid = await bcrypt.compare(password, share.password);
            if (!isValid) throw { status: 401, message: 'Invalid password' };
        }

        share.accessCount += 1;
        await share.save();

        const downloadStream = getGfs().openDownloadStream(share.file.gridFSId);
        return { file: share.file, downloadStream };
    },

    async listShares(userId) {
        return await Share.find({ owner: userId })
            .populate('file', 'originalName mimetype size')
            .sort('-createdAt');
    },

    async updateShare(shareId, userId, { password, expiresIn, maxAccess, isActive }) {
        const share = await Share.findOne({ _id: shareId, owner: userId });
        if (!share) throw new Error('Share not found');

        if (password !== undefined) share.password = password ? await bcrypt.hash(password, 10) : null;
        if (expiresIn !== undefined) share.expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;
        if (maxAccess !== undefined) share.maxAccess = maxAccess || null;
        if (isActive !== undefined) share.isActive = isActive;

        return await share.save();
    },

    async deleteShare(shareId, userId) {
        const result = await Share.findOneAndDelete({ _id: shareId, owner: userId });
        if (!result) throw new Error('Share not found');
    },
};

module.exports = shareService;