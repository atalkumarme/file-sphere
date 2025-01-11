// server/tests/unit/fileService.test.js
require('dotenv').config({ path: '.env.test' });
const mongoose = require('mongoose');
const fileService = require('../../src/services/file.service');
const folderService = require('../../src/services/folder.service');
const File = require('../../src/models/file.model');
const User = require('../../src/models/user.model');
const TEST_DB_URI = process.env.TEST_DB_URI;

// Mock GridFS
const mockDelete = jest.fn();
const mockOpenDownloadStream = jest.fn();
jest.mock('../../src/config/gridfsUtils', () => ({
  getGfs: jest.fn(() => ({
    delete: mockDelete,
    openDownloadStream: mockOpenDownloadStream
  }))
}));


describe('File Service Tests', () => {
  beforeAll(async () => {
    await mongoose.connect(TEST_DB_URI);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await File.deleteMany({});
    await User.deleteMany({});
    mockDelete.mockClear();
    mockOpenDownloadStream.mockClear();
  });

  describe('saveFile', () => {
    test('should save file and update user storage', async () => {
      const userId = new mongoose.Types.ObjectId();
      const user = new User({
        _id: userId,
        email: 'test@test.com',
        password: 'hashedPassword123',
        name: 'Test User',
        storageUsed: 0
      });
      await user.save();

      const mockFile = {
        filename: 'test.txt',
        metadata: {
          originalName: 'test.txt',
          encoding: '7bit',
          mimetype: 'text/plain'
        },
        size: 1000,
        id: new mongoose.Types.ObjectId()
      };

      const savedFile = await fileService.saveFile(mockFile, userId);

      expect(savedFile).toMatchObject({
        filename: mockFile.filename,
        originalName: mockFile.metadata.originalName,
        size: mockFile.size,
        owner: userId
      });

      const updatedUser = await User.findById(userId);
      expect(updatedUser.storageUsed).toBe(mockFile.size);
    });

    test('should save file in a folder', async () => {
      const userId = new mongoose.Types.ObjectId();
      const folderId = new mongoose.Types.ObjectId();
      
      // Create test user
      const user = new User({
        _id: userId,
        email: 'test@test.com',
        password: 'hashedPassword123',
        name: 'Test User',
        storageUsed: 0
      });
      await user.save();

      // Create test folder using folder service
      const folder = await folderService.createFolder({ name: 'testFolder' }, userId);

      const mockFile = {
        filename: 'test.txt',
        metadata: {
          originalName: 'test.txt',
          encoding: '7bit',
          mimetype: 'text/plain'
        },
        size: 1000,
        id: new mongoose.Types.ObjectId()
      };

      const savedFile = await fileService.saveFile(mockFile, userId, folder._id);

      expect(savedFile).toMatchObject({
        filename: mockFile.filename,
        originalName: mockFile.metadata.originalName,
        size: mockFile.size,
        owner: userId,
        parent: folder._id,
        path: '/testFolder/test.txt'
      });
    });
  });

  describe('deleteFile', () => {
    test('should delete file and update user storage', async () => {
      const userId = new mongoose.Types.ObjectId();
      const gridFSId = new mongoose.Types.ObjectId();

      // Create test user
      const user = new User({
        _id: userId,
        email: 'test@test.com',
        password: 'hashedPassword123',
        name: 'Test User',
        storageUsed: 1000
      });
      await user.save();

      // Create test file
      const file = new File({
        filename: 'test.txt',
        originalName: 'test.txt',
        encoding: '7bit',
        mimetype: 'text/plain',
        size: 1000,
        owner: userId,
        gridFSId: gridFSId,
        path: '/test.txt'
      });
      await file.save();

      await fileService.deleteFile(file._id, userId);

      // Verify GridFS delete was called
      expect(mockDelete).toHaveBeenCalledWith(gridFSId);
      
      // Verify file was deleted from database
      const deletedFile = await File.findById(file._id);
      expect(deletedFile).toBeNull();

      // Verify user storage was updated
      const updatedUser = await User.findById(userId);
      expect(updatedUser.storageUsed).toBe(0);
    });

    test('should throw error if file not found', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      await expect(fileService.deleteFile(nonExistentId, 'userId'))
        .rejects
        .toThrow('File not found');
    });
  });

  describe('listUserFiles', () => {
    test('should list files in root folder', async () => {
      const userId = new mongoose.Types.ObjectId();
      const files = [
        {
          filename: 'file1.txt',
          originalName: 'file1.txt',
          encoding: '7bit',
          mimetype: 'text/plain',
          size: 1000,
          owner: userId,
          gridFSId: new mongoose.Types.ObjectId(),
          path: '/file1.txt'
        },
        {
          filename: 'file2.txt',
          originalName: 'file2.txt',
          encoding: '7bit',
          mimetype: 'text/plain',
          size: 1000,
          owner: userId,
          gridFSId: new mongoose.Types.ObjectId(),
          path: '/file2.txt'
        }
      ];

      await File.insertMany(files);

      const userFiles = await fileService.listUserFiles(userId);
      expect(userFiles).toHaveLength(2);
      expect(userFiles[0].filename).toBe('file1.txt');
      expect(userFiles[1].filename).toBe('file2.txt');
    });

    test('should list files in specific folder', async () => {
      const userId = new mongoose.Types.ObjectId();
      const folderId = new mongoose.Types.ObjectId();
      
      const files = [
        {
          filename: 'file1.txt',
          originalName: 'file1.txt',
          encoding: '7bit',
          mimetype: 'text/plain',
          size: 1000,
          owner: userId,
          parent: folderId,
          gridFSId: new mongoose.Types.ObjectId(),
          path: '/folder/file1.txt'
        },
        {
          filename: 'file2.txt',
          originalName: 'file2.txt',
          encoding: '7bit',
          mimetype: 'text/plain',
          size: 1000,
          owner: userId,
          gridFSId: new mongoose.Types.ObjectId(),
          path: '/file2.txt'
        }
      ];

      await File.insertMany(files);

      const folderFiles = await fileService.listUserFiles(userId, folderId);
      expect(folderFiles).toHaveLength(1);
      expect(folderFiles[0].filename).toBe('file1.txt');
    });
  });
});