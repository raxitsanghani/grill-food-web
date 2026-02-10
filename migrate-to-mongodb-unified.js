// Data Migration Script: Local JSON to MongoDB
require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Set MongoDB environment variables
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/grilli-restaurant';

const MongoDatabase = require('./services/mongo-db');

class DataMigrator {
    constructor() {
        this.db = new MongoDatabase();
        this.dataPath = path.join(__dirname, 'data');
    }

    async migrateAllData() {
        console.log('🔄 Starting data migration to MongoDB...');
        
        try {
            await this.migrateMenuItems();
            await this.migrateOrders();
            await this.migrateAdmins();
            await this.migrateUsers();
            await this.migrateRiders();
            await this.migrateChefs();
            
            console.log('✅ Data migration completed successfully!');
        } catch (error) {
            console.error('❌ Migration failed:', error);
        }
    }

    async migrateMenuItems() {
        const filePath = path.join(this.dataPath, 'menu-items.json');
        if (!fs.existsSync(filePath)) {
            console.log('⚠️  No menu-items.json found, skipping...');
            return;
        }

        try {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            console.log(`📋 Migrating ${data.length} menu items...`);
            
            for (const item of data) {
                // Remove _id to let MongoDB generate new ones
                const { _id, ...itemData } = item;
                await this.db.createMenuItem(itemData);
            }
            
            console.log('✅ Menu items migrated successfully');
        } catch (error) {
            console.error('❌ Error migrating menu items:', error);
        }
    }

    async migrateOrders() {
        const filePath = path.join(this.dataPath, 'orders.json');
        if (!fs.existsSync(filePath)) {
            console.log('⚠️  No orders.json found, skipping...');
            return;
        }

        try {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            console.log(`📦 Migrating ${data.length} orders...`);
            
            for (const order of data) {
                const { _id, ...orderData } = order;
                await this.db.createOrder(orderData);
            }
            
            console.log('✅ Orders migrated successfully');
        } catch (error) {
            console.error('❌ Error migrating orders:', error);
        }
    }

    async migrateAdmins() {
        const filePath = path.join(this.dataPath, 'admins.json');
        if (!fs.existsSync(filePath)) {
            console.log('⚠️  No admins.json found, skipping...');
            return;
        }

        try {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            console.log(`👤 Migrating ${data.length} admins...`);
            
            for (const admin of data) {
                const { _id, ...adminData } = admin;
                await this.db.createAdmin(adminData);
            }
            
            console.log('✅ Admins migrated successfully');
        } catch (error) {
            console.error('❌ Error migrating admins:', error);
        }
    }

    async migrateUsers() {
        const filePath = path.join(this.dataPath, 'users.json');
        if (!fs.existsSync(filePath)) {
            console.log('⚠️  No users.json found, skipping...');
            return;
        }

        try {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            console.log(`👥 Migrating ${data.length} users...`);
            
            for (const user of data) {
                const { _id, ...userData } = user;
                await this.db.createUser(userData);
            }
            
            console.log('✅ Users migrated successfully');
        } catch (error) {
            console.error('❌ Error migrating users:', error);
        }
    }

    async migrateRiders() {
        const filePath = path.join(this.dataPath, 'riders.json');
        if (!fs.existsSync(filePath)) {
            console.log('⚠️  No riders.json found, skipping...');
            return;
        }

        try {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            console.log(`🏍️  Migrating ${data.length} riders...`);
            
            for (const rider of data) {
                const { _id, ...riderData } = rider;
                await this.db.addRider(riderData);
            }
            
            console.log('✅ Riders migrated successfully');
        } catch (error) {
            console.error('❌ Error migrating riders:', error);
        }
    }

    async migrateChefs() {
        const filePath = path.join(this.dataPath, 'chefs.json');
        if (!fs.existsSync(filePath)) {
            console.log('⚠️  No chefs.json found, skipping...');
            return;
        }

        try {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            console.log(`👨‍🍳 Migrating ${data.length} chefs...`);
            
            for (const chef of data) {
                const { _id, ...chefData } = chef;
                await this.db.createChef(chefData);
            }
            
            console.log('✅ Chefs migrated successfully');
        } catch (error) {
            console.error('❌ Error migrating chefs:', error);
        }
    }
}

// Run migration if this script is executed directly
if (require.main === module) {
    const migrator = new DataMigrator();
    migrator.migrateAllData().then(() => {
        console.log('🎉 Migration process completed!');
        process.exit(0);
    }).catch((error) => {
        console.error('💥 Migration failed:', error);
        process.exit(1);
    });
}

module.exports = DataMigrator;
