// Set MongoDB environment variable and start server
process.env.MONGODB_URI = 'mongodb://localhost:27017/grilli-restaurant';
process.env.PORT = '5000';

// Start the unified server
require('./unified-server.js');
