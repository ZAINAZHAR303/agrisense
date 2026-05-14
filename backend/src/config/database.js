const mongoose = require('mongoose');

// if (!process.env.MONGODB_URI) {
//   throw new Error('Please add your MongoDB URI to .env file');
// }

// const uri = process.env.MONGODB_URI;
const uri = "mongodb+srv://zainazhar457_db_user:zYXbC8xv1tHD3VvR@cluster0.ezjmnyu.mongodb.net/agrisense?retryWrites=true&w=majority&appName=Cluster0";

console.log('📡 Attempting to connect to MongoDB...');
console.log('🔗 MongoDB URI:', uri ? 'Found' : 'Missing');

const connectDB = async () => {
  try {
    console.log('🔌 Connecting to MongoDB Atlas with Mongoose...');
    console.log('📍 Connection URI length:', uri.length);
    console.log('📍 Connection URI (masked):', uri.substring(0, 30) + '...');
    
    // Mongoose 8+ doesn't need useNewUrlParser and useUnifiedTopology
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000, // 10 second timeout
      socketTimeoutMS: 45000,
      family: 4 // Force IPv4
    });
    
    console.log('✅ MongoDB connected successfully!');
    console.log('📊 Database:', mongoose.connection.name);
    console.log('📊 Host:', mongoose.connection.host);
    console.log('📊 Connection state:', mongoose.connection.readyState); // 1 = connected
    
    // Handle connection errors after initial connection
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected - will attempt to reconnect');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection error:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('');
    console.error('💡 Possible causes:');
    console.error('   - Network connectivity issues');
    console.error('   - MongoDB Atlas cluster is paused');
    console.error('   - DNS resolution failure');
    console.error('   - Firewall blocking connection');
    console.error('');
    console.error('💡 Please check:');
    console.error('   1. Your internet connection');
    console.error('   2. MongoDB Atlas dashboard (https://cloud.mongodb.com)');
    console.error('   3. Cluster is not paused');
    console.error('');
    throw error; // Re-throw to prevent server from starting
  }
};

// Get database instance using native MongoDB driver from Mongoose
const getDB = () => {
  const db = mongoose.connection.db;
  if (!db) {
    console.error('❌ MongoDB connection not initialized. Connection state:', mongoose.connection.readyState);
  }
  return db;
};
// connectDB();
module.exports = { connectDB, getDB };
