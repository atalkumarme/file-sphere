// src/config/gridfs.js
const mongoose = require('mongoose');
const { GridFsStorage } = require('multer-gridfs-storage');
const crypto = require('crypto');
const path = require('path');

const BUCKET_NAME = 'uploads';
let gfs = null;

// Initialize GridFS
const initializeGfs = () => {
    if (!mongoose.connection || !mongoose.connection.db) {
        throw new Error('MongoDB connection not established');
    }
    
    if (!gfs) {
        gfs = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
            bucketName: BUCKET_NAME
        });
    }
    return gfs;
};

// Ensure GridFS is initialized after MongoDB connects
mongoose.connection.once('open', () => {
    initializeGfs();
});

// Safe getter for gfs instance
const getGfs = () => {
    if (!gfs) {
        throw new Error('GridFS not initialized. Ensure MongoDB connection is established.');
    }
    return gfs;
};

// Create storage engine
const storage = new GridFsStorage({
    url: process.env.MONGODB_URI,
    options: {
        useUnifiedTopology: true
    },
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(16, (err, buf) => {
                if (err) return reject(err);
                
                const filename = buf.toString('hex') + path.extname(file.originalname);
                const fileInfo = {
                    filename: filename,
                    bucketName: BUCKET_NAME,
                    metadata: {
                        originalName: file.originalname,
                        encoding: file.encoding,
                        mimetype: file.mimetype,
                        owner: req.user.userId
                    }
                };
                resolve(fileInfo);
            });
        });
    }
});

module.exports = { storage, getGfs, BUCKET_NAME };