// Start Server with MongoDB Connection
require('dotenv').config();

// Set MongoDB connection explicitly
process.env.MONGODB_URI = 'mongodb://localhost:27017/grilli-restaurant';
process.env.PORT = '5000';

console.log('🚀 Starting Grilli Restaurant Server with MongoDB...');
console.log('📊 MongoDB URI:', process.env.MONGODB_URI);
console.log('🌐 Server Port:', process.env.PORT);

// Start the unified server
require('./unified-server.js');
