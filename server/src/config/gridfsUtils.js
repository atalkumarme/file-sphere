// src/config/gridfsUtils.js
const mongoose = require('mongoose');

let gfs = null;

// Initialize GridFS
const initializeGfs = () => {
    if (!mongoose.connection || !mongoose.connection.db) {
        throw new Error('MongoDB connection not established');
    }

    if (!gfs) {
        gfs = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
            bucketName: process.env.BUCKET_NAME
        });
    }
    return gfs;
};

// Safe getter for gfs instance
const getGfs = () => {
    if (!gfs) {
        throw new Error('GridFS not initialized. Ensure MongoDB connection is established.');
    }
    return gfs;
};

module.exports = { initializeGfs, getGfs };