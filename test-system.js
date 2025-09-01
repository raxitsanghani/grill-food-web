// Test Script for Grilli Restaurant System
console.log('🧪 Testing Grilli Restaurant System...');

// Test 1: Check if servers are running
async function testServers() {
    console.log('\n📡 Testing Server Connections...');
    
    try {
        // Test main server
        const mainResponse = await fetch('http://localhost:4000/api/health');
        if (mainResponse.ok) {
            const mainData = await mainResponse.json();
            console.log('✅ Main Server (Port 4000):', mainData.status);
        } else {
            console.log('❌ Main Server (Port 4000): Not responding');
        }
    } catch (error) {
        console.log('❌ Main Server (Port 4000): Connection failed');
    }
    
    try {
        // Test admin server
        const adminResponse = await fetch('http://localhost:4001/api/admin/health');
        if (adminResponse.ok) {
            const adminData = await adminResponse.json();
            console.log('✅ Admin Server (Port 4001):', adminData.status);
        } else {
            console.log('❌ Admin Server (Port 4001): Not responding');
        }
    } catch (error) {
        console.log('❌ Admin Server (Port 4001): Connection failed');
    }
}

// Test 2: Check menu items
async function testMenuItems() {
    console.log('\n🍽️ Testing Menu Items...');
    
    try {
        const response = await fetch('http://localhost:4000/api/menu-items');
        if (response.ok) {
            const items = await response.json();
            console.log(`✅ Menu Items Loaded: ${items.length} items`);
            
            if (items.length > 0) {
                const firstItem = items[0];
                console.log('📋 Sample Item:', {
                    name: firstItem.name,
                    price: firstItem.price,
                    image: firstItem.image,
                    hasImage: !!firstItem.image
                });
            }
        } else {
            console.log('❌ Failed to load menu items');
        }
    } catch (error) {
        console.log('❌ Error loading menu items:', error.message);
    }
}

// Test 3: Check database
async function testDatabase() {
    console.log('\n🗄️ Testing Database...');
    
    try {
        const response = await fetch('http://localhost:4000/api/health');
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Database Status:', data.database);
        } else {
            console.log('❌ Database health check failed');
        }
    } catch (error) {
        console.log('❌ Database connection failed:', error.message);
    }
}

// Run all tests
async function runAllTests() {
    await testServers();
    await testMenuItems();
    await testDatabase();
    
    console.log('\n🎯 Test Summary:');
    console.log('1. Start both servers: npm run start:both');
    console.log('2. Main website: http://localhost:4000');
    console.log('3. Admin panel: http://localhost:4001/admin');
    console.log('4. Check browser console for any errors');
}

// Run tests when script is loaded
runAllTests();
