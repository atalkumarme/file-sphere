// src/models/folder.model.js
const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(v) {
        return !/[\\/:*?"<>|]/.test(v); // Validate folder name
      },
      message: 'Folder name contains invalid characters'
    }
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    default: null
  },
  path: {
    type: String,
    required: true
  },
  pathArray: [{
    _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder' },
    name: String
  }],
  level: {
    type: Number,
    required: true,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
folderSchema.index({ owner: 1, parent: 1 });
folderSchema.index({ path: 1 });
folderSchema.index({ pathArray: 1 });
folderSchema.index({ owner: 1, 'pathArray._id': 1 });

// Methods to handle path operations
folderSchema.methods.getFullPath = function() {
  return this.pathArray.map(p => p.name).join('/');
};

folderSchema.pre('save', async function(next) {
  if (this.isModified('parent') || this.isModified('name')) {
    await this.updatePath();
  }
  next();
});

folderSchema.methods.updatePath = async function() {
  let pathParts = [];
  let currentFolder = this;
  let level = 0;

  while (currentFolder.parent) {
    const parentFolder = await this.constructor.findById(currentFolder.parent);
    if (!parentFolder) break;
    pathParts.unshift({ _id: parentFolder._id, name: parentFolder.name });
    currentFolder = parentFolder;
    level++;
  }

  this.pathArray = pathParts;
  this.level = level;
  this.path = pathParts.length > 0 ? '/' + pathParts.map(p => p.name).join('/') : '';
  if (this.name) {
    this.path += '/' + this.name;
  }
};

module.exports = mongoose.model('Folder', folderSchema);