// server/tests/unit/folderService.test.js
require('dotenv').config({ path: '.env.test' });
const mongoose = require('mongoose');
const folderService = require('../../src/services/folder.service');
const Folder = require('../../src/models/folder.model');
const File = require('../../src/models/file.model');
const User = require('../../src/models/user.model');
const TEST_DB_URI = process.env.TEST_DB_URI;

describe('Folder Service Tests', () => {
  beforeAll(async () => {
    await mongoose.connect(TEST_DB_URI);
  });

  afterAll(async () => {
    await mongoose.connection.db.dropDatabase();
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await Folder.deleteMany({});
    await File.deleteMany({});
    await User.deleteMany({});
  });

  describe('createFolder', () => {
    test('should create folder in root directory', async () => {
      const userId = new mongoose.Types.ObjectId();
      const folderData = {
        name: 'Test Folder'
      };

      const folder = await folderService.createFolder(folderData, userId);

      expect(folder).toMatchObject({
        name: folderData.name,
        owner: userId,
        parent: null,
        path: '/Test Folder',
        level: 0
      });
      expect(folder.pathArray).toHaveLength(0);
    });

    test('should create nested folder', async () => {
      const userId = new mongoose.Types.ObjectId();
      
      // Create parent folder first
      const parentFolder = await folderService.createFolder({ name: 'Parent' }, userId);
      
      const folderData = {
        name: 'Child',
        parent: parentFolder._id
      };

      const folder = await folderService.createFolder(folderData, userId);

      expect(folder).toMatchObject({
        name: folderData.name,
        owner: userId,
        parent: parentFolder._id,
        path: '/Parent/Child',
        level: 1
      });
      expect(folder.pathArray).toHaveLength(1);
      expect(folder.pathArray[0]).toMatchObject({
        _id: parentFolder._id,
        name: parentFolder.name
      });
    });

    test('should reject invalid folder names', async () => {
      const userId = new mongoose.Types.ObjectId();
      const invalidNames = ['folder/name', 'folder\\name', 'folder:name', 'folder*name'];

      for (const invalidName of invalidNames) {
        await expect(folderService.createFolder({ name: invalidName }, userId))
          .rejects
          .toThrow('Folder name contains invalid characters');
      }
    });
  });

  describe('renameFolder', () => {
    test('should rename folder and update paths of children', async () => {
      const userId = new mongoose.Types.ObjectId();
      
      // Create folder structure
      const parentFolder = await folderService.createFolder({ name: 'Parent' }, userId);
      const childFolder = await folderService.createFolder({ 
        name: 'Child',
        parent: parentFolder._id
      }, userId);

      // Updated file creation object for test cases
    const testFile = {
    filename: 'test.txt',
    originalName: 'test.txt',
    encoding: '7bit',
    mimetype: 'text/plain',
    size: 1024,  // Added required field
    gridFSId: new mongoose.Types.ObjectId(), // Added required field
    owner: userId,
    parent: childFolder._id,
    path: '/Parent/Child/test.txt'
    };
  
  // Use this object instead of the current file creation in tests
  await File.create(testFile);

      // Rename parent folder
      const renamed = await folderService.renameFolder(parentFolder._id, 'NewParent');

      // Verify parent folder was renamed
      expect(renamed.name).toBe('NewParent');
      expect(renamed.path).toBe('/NewParent');

      // Verify child folder path was updated
      const updatedChild = await Folder.findById(childFolder._id);
      expect(updatedChild.path).toBe('/NewParent/Child');

      // Verify file path was updated
      const updatedFile = await File.findOne({ filename: 'test.txt' });
      expect(updatedFile.path).toBe('/NewParent/Child/test.txt');
    });

    test('should throw error if folder not found', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      await expect(folderService.renameFolder(nonExistentId, 'NewName'))
        .rejects
        .toThrow('Folder not found');
    });
  });

  describe('moveFolder', () => {
    test('should move folder to new parent', async () => {
        const userId = new mongoose.Types.ObjectId();
        
        // Create folder structure first
        const sourceParent = await folderService.createFolder({ name: 'Source' }, userId);
        const targetParent = await folderService.createFolder({ name: 'Target' }, userId);
        const folderToMove = await folderService.createFolder({ 
            name: 'ToMove',
            parent: sourceParent._id
        }, userId);
    
        // Create a test file
        const testFile = {
            filename: 'test.txt',
            originalName: 'test.txt',
            encoding: '7bit',
            mimetype: 'text/plain',
            size: 1024,
            gridFSId: new mongoose.Types.ObjectId(),
            owner: userId,
            parent: folderToMove._id,
            path: '/Source/ToMove/test.txt'
        };
        await File.create(testFile);
    
        // Move folder
        const moved = await folderService.moveFolder(folderToMove._id, targetParent._id);
    
        // Verify folder was moved
        expect(moved.parent).toEqual(targetParent._id);
        expect(moved.path).toBe('/Target/ToMove');
    
        // Verify file path was updated
        const updatedFile = await File.findOne({ filename: 'test.txt' });
        expect(updatedFile.path).toBe('/Target/ToMove/test.txt');
    });

    test('should prevent moving folder to its own subdirectory', async () => {
      const userId = new mongoose.Types.ObjectId();
      
      // Create parent folder and subfolder
      const parentFolder = await folderService.createFolder({ name: 'Parent' }, userId);
      const childFolder = await folderService.createFolder({ 
        name: 'Child',
        parent: parentFolder._id
      }, userId);

      // Attempt to move parent into child
      await expect(folderService.moveFolder(parentFolder._id, childFolder._id))
        .rejects
        .toThrow('Cannot move folder to its own subdirectory');
    });
  });

  describe('deleteFolder', () => {
    test('should delete folder and all contents recursively', async () => {
      const userId = new mongoose.Types.ObjectId();
      
      // Create folder structure
      const parentFolder = await folderService.createFolder({ name: 'Parent' }, userId);
      const childFolder = await folderService.createFolder({ 
        name: 'Child',
        parent: parentFolder._id
      }, userId);

      // Updated file creation object for test cases
    const testFile = {
        filename: 'test.txt',
        originalName: 'test.txt',
        encoding: '7bit',
        mimetype: 'text/plain',
        size: 1024,  // Added required field
        gridFSId: new mongoose.Types.ObjectId(), // Added required field
        owner: userId,
        parent: childFolder._id,
        path: '/Parent/Child/test.txt'
        };
      
      // Use this object instead of the current file creation in tests
      await File.create(testFile);

      // Delete parent folder
      await folderService.deleteFolder(parentFolder._id);

      // Verify everything was deleted
      const parentExists = await Folder.findById(parentFolder._id);
      const childExists = await Folder.findById(childFolder._id);
      const fileExists = await File.findOne({ filename: 'test.txt' });

      expect(parentExists).toBeNull();
      expect(childExists).toBeNull();
      expect(fileExists).toBeNull();
    });

    test('should throw error if folder not found', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      await expect(folderService.deleteFolder(nonExistentId))
        .rejects
        .toThrow('Folder not found');
    });
  });

  describe('isSubdirectory', () => {
    test('should correctly identify subdirectory relationships', async () => {
        const userId = new mongoose.Types.ObjectId();
        
        // Create nested folder structure
        const root = await folderService.createFolder({ name: 'Root' }, userId);
        const level1 = await folderService.createFolder({ name: 'Level1', parent: root._id }, userId);
        const level2 = await folderService.createFolder({ name: 'Level2', parent: level1._id }, userId);
    
        expect(await folderService.isSubdirectory(root._id, level1._id)).toBe(false);
        expect(await folderService.isSubdirectory(root._id, level2._id)).toBe(false);
        expect(await folderService.isSubdirectory(level1._id, root._id)).toBe(true);
        expect(await folderService.isSubdirectory(level2._id, root._id)).toBe(true);
        expect(await folderService.isSubdirectory(level2._id, level1._id)).toBe(true);
    });
    test('should handle non-existent folders', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const result = await folderService.isSubdirectory(
        nonExistentId,
        new mongoose.Types.ObjectId()
      );
      expect(result).toBe(false);
    });
    test('should return false for the same folder IDs', async () => {
        const userId = new mongoose.Types.ObjectId();
        const root = await folderService.createFolder({ name: 'Root' }, userId);
    
        expect(await folderService.isSubdirectory(root._id, root._id)).toBe(false);
    });
    
    test('should return false for unrelated folders', async () => {
        const userId = new mongoose.Types.ObjectId();
        const folderA = await folderService.createFolder({ name: 'FolderA' }, userId);
        const folderB = await folderService.createFolder({ name: 'FolderB' }, userId);
    
        expect(await folderService.isSubdirectory(folderA._id, folderB._id)).toBe(false);
    });
  });
});