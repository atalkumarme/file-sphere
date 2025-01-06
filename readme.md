# File Sphere Project Specification

## 1. Project Introduction

### 1.1 Project Overview
A file storage and sharing system that allows users to upload, organize, and share files. This project focuses on building strong backend skills while creating a practical application similar to a simplified version of Dropbox or Google Drive.

### 1.2 Learning Objectives
- Building robust file handling systems
- Implementing authentication and authorization
- Designing scalable database schemas
- Creating efficient search functionality
- Managing file metadata and storage
- Implementing sharing and collaboration features
- Writing clean, maintainable code
- Building RESTful APIs
- Handling file streams and chunks
- Implementing security best practices

### 1.3 Core Features

#### Basic Features
1. User Management
   - Registration and login
   - Profile management
   - Storage quota tracking

2. File Operations
   - File upload (with progress)
   - File download
   - File deletion
   - File renaming
   - File moving between folders

3. Folder Management
   - Create folders
   - Delete folders
   - Move folders
   - Rename folders
   - Nested folder structure

#### Intermediate Features
1. File Sharing
   - Generate sharing links
   - Set link expiration
   - Password protection for links
   - Manage shared files

2. File Preview
   - Image thumbnails
   - PDF preview
   - Video thumbnails
   - Text file preview

3. Search Functionality
   - Search by filename
   - Search by content type
   - Filter by date
   - Sort results

4. Additional Features
   - Recently accessed files
   - Favorite files
   - Trash bin
   - File version history
   - Comments on files

## 2. Technology Stack Selection

### 2.1 Backend Technology
**Choice: Node.js with Express**
Reasons:
- Excellent for handling asynchronous I/O operations
- Strong ecosystem for file handling
- Easy to learn and implement
- Great community support
- Efficient handling of concurrent connections
- Familiar JavaScript ecosystem

### 2.2 Database
**Primary Database: MongoDB**
Reasons:
- Flexible schema for varying file metadata
- Easy to scale horizontally
- Good performance for metadata queries
- Native support for GridFS
- Simple to implement and maintain
- Excellent Node.js integration

### 2.3 File Storage
**Choice: GridFS for MongoDB**
Reasons:
- Integrated with main database
- Handles large files efficiently
- Built-in file chunking
- No additional service required
- Good for learning purposes
- Easy to migrate to S3 later

### 2.4 Caching Layer
**Choice: Redis**
Reasons:
- Fast retrieval of frequent metadata
- Session management
- Temporary link storage
- Queue management for uploads
- Easy to implement and use

### 2.5 Frontend
**Choice: React**
Reasons:
- Component-based architecture
- Strong ecosystem
- Easy to implement file upload UI
- Good performance
- Reusable components

## 3. System Architecture

### 3.1 High-Level Architecture
```
Client Layer
    │
    ▼
API Gateway (Express)
    │
    ├─► Authentication Service
    │
    ├─► File Service
    │   └─► GridFS Storage
    │
    ├─► User Service
    │   └─► MongoDB
    │
    ├─► Sharing Service
    │   └─► Redis
    │
    └─► Search Service
        └─► MongoDB Indexes
```

### 3.2 Core Components

1. **API Gateway**
   - Route management
   - Request validation
   - Authentication middleware
   - Response formatting

2. **File Service**
   - Upload management
   - Download streaming
   - Chunk handling
   - File operations

3. **User Service**
   - Authentication
   - Profile management
   - Quota tracking
   - User preferences

4. **Sharing Service**
   - Link generation
   - Access control
   - Expiration management
   - Password protection

5. **Search Service**
   - Metadata indexing
   - Search queries
   - Filter management
   - Sort operations

## 4. Implementation Guide

### 4.1 Project Setup
1. Initialize Git repository
2. Set up Node.js project
3. Configure ESLint and Prettier
4. Set up project structure
5. Configure environment variables

### 4.2 Development Workflow

#### Phase 1: Foundation (Weeks 1-2)
1. Basic project setup
   - Initialize Node.js project
   - Set up Express server
   - Configure MongoDB connection
   - Set up basic routing

2. User Authentication
   - Implement registration
   - Implement login
   - Set up JWT authentication
   - Create auth middleware

#### Phase 2: Core Features (Weeks 3-4)
1. File Operations
   - Set up GridFS
   - Implement file upload
   - Implement file download
   - Basic file operations

2. Folder Structure
   - Create folder schema
   - Implement CRUD operations
   - Handle nested structures

#### Phase 3: Sharing & Search (Weeks 5-6)
1. File Sharing
   - Generate sharing links
   - Implement access control
   - Add password protection

2. Search Functionality
   - Set up indexes
   - Implement search API
   - Add filters and sorting

#### Phase 4: Advanced Features (Weeks 7-8)
1. File Preview
   - Image processing
   - Thumbnail generation
   - Preview generation

2. Additional Features
   - Comments system
   - Trash bin
   - Recent files

### 4.3 API Design

#### Authentication APIs
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

#### File APIs
```
POST   /api/files/upload
GET    /api/files/:id
DELETE /api/files/:id
PUT    /api/files/:id
GET    /api/files/search
```

#### Folder APIs
```
POST   /api/folders
GET    /api/folders/:id
PUT    /api/folders/:id
DELETE /api/folders/:id
```

#### Sharing APIs
```
POST   /api/share
GET    /api/share/:linkId
DELETE /api/share/:linkId
```

### 4.4 Database Schema

#### User Collection
```javascript
{
  _id: ObjectId,
  email: String,
  password: String,
  name: String,
  storageUsed: Number,
  storageLimit: Number,
  createdAt: Date
}
```

#### File Collection
```javascript
{
  _id: ObjectId,
  filename: String,
  path: String,
  size: Number,
  type: String,
  owner: ObjectId,
  parent: ObjectId,
  isFolder: Boolean,
  shared: [{
    userId: ObjectId,
    permission: String
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### 4.5 Testing Strategy
1. Unit Tests
   - Service layer testing
   - Utility function testing
   - Model validation testing

2. Integration Tests
   - API endpoint testing
   - Database operations
   - File operations

3. Performance Tests
   - Upload/download speeds
   - Concurrent operations
   - Search performance

## 5. Best Practices & Considerations

### 5.1 Security
- Implement proper authentication
- Validate file types
- Sanitize file names
- Set upload limits
- Implement rate limiting
- Use secure sharing links

### 5.2 Performance
- Implement chunked uploads
- Use streams for downloads
- Cache frequent queries
- Implement pagination
- Optimize database queries
- Use appropriate indexes

### 5.3 Code Organization
- Follow MVC pattern
- Use service layer
- Implement error handling
- Use TypeScript (optional)
- Document API endpoints
- Write clean, commented code

### 5.4 Additional Recommendations
- Use Git flow for version control
- Write meaningful commit messages
- Document setup process
- Include API documentation
- Add logging system
- Implement error tracking

## 6. Project Timeline
- Week 1-2: Basic setup and authentication
- Week 3-4: File and folder operations
- Week 5-6: Sharing and search features
- Week 7-8: Advanced features and testing
- Week 9: Documentation and optimization

This project structure allows for incremental development while maintaining focus on learning backend concepts. Each phase builds upon the previous one, making it easier to understand and implement the features systematically.
