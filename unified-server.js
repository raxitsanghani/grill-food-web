const express = require('express');
const path = require('path');
const cors = require('cors');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const http = require('http');
const socketIo = require('socket.io');
const LocalDatabase = require('./local-db');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Initialize local database
const db = new LocalDatabase();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Define project directory
const projectDir = path.join(__dirname, 'grilli-master');

// Authentication Middleware for Admin Routes
const authenticateAdmin = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Access denied. No token provided.' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const admins = db.getAllAdmins();
        const admin = admins.find(a => a._id === decoded.adminId);
        
        if (!admin) {
            return res.status(401).json({ error: 'Invalid token.' });
        }

        req.admin = admin;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token.' });
    }
};

// Routes

// User web routes (must come before root route)
app.get('/user', (req, res) => {
    res.sendFile(path.join(projectDir, 'index.html'));
});

// Selection page (root route)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'selection.html'));
});

// Admin web routes
// Serve index for both /admin and /admin/ without redirect loops
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-panel', 'index.html'));
});

app.get('/admin/', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-panel', 'index.html'));
});

// Dashboard should serve for both with and without trailing slash
app.get('/admin/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-panel', 'dashboard.html'));
});

app.get('/admin/dashboard/', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-panel', 'dashboard.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        database: 'Local JSON Database',
        server: 'Unified Server'
    });
});

// User API Routes

// Get all menu items
app.get('/api/menu-items', async (req, res) => {
    try {
        const menuItems = db.getAllMenuItems();
        console.log('Serving menu items:', menuItems.length);
        res.json(menuItems);
    } catch (error) {
        console.error('Error fetching menu items:', error);
        res.status(500).json({ error: 'Failed to fetch menu items' });
    }
});

// Get single menu item by ID (used by ordering modal)
app.get('/api/menu-items/by-id/:id', async (req, res) => {
    try {
        const item = db.getMenuItemById(req.params.id);
        if (!item) {
            return res.status(404).json({ error: 'Menu item not found' });
        }
        res.json(item);
    } catch (error) {
        console.error('Error fetching menu item by id:', error);
        res.status(500).json({ error: 'Failed to fetch menu item' });
    }
});

// -------------------------
// Public User Auth Endpoints
// -------------------------
app.post('/api/users/register', (req, res) => {
    try {
        const { fullName, email, phone, password } = req.body || {};

        if (!fullName || !email || !phone || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const existing = db.getUserByEmail(email);
        if (existing) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        const user = db.createUser({ fullName, email, phone, password });

        return res.status(201).json({
            message: 'Account created successfully',
            user: {
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone
            }
        });
    } catch (error) {
        console.error('User register error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/users/login', (req, res) => {
    try {
        const { email, password } = req.body || {};

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = db.authenticateUser(email, password);
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // For the simple local DB, return a lightweight token (not JWT) for client persistence
        const token = `local-${user._id}-${Date.now()}`;

        return res.json({
            message: 'Login successful',
            token,
            user: {
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone
            }
        });
    } catch (error) {
        console.error('User login error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});

// Get menu items for specific category
app.get('/api/menu-items/:category', async (req, res) => {
    try {
        const { category } = req.params;
        const menuItems = db.getMenuItemsByCategory(category);
        res.json(menuItems);
    } catch (error) {
        console.error('Error fetching menu items by category:', error);
        res.status(500).json({ error: 'Failed to fetch menu items' });
    }
});

// Submit order
app.post('/api/orders', async (req, res) => {
    try {
        const orderData = req.body;
        console.log('Order received:', orderData);
        
        const order = db.createOrder(orderData);
        
        // Emit to admin clients
        io.emit('new-order', order);
        
        res.status(201).json(order);
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// Get order status
app.get('/api/orders/:orderId/status', async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = db.getOrderById(orderId);
        
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        res.json({ status: order.status, adminNotes: order.adminNotes });
    } catch (error) {
        console.error('Error fetching order status:', error);
        res.status(500).json({ error: 'Failed to fetch order status' });
    }
});

// Menu update endpoint for admin
app.post('/api/menu-update', (req, res) => {
    try {
        const { action, item, itemId } = req.body;
        console.log('Menu update received:', { action, item: item?.name, itemId });
        
        // Emit to all user clients
        io.emit('menu-updated', { action, item, itemId });
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error broadcasting menu update:', error);
        res.status(500).json({ error: 'Failed to broadcast menu update' });
    }
});

// Order status update endpoint for admin
app.post('/api/order-status-update', (req, res) => {
    try {
        const { orderId, status, adminNotes, order } = req.body;
        console.log('Order status update received:', { orderId, status });
        
        // Emit to all user clients
        io.emit('order-status-updated', { orderId, status, adminNotes, order });
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error broadcasting order status update:', error);
        res.status(500).json({ error: 'Failed to broadcast order status update' });
    }
});

// Admin API Routes

// Check if admin setup is required
app.get('/api/admin/setup-status', async (req, res) => {
    try {
        const admins = db.getAllAdmins();
        const adminExists = admins.length > 0;
        res.json({
            requiresSetup: false,
            adminExists: adminExists 
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin Account Creation
app.post('/api/admin/setup', async (req, res) => {
    try {
        const { fullName, email, phone, password, securityKey } = req.body;

        // Validation
        if (!fullName || !email || !phone || !password || !securityKey) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        if (securityKey.length !== 6 || !/^\d{6}$/.test(securityKey)) {
            return res.status(400).json({ error: 'Security key must be exactly 6 digits' });
        }

        // Check if email already exists
        const existingAdmin = db.getAdminByEmail(email);
        if (existingAdmin) {
            return res.status(400).json({ error: 'Email already registered. Please use a different email or login with existing account.' });
        }

        // Hash password
        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await bcryptjs.hash(password, salt);

        // Create admin
        const admin = db.createAdmin({
            fullName,
            email,
            phone,
            password: hashedPassword,
            securityKey
        });

        // Generate token
        const token = jwt.sign({ adminId: admin._id }, JWT_SECRET, { expiresIn: '24h' });

        res.status(201).json({
            message: 'Admin account created successfully',
            token,
            admin: {
                id: admin._id,
                fullName: admin.fullName,
                email: admin.email
            }
        });
    } catch (error) {
        console.error('Admin setup error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin Login
app.post('/api/admin/login', async (req, res) => {
    try {
        const { email, password, securityKey } = req.body;

        // Validation
        if (!email || !password || !securityKey) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Find admin by email
        const admin = db.getAdminByEmail(email);
        if (!admin) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Verify security key
        if (admin.securityKey !== securityKey) {
            return res.status(400).json({ error: 'Invalid security key' });
        }

        // Verify password
        const validPassword = await bcryptjs.compare(password, admin.password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign({ adminId: admin._id }, JWT_SECRET, { expiresIn: '24h' });

            res.json({
                message: 'Login successful',
                token,
                admin: {
                id: admin._id,
                fullName: admin.fullName,
                email: admin.email
            }
        });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin health check endpoint
app.get('/api/admin/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        database: 'Local JSON Database',
        server: 'Unified Server'
    });
});

// Get admin profile
app.get('/api/admin/profile', authenticateAdmin, async (req, res) => {
    try {
        const adminProfile = {
            _id: req.admin._id,
            fullName: req.admin.fullName,
            email: req.admin.email,
            phone: req.admin.phone,
            createdAt: req.admin.createdAt
        };
        res.json(adminProfile);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Check if user is authenticated (for dashboard access)
app.get('/api/admin/check-auth', authenticateAdmin, (req, res) => {
    res.json({ authenticated: true, admin: {
        _id: req.admin._id,
        fullName: req.admin.fullName,
        email: req.admin.email
    }});
});

// Menu Items API
app.get('/api/admin/menu-items', authenticateAdmin, async (req, res) => {
    try {
        const menuItems = db.getAllMenuItems();
        res.json(menuItems);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/admin/menu-items', authenticateAdmin, async (req, res) => {
    try {
        console.log('POST request received for new menu item');
        console.log('Request body keys:', Object.keys(req.body));
        console.log('Image data type:', typeof req.body.image);
        console.log('Image data length:', req.body.image ? req.body.image.length : 'No image');
        
        const { name, type, category, price, badge, deliveryTime, prepTime, description, image } = req.body;
        
        // Validation
        if (!name || !type || !category || !price || !description || !image) {
            console.log('Missing required fields:', { name: !!name, type: !!type, category: !!category, price: !!price, description: !!description, image: !!image });
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        if (price <= 0) {
            return res.status(400).json({ error: 'Price must be greater than 0' });
        }
        
        // Handle image - could be base64, URL, or relative path
        let imagePath = image;
        if (imagePath && !imagePath.startsWith('http') && !imagePath.startsWith('data:image/') && !imagePath.startsWith('./')) {
            imagePath = `./assets/images/${imagePath}`;
        }
        
        console.log('Processed image path type:', typeof imagePath);
        console.log('Processed image path starts with data:image:', imagePath ? imagePath.startsWith('data:image/') : 'No image');
        
        const menuItemData = {
            ...req.body,
            image: imagePath
        };
        
        console.log('Creating menu item with data:', {
            name: menuItemData.name,
            type: menuItemData.type,
            price: menuItemData.price,
            hasImage: !!menuItemData.image,
            imageLength: menuItemData.image ? menuItemData.image.length : 0
        });
        
        const menuItem = db.createMenuItem(menuItemData);
        
        // Emit to admin clients
        io.emit('menu-updated', { action: 'item-added', item: menuItem });
        
        // Also emit to main server for user updates
        try {
            const mainServerResponse = await fetch('http://localhost:5000/api/menu-update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action: 'item-added', item: menuItem })
            });
            if (mainServerResponse.ok) {
                console.log('Menu update sent to main server');
            }
        } catch (error) {
            console.log('Could not send update to main server:', error.message);
        }
        
        res.status(201).json(menuItem);
    } catch (error) {
        console.error('Menu item creation error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/admin/menu-items/:id', authenticateAdmin, async (req, res) => {
    try {
        console.log('PUT request received for menu item:', req.params.id);
        console.log('Request body keys:', Object.keys(req.body));
        console.log('Image data type:', typeof req.body.image);
        console.log('Image data length:', req.body.image ? req.body.image.length : 'No image');
        
        const { image } = req.body;
        
        // Handle image - could be base64, URL, or relative path
        let imagePath = image;
        if (imagePath && !imagePath.startsWith('http') && !imagePath.startsWith('data:image/')) {
            // If it's not a full URL or base64, make it a relative path
            if (imagePath.startsWith('./assets/images/')) {
                // Already in correct format
                imagePath = imagePath;
            } else if (imagePath.includes('assets/images/')) {
                // Extract just the filename and make it relative
                const filename = imagePath.split('assets/images/').pop();
                imagePath = `./assets/images/${filename}`;
            } else {
                // Assume it's just a filename, add the path
                imagePath = `./assets/images/${imagePath}`;
            }
        }
        
        console.log('Processed image path type:', typeof imagePath);
        console.log('Processed image path starts with data:image:', imagePath ? imagePath.startsWith('data:image/') : 'No image');
        
        const updateData = {
            ...req.body,
            image: imagePath
        };
        
        console.log('Updating menu item with data:', updateData);
        
        const menuItem = db.updateMenuItem(req.params.id, updateData);
        
        if (!menuItem) {
            console.log('Menu item not found:', req.params.id);
            return res.status(404).json({ error: 'Menu item not found' });
        }
        
        console.log('Menu item updated successfully:', menuItem);
        
        // Emit to admin clients
        io.emit('menu-updated', { action: 'item-updated', item: menuItem });
        
        // Also emit to main server for user updates
        try {
            const mainServerResponse = await fetch('http://localhost:5000/api/menu-update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action: 'item-updated', item: menuItem })
            });
            if (mainServerResponse.ok) {
                console.log('Menu update sent to main server');
            }
        } catch (error) {
            console.log('Could not send update to main server:', error.message);
        }
        
        res.json(menuItem);
    } catch (error) {
        console.error('Error updating menu item:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

app.delete('/api/admin/menu-items/:id', authenticateAdmin, async (req, res) => {
    try {
        const success = db.deleteMenuItem(req.params.id);
        if (!success) {
            return res.status(404).json({ error: 'Menu item not found' });
        }
        
        // Emit to admin clients
        io.emit('menu-updated', { action: 'item-deleted', itemId: req.params.id });
        
        // Also emit to main server for user updates
        try {
            const mainServerResponse = await fetch('http://localhost:5000/api/menu-update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action: 'item-deleted', itemId: req.params.id })
            });
            if (mainServerResponse.ok) {
                console.log('Menu update sent to main server');
            }
        } catch (error) {
            console.log('Could not send update to main server:', error.message);
        }
        
        res.json({ message: 'Menu item deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Orders API
app.get('/api/admin/orders', authenticateAdmin, async (req, res) => {
    try {
        const orders = db.getAllOrders();
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/admin/orders/:id/status', authenticateAdmin, async (req, res) => {
    try {
        const { status, adminNotes } = req.body;
        const validStatuses = ['pending', 'payment-done', 'preparing', 'out-for-delivery', 'delivered', 'rejected'];
        
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const order = db.updateOrderStatus(req.params.id, status, adminNotes);

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Emit to admin clients
        io.emit('order-status-updated', { orderId: req.params.id, status, adminNotes, order });

        // Also emit to main server for user clients
        try {
            const mainServerResponse = await fetch('http://localhost:5000/api/order-status-update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    orderId: req.params.id,
                    status,
                    adminNotes,
                    order
                })
            });
            
            if (mainServerResponse.ok) {
                console.log('✅ Order status update broadcasted to main server');
            } else {
                console.log('⚠️ Failed to broadcast to main server');
            }
        } catch (error) {
            console.log('⚠️ Could not reach main server for broadcast');
        }

        res.json(order);
    } catch (error) {
        console.error('Order status update error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Dashboard stats
app.get('/api/admin/dashboard-stats', authenticateAdmin, async (req, res) => {
    try {
        const stats = db.getDashboardStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Serve static files from the project directory (grilli-master subfolder)
app.use(express.static(projectDir));

// Serve admin panel static files and assets correctly under /admin/
app.use('/admin', express.static(path.join(__dirname, 'admin-panel'), {
    index: false
}));

// Socket.IO event handlers
io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('🔌 Client disconnected:', socket.id);
    });
});

// Listen for new orders from main server
io.on('new-order', (order) => {
    console.log('📦 New order received:', order);
    // Emit to all connected admin clients
    io.emit('new-order', order);
});

// Handle admin client connections
io.on('connection', (socket) => {
    console.log('🔌 Admin client connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('🔌 Admin client disconnected:', socket.id);
    });
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('Global error handler caught:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
});

// Start server
server.listen(PORT, () => {
    console.log(`🚀 Unified Server is running on http://localhost:${PORT}`);
    console.log(`📱 User Web: http://localhost:${PORT}/user`);
    console.log(`🔐 Admin Web: http://localhost:${PORT}/admin`);
    console.log(`📊 Using Local JSON Database`);
});