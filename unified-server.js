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
        origin: "*", // Allow all origins for Render deployment
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Initialize local database
const db = new LocalDatabase();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, 'grilli-master')));

// Serve admin panel static files with proper path handling
app.use('/admin', express.static(path.join(__dirname, 'admin-panel'), {
    index: false // Don't serve index.html automatically
}));

// Authentication Middleware for Admin Routes
const authenticateAdmin = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Access denied. No token provided.' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Handle fixed admin authentication
        if (decoded.adminId === 'fixed-admin' && decoded.email === 'raxitsanghani@gmail.com') {
            req.admin = {
                _id: 'fixed-admin',
                fullName: 'Admin User',
                email: 'raxitsanghani@gmail.com',
                phone: '+91 9510261149'
            };
            return next();
        }

        // Fallback to database admin check (for backward compatibility)
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

// ========================================
// MAIN ROUTES
// ========================================

// Serve selection page as main entry point
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'selection.html'));
});

// Serve admin login page
app.get('/admin-login', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-login.html'));
});

// ========================================
// USER ROUTES (Public)
// ========================================

// Serve user frontend
app.get('/user', (req, res) => {
    res.sendFile(path.join(__dirname, 'grilli-master', 'index.html'));
});

app.get('/all-menu', (req, res) => {
    res.sendFile(path.join(__dirname, 'grilli-master', 'all-menu.html'));
});

app.get('/orders', (req, res) => {
    res.sendFile(path.join(__dirname, 'grilli-master', 'orders.html'));
});

// User API Routes
app.get('/api/menu-items', async (req, res) => {
    try {
        const menuItems = db.getAllMenuItems();
        res.json(menuItems);
    } catch (error) {
        console.error('Error fetching menu items:', error);
        res.status(500).json({ error: 'Failed to fetch menu items' });
    }
});

app.get('/api/menu-items/category/:category', async (req, res) => {
    try {
        const { category } = req.params;
        const menuItems = db.getAllMenuItems();
        const filteredItems = menuItems.filter(item => item.category === category);
        res.json(filteredItems);
    } catch (error) {
        console.error('Error fetching menu items by category:', error);
        res.status(500).json({ error: 'Failed to fetch menu items' });
    }
});

app.get('/api/menu-items/:id', async (req, res) => {
    try {
        const menuItem = db.getMenuItemById(req.params.id);
        if (!menuItem) {
            return res.status(404).json({ error: 'Menu item not found' });
        }
        res.json(menuItem);
    } catch (error) {
        console.error('Error fetching menu item:', error);
        res.status(500).json({ error: 'Failed to fetch menu item' });
    }
});

// Place order
app.post('/api/orders', async (req, res) => {
    try {
        const orderData = req.body;
        
        if (!orderData.itemId || !orderData.customerName || !orderData.customerPhone) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        orderData.subtotal = parseFloat(orderData.subtotal) || 0;
        orderData.gstAmount = parseFloat(orderData.gstAmount) || 0;
        orderData.deliveryCharge = parseFloat(orderData.deliveryCharge) || 0;
        orderData.totalPrice = parseFloat(orderData.totalPrice) || 0;
        
        const order = db.createOrder(orderData);
        
        // Emit real-time update to admin panel
        io.emit('new-order', order);
        
        res.status(201).json(order);
    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).json({ error: 'Failed to place order' });
    }
});

