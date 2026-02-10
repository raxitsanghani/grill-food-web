const fs = require('fs');
const path = require('path');
const MongoDatabase = require('./services/mongo-db');

// Set MongoDB environment variable
process.env.MONGODB_URI = 'mongodb://localhost:27017/grilli-restaurant';

class DataMigrator {
    constructor() {
        this.db = new MongoDatabase();
        this.dataPath = path.join(__dirname, 'data');
    }

    async migrateAllData() {
        console.log('🚀 Starting data migration to MongoDB...');
        
        try {
            await this.migrateMenuItems();
            await this.migrateOrders();
            await this.migrateAdmins();
            await this.migrateUsers();
            await this.migrateRiders();
            await this.migrateChefs();
            
            console.log('✅ All data migrated successfully to MongoDB!');
        } catch (error) {
            console.error('❌ Migration failed:', error);
        }
    }

    async migrateMenuItems() {
        console.log('📋 Migrating menu items...');
        const filePath = path.join(this.dataPath, 'menu-items.json');
        if (fs.existsSync(filePath)) {
            const items = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            for (const item of items) {
                // Remove the _id field to let MongoDB generate a new one
                const { _id, ...itemData } = item;
                await this.db.createMenuItem(itemData);
            }
            console.log(`✅ Migrated ${items.length} menu items`);
        }
    }

    async migrateOrders() {
        console.log('📦 Migrating orders...');
        const filePath = path.join(this.dataPath, 'orders.json');
        if (fs.existsSync(filePath)) {
            const orders = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            for (const order of orders) {
                const { _id, ...orderData } = order;
                // Remove orderId if it's null to avoid duplicate key error
                if (!orderData.orderId) {
                    delete orderData.orderId;
                }
                await this.db.createOrder(orderData);
            }
            console.log(`✅ Migrated ${orders.length} orders`);
        }
    }

    async migrateAdmins() {
        console.log('👨‍💼 Migrating admins...');
        const filePath = path.join(this.dataPath, 'admins.json');
        if (fs.existsSync(filePath)) {
            const admins = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            for (const admin of admins) {
                const { _id, ...adminData } = admin;
                await this.db.createAdmin(adminData);
            }
            console.log(`✅ Migrated ${admins.length} admins`);
        }
    }

    async migrateUsers() {
        console.log('👤 Migrating users...');
        const filePath = path.join(this.dataPath, 'users.json');
        if (fs.existsSync(filePath)) {
            const users = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            for (const user of users) {
                const { _id, ...userData } = user;
                await this.db.createUser(userData);
            }
            console.log(`✅ Migrated ${users.length} users`);
        }
    }

    async migrateRiders() {
        console.log('🏍️ Migrating riders...');
        const filePath = path.join(this.dataPath, 'riders.json');
        if (fs.existsSync(filePath)) {
            const riders = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            for (const rider of riders) {
                const { _id, ...riderData } = rider;
                await this.db.addRider(riderData);
            }
            console.log(`✅ Migrated ${riders.length} riders`);
        }
    }

    async migrateChefs() {
        console.log('👨‍🍳 Migrating chefs...');
        const filePath = path.join(this.dataPath, 'chefs.json');
        if (fs.existsSync(filePath)) {
            const chefs = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            for (const chef of chefs) {
                const { _id, ...chefData } = chef;
                await this.db.createChef(chefData);
            }
            console.log(`✅ Migrated ${chefs.length} chefs`);
        }
    }
}

// Run migration
const migrator = new DataMigrator();
migrator.migrateAllData().then(() => {
    console.log('🎉 Migration completed!');
    process.exit(0);
}).catch(error => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
});
