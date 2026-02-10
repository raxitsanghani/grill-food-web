const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/grilli-restaurant';

const adminSchema = new mongoose.Schema({
    fullName: String,
    email: { type: String, unique: true },
    password: String,
    securityKey: String,
    role: { type: String, default: 'admin' },
    status: { type: String, default: 'active' }
}, { timestamps: true });

const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

async function addAdmin() {
    try {
        console.log('Connecting to MongoDB:', MONGODB_URI);
        await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('✅ Connected to MongoDB');

        const email = 'raxit88@gmail.com';
        const password = 'raxit2112';
        const securityKey = '666666';

        // Check if admin exists
        const existingAdmin = await Admin.findOne({ email });

        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await bcryptjs.hash(password, salt);

        if (existingAdmin) {
            console.log('Admin already exists. Updating password and security key...');
            existingAdmin.password = hashedPassword;
            existingAdmin.securityKey = securityKey;
            existingAdmin.fullName = 'Raxit Sanghani';
            await existingAdmin.save();
            console.log('✅ Admin updated successfully');
        } else {
            console.log('Creating new admin...');
            const newAdmin = new Admin({
                fullName: 'Raxit Sanghani',
                email,
                password: hashedPassword,
                securityKey,
                role: 'admin',
                status: 'active'
            });
            await newAdmin.save();
            console.log('✅ Admin created successfully');
        }

        console.log('Email:', email);
        console.log('Password:', password);
        console.log('Security Key:', securityKey);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

addAdmin();