// Get all orders (for user tracking)
app.get('/api/orders', async (req, res) => {
    try {
        const orders = db.getAllOrders();
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// User Authentication
app.get('/api/users/check-setup', async (req, res) => {
    try {
        const users = db.getAllUsers();
        res.json({ hasUsers: users.length > 0 });
    } catch (error) {
        console.error('Error checking user setup:', error);
        res.status(500).json({ error: 'Failed to check user setup' });
    }
});

app.post('/api/users/register', async (req, res) => {
    try {
        const { fullName, email, phone, password } = req.body;
        
        if (!fullName || !email || !phone || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        const existingUser = db.getUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }
        
        const newUser = db.createUser({ fullName, email, phone, password });
        
        res.status(201).json({ 
            message: 'User created successfully',
            user: { id: newUser._id, fullName: newUser.fullName, email: newUser.email }
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

app.post('/api/users/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        
        const user = db.authenticateUser(email, password);
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        const token = `user_${user._id}_${Date.now()}`;
        
        res.json({
            message: 'Login successful',
            token,
            user: { id: user._id, fullName: user.fullName, email: user.email }
        });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

app.get('/api/users/orders', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        const token = authHeader.substring(7);
        const userId = token.split('_')[1];
        
        if (!userId) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        
        const userOrders = db.getOrdersByUserId(userId);
        res.json(userOrders);
    } catch (error) {
        console.error('Error fetching user orders:', error);
        res.status(500).json({ error: 'Failed to fetch user orders' });
    }
});

// ========================================
// ADMIN ROUTES (Protected)
// ========================================

// Serve admin panel (with authentication check)
app.get('/admin', (req, res) => {
    console.log('🔧 ADMIN PANEL REQUESTED:', req.path);
    console.log('🔧 Admin panel file path:', path.join(__dirname, 'admin-panel', 'index.html'));
    res.sendFile(path.join(__dirname, 'admin-panel', 'index.html'));
});

app.get('/admin/dashboard', (req, res) => {
    console.log('Admin dashboard requested:', req.path);
    res.sendFile(path.join(__dirname, 'admin-panel', 'dashboard.html'));
});

// Handle admin panel sub-routes
app.get('/admin/*', (req, res) => {
    console.log('Admin sub-route requested:', req.path);
    res.sendFile(path.join(__dirname, 'admin-panel', 'index.html'));
});

// Admin authentication with fixed credentials
app.post('/api/admin/login', async (req, res) => {
    try {
        const { email, password, securityKey } = req.body;

        if (!email || !password || !securityKey) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Fixed credentials check
        if (email === 'raxitsanghani@gmail.com' && password === 'raxit2112' && securityKey === '123456') {
            const token = jwt.sign({ adminId: 'fixed-admin', email: email }, JWT_SECRET, { expiresIn: '24h' });

            res.json({
                message: 'Login successful',
                token,
                admin: {
                    id: 'fixed-admin',
                    fullName: 'Admin User',
                    email: email
                }
            });
        } else {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin protected routes
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

app.get('/api/admin/check-auth', authenticateAdmin, (req, res) => {
    res.json({ authenticated: true, admin: {
        _id: req.admin._id,
        fullName: req.admin.fullName,
        email: req.admin.email
    }});
});

// Admin menu management
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
        const { name, type, category, price, badge, deliveryTime, prepTime, description, image } = req.body;
        
        if (!name || !type || !category || !price || !description || !image) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        if (price <= 0) {
            return res.status(400).json({ error: 'Price must be greater than 0' });
        }
        
        let imagePath = image;
        if (imagePath && !imagePath.startsWith('http') && !imagePath.startsWith('data:image/') && !imagePath.startsWith('./')) {
            imagePath = `./assets/images/${imagePath}`;
        }
        
        const menuItemData = {
            ...req.body,
            image: imagePath
        };
        
        const menuItem = db.createMenuItem(menuItemData);
        
        // Emit to all connected clients
        io.emit('menu-updated', { action: 'item-added', item: menuItem });
        
        res.status(201).json(menuItem);
    } catch (error) {
        console.error('Menu item creation error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/admin/menu-items/:id', authenticateAdmin, async (req, res) => {
    try {
        const { image } = req.body;
        
        let imagePath = image;
        if (imagePath && !imagePath.startsWith('http') && !imagePath.startsWith('data:image/')) {
            if (imagePath.startsWith('./assets/images/')) {
                imagePath = imagePath;
            } else if (imagePath.includes('assets/images/')) {
                const filename = imagePath.split('assets/images/').pop();
                imagePath = `./assets/images/${filename}`;
            } else {
                imagePath = `./assets/images/${imagePath}`;
            }
        }
        
        const updateData = {
            ...req.body,
            image: imagePath
        };
        
        const menuItem = db.updateMenuItem(req.params.id, updateData);
        
        if (!menuItem) {
            return res.status(404).json({ error: 'Menu item not found' });
        }
        
        // Emit to all connected clients
        io.emit('menu-updated', { action: 'item-updated', item: menuItem });
        
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
        
        // Emit to all connected clients
        io.emit('menu-updated', { action: 'item-deleted', itemId: req.params.id });
        
        res.json({ message: 'Menu item deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin orders management
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

        // Emit to all connected clients
        io.emit('order-status-updated', { orderId: req.params.id, status, adminNotes, order });

        res.json(order);
    } catch (error) {
        console.error('Order status update error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin dashboard stats
app.get('/api/admin/dashboard-stats', authenticateAdmin, async (req, res) => {
    try {
        const stats = db.getDashboardStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ========================================
// SOCKET.IO HANDLING
// ========================================

io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('🔌 Client disconnected:', socket.id);
    });
});

// ========================================
// HEALTH CHECK & ERROR HANDLING
// ========================================

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        database: 'Local JSON Database',
        server: 'UNIFIED SERVER',
        adminPanel: 'Available at /admin',
        userPanel: 'Available at /'
    });
});

// Admin panel health check
app.get('/api/admin/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        server: 'UNIFIED SERVER',
        adminPanel: 'Working',
        message: 'Admin panel is accessible'
    });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('Global error handler caught:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
});

// Catch-all handler for frontend routes (only for non-admin, non-API routes)
app.get('*', (req, res) => {
    // Skip if it's an admin route or API route
    if (req.path.startsWith('/admin') || req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'Route not found' });
    }
    
    // Otherwise serve user frontend
    console.log('Serving user frontend for:', req.path);
    res.sendFile(path.join(__dirname, 'grilli-master', 'index.html'));
});

// Start server
server.listen(PORT, () => {
    console.log(`🚀 UNIFIED SERVER is running on port ${PORT}`);
    console.log(`👥 User Panel: http://localhost:${PORT}`);
    console.log(`👨‍💼 Admin Panel: http://localhost:${PORT}/admin`);
    console.log(`📊 Using Local JSON Database`);
    console.log(`🔧 Server Type: UNIFIED (User + Admin)`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});
