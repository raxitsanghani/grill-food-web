// Simple Server Startup Script
require('dotenv').config();

console.log('🚀 Starting Grilli Restaurant Server...');

// Set default environment variables
process.env.PORT = process.env.PORT || '5000';

// Try to start with MongoDB, fall back to local database if it fails
try {
    // Check if MongoDB URI is set
    if (process.env.MONGODB_URI || process.env.MONGO_URL) {
        console.log('📊 MongoDB URI detected, attempting to connect...');
        console.log('🔗 URI:', process.env.MONGODB_URI || process.env.MONGO_URL);
    } else {
        console.log('📁 No MongoDB URI found, using local JSON database...');
    }
    
    // Start the unified server
    require('./unified-server.js'); 
    
} catch (error) {
    console.error('❌ Server startup failed:', error.message);
    console.log('🔄 Attempting to start with local database only...');
    
    // Clear MongoDB environment variables to force local database
    delete process.env.MONGODB_URI;
    delete process.env.MONGO_URL;
    
    // Try again with local database only
    try { 
        require('./unified-server.js');
    } catch (secondError) {
        console.error('💥 Server failed to start:', secondError.message);
        process.exit(1);
    }
}