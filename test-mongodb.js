const MongoDatabase = require('./services/mongo-db');

// Set MongoDB environment variable
process.env.MONGODB_URI = 'mongodb://localhost:27017/grilli-restaurant';

async function testMongoDB() {
    console.log('🧪 Testing MongoDB integration...');
    
    try {
        const db = new MongoDatabase();
        
        // Test menu items
        const menuItems = await db.getAllMenuItems();
        console.log(`✅ Menu Items: ${menuItems.length} items found`);
        
        // Test orders
        const orders = await db.getAllOrders();
        console.log(`✅ Orders: ${orders.length} orders found`);
        
        // Test admins
        const admins = await db.getAllAdmins();
        console.log(`✅ Admins: ${admins.length} admins found`);
        
        // Test users
        const users = await db.getAllUsers();
        console.log(`✅ Users: ${users.length} users found`);
        
        // Test riders
        const riders = await db.getAllRiders();
        console.log(`✅ Riders: ${riders.length} riders found`);
        
        // Test chefs
        const chefs = await db.getAllChefs();
        console.log(`✅ Chefs: ${chefs.length} chefs found`);
        
        console.log('🎉 All MongoDB operations working correctly!');
        process.exit(0);
    } catch (error) {
        console.error('❌ MongoDB test failed:', error);
        process.exit(1);
    }
}

testMongoDB();
