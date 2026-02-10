const mongoose = require('mongoose');

// Set MongoDB environment variable
process.env.MONGODB_URI = 'mongodb://localhost:27017/grilli-restaurant';

async function dropIndexes() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('🔗 Connected to MongoDB');
        
        const db = mongoose.connection.db;
        
        // Drop the orders collection to remove all indexes
        await db.collection('orders').drop();
        console.log('✅ Dropped orders collection');
        
        // Drop the entire database to start fresh
        await db.dropDatabase();
        console.log('✅ Dropped grilli-restaurant database');
        
        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

dropIndexes();
