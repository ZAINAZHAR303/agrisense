const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// console.log("JWT:", process.env.JWT_SECRET);
// Middleware - CORS must be first!
app.use(cors({
  origin: ['http://localhost:3000', 'http://10.1.58.22:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  maxAge: 600,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/soil-data', require('./routes/soilData'));
app.use('/api/fertilizer', require('./routes/fertilizer'));
app.use('/api/upload', require('./routes/upload'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'AgriSense Backend API is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

// Start server
const startServer = async () => {
  try {
    console.log('🚀 Starting AgriSense Backend Server...');
    console.log('📍 Port:', PORT);
    console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
    console.log('🔑 JWT Secret:', process.env.JWT_SECRET ? 'Loaded ✓' : 'Missing ✗');
    console.log('');
    
    console.log('⏳ Step 1: Connecting to MongoDB...');
    await connectDB();
    console.log('✅ Step 1 complete: MongoDB connected');
    
    console.log('');
    console.log('⏳ Step 2: Starting Express server...');
    const server = app.listen(PORT, '127.0.0.1', () => {
      const address = server.address();
      console.log('═══════════════════════════════════════');
      console.log(`🚀 Server LISTENING on http://127.0.0.1:${PORT}`);
      console.log(`📊 Address:`, address);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://127.0.0.1:${PORT}/health`);
      console.log('═══════════════════════════════════════');
      console.log('✅ Server is ready to accept connections!');
    });

    server.on('error', (error) => {
      console.error('💥 Server error:', error);
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use!`);
      }
      process.exit(1);
    });

    server.on('listening', () => {
      console.log('📡 Server event: listening');
    });

    console.log('⏳ Server listen() called, waiting for callback...');
  } catch (error) {
    console.error('');
    console.error('💥 Failed to start server:');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
};

startServer();
