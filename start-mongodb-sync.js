// MongoDB Synchronized Server Startup Script
require('dotenv').config();
const mongoose = require('mongoose');

// Set MongoDB environment variables
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/grilli-restaurant';
process.env.PORT = process.env.PORT || '5000';

console.log('🚀 Starting MongoDB Synchronized Server...');
console.log('📊 MongoDB URI:', process.env.MONGODB_URI);
console.log('🌐 Port:', process.env.PORT);

// Test MongoDB connection first
async function testMongoConnection() {
    try {
        console.log('🔌 Testing MongoDB connection...');
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ MongoDB connected successfully!');
        
        // Test basic operations
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        console.log('📋 Available collections:', collections.map(c => c.name));
        
        await mongoose.disconnect();
        console.log('🔌 MongoDB connection test completed');
        
        // Now start the unified server
        console.log('🚀 Starting unified server with MongoDB...');
        require('./unified-server.js');
        
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        console.log('⚠️  Falling back to local JSON database...');
        
        // Clear MongoDB environment variables to force local database
        delete process.env.MONGODB_URI;
        delete process.env.MONGO_URL;
        
        require('./unified-server.js');
    }
}

// Run the connection test
testMongoConnection();
