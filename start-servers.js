const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Grilli Restaurant Servers...\n');

// Start main server (port 4000)
const mainServer = spawn('node', ['server.js'], {
    stdio: 'pipe',
    cwd: __dirname
});

mainServer.stdout.on('data', (data) => {
    console.log(`📱 Main Server: ${data.toString().trim()}`);
});

mainServer.stderr.on('data', (data) => {
    console.log(`❌ Main Server Error: ${data.toString().trim()}`);
});

mainServer.on('close', (code) => {
    console.log(`📱 Main Server exited with code ${code}`);
});

// Wait a bit for main server to start, then start admin server
setTimeout(() => {
    // Start admin server (port 4001)
    const adminServer = spawn('node', ['admin-server.js'], {
        stdio: 'pipe',
        cwd: __dirname
    });

    adminServer.stdout.on('data', (data) => {
        console.log(`🔐 Admin Server: ${data.toString().trim()}`);
    });

    adminServer.stderr.on('data', (data) => {
        console.log(`❌ Admin Server Error: ${data.toString().trim()}`);
    });

    adminServer.on('close', (code) => {
        console.log(`🔐 Admin Server exited with code ${code}`);
    });
}, 2000);

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down servers...');
    mainServer.kill('SIGINT');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down servers...');
    mainServer.kill('SIGTERM');
    process.exit(0);
});

console.log('✅ Servers are starting up...');
console.log('📱 Main Server will be available at: http://localhost:4000');
console.log('🔐 Admin Panel will be available at: http://localhost:4001/admin');
console.log('🛑 Press Ctrl+C to stop all servers\n');
