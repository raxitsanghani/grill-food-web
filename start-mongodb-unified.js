// MongoDB Unified Server Startup Script
require('dotenv').config();

// Set MongoDB environment variables
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/grilli-restaurant';
process.env.PORT = process.env.PORT || '5000';

console.log('🚀 Starting MongoDB Unified Server...');
console.log('📊 MongoDB URI:', process.env.MONGODB_URI);
console.log('🌐 Port:', process.env.PORT);

// Start the unified server
require('./unified-server.js');
