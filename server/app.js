const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');

// Load environment variables
dotenv.config();

const connectDB = require('./src/config/db');
const { storage, gfs } = require('./src/config/gridfs');
const authRoutes = require('./src/routes/auth.routes');
const fileRoutes = require('./src/routes/file.routes');
const folderRoutes = require('./src/routes/folder.routes');
const errorHandler = require('./src/middleware/errorHandler');

// Initialize app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware setup
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Expose GridFS globally
app.locals.gfs = gfs;

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/folders', folderRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to FileSphere API' });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
