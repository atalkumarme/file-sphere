// src/config/gridfs.js
const { GridFsStorage } = require('multer-gridfs-storage');
const crypto = require('crypto');
const path = require('path');
const { mongooseConnection } = require('./connection');
const { initializeGfs } = require('./gridfsUtils');

// Ensure GridFS is initialized after MongoDB connects
mongooseConnection.once('open', initializeGfs);

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
                    bucketName: process.env.BUCKET_NAME,
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

module.exports = { storage };