const fs = require('fs');
const path = require('path');
const bcryptjs = require('bcryptjs');

const adminsPath = path.join(__dirname, 'data', 'admins.json');

async function createAdmin() {
    try {
        const password = 'raxit2112';
        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await bcryptjs.hash(password, salt);

        const newAdmin = {
            _id: Date.now().toString(),
            fullName: 'Raxit Sanghani',
            email: 'raxit88@gmail.com',
            phone: 'N/A',
            password: hashedPassword,
            securityKey: '666666',
            createdAt: new Date().toISOString()
        };

        let admins = [];
        if (fs.existsSync(adminsPath)) {
            const data = fs.readFileSync(adminsPath, 'utf8');
            admins = JSON.parse(data);
        }

        // Check if already exists
        const existingIndex = admins.findIndex(a => a.email === newAdmin.email);
        if (existingIndex !== -1) {
            console.log('Admin with this email already exists inside local DB. Updating...');
            admins[existingIndex] = newAdmin;
        } else {
            admins.push(newAdmin);
        }

        fs.writeFileSync(adminsPath, JSON.stringify(admins, null, 2));
        console.log('✅ Admin added successfully!');
        console.log('Email: raxit88@gmail.com');
        console.log('Password: raxit2112');
        console.log('Key: 666666');

    } catch (error) {
        console.error('Error creating admin:', error);
    }
}

createAdmin();
