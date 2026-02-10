const MongoDatabase = require('./services/mongo-db');

// Set MongoDB environment variable
process.env.MONGODB_URI = 'mongodb://localhost:27017/grilli-restaurant';

async function clearCollections() {
    console.log('🧹 Clearing MongoDB collections...');
    
    try {
        const db = new MongoDatabase();
        
        // Clear all collections
        await db.MenuItem.deleteMany({});
        await db.Order.deleteMany({});
        await db.Admin.deleteMany({});
        await db.User.deleteMany({});
        await db.Rider.deleteMany({});
        await db.Chef.deleteMany({});
        
        console.log('✅ All collections cleared successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error clearing collections:', error);
        process.exit(1);
    }
}

clearCollections();
