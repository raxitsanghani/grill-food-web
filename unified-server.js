// Load environment variables first
require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const http = require('http');
const socketIo = require('socket.io');
const LocalDatabase = require('./local-db');

let db;

// Initialize database
async function initializeDatabase() {
  if (process.env.MONGODB_URI || process.env.MONGO_URL) {
    try {
      const MongoDatabase = require('./services/mongo-db');
      db = new MongoDatabase();
      
      // Wait a moment for connection to establish
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return true;
    } catch (e) {
      console.warn('⚠️  MongoDB init failed (unified), falling back to Local JSON DB:', e.message);
      db = new LocalDatabase();
      return false;
    }
  } else {
    db = new LocalDatabase();
    return false;
  }
}

// Initialize database synchronously for now
if (process.env.MONGODB_URI || process.env.MONGO_URL) {
  try {
    const MongoDatabase = require('./services/mongo-db');
    db = new MongoDatabase();
  } catch (e) {
    console.warn('⚠️  MongoDB init failed (unified), falling back to Local JSON DB:', e.message);
    db = new LocalDatabase();
  }
} else {
  db = new LocalDatabase();
  console.log('ℹ️  Using Local JSON Database (unified)');
}

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

// Database initialized above (MongoDB or Local JSON)

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
        const admins = await db.getAllAdmins();
        const admin = admins.find(a => a._id === decoded.adminId || a._id.toString() === decoded.adminId);
        
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

// Payment pages
app.get('/card-payment', (req, res) => {
    res.sendFile(path.join(projectDir, 'card-payment.html'));
});

app.get('/upi-payment', (req, res) => {
    res.sendFile(path.join(projectDir, 'upi-payment.html'));
});

// Selection page (root route)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'selection.html'));
});

// Admin web routes
// Serve admin login page
app.get('/admin-login', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-login.html'));
});

app.get('/admin-login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-login.html'));
});

// Serve index for both /admin and /admin/ without redirect loops
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-panel', 'index.html'));
});

app.get('/admin/', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-panel', 'index.html'));
});

// Create Admin page
app.get('/admin/create-admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-panel', 'create-admin.html'));
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
        const menuItems = await db.getAllMenuItems();
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
        const item = await db.getMenuItemById(req.params.id);
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
app.post('/api/users/register', async (req, res) => {
    try {
        const { fullName, email, phone, password } = req.body || {};

        if (!fullName || !email || !phone || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const existing = await db.getUserByEmail(email);
        if (existing) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        const user = await db.createUser({ fullName, email, phone, password });

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

app.post('/api/users/login', async (req, res) => {
    try {
        const { email, password } = req.body || {};

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await db.authenticateUser(email, password);
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
        const menuItems = await db.getMenuItemsByCategory(category);
        res.json(menuItems);
    } catch (error) {
        console.error('Error fetching menu items by category:', error);
        res.status(500).json({ error: 'Failed to fetch menu items' });
    }
});

// Submit order
app.post('/api/orders', async (req, res) => {
    try {
        const orderData = req.body || {};
        // Normalize payload: if multiple items provided, compute summary fields
        if (Array.isArray(orderData.items) && orderData.items.length > 0) {
            const subtotal = orderData.subtotal != null
                ? Number(orderData.subtotal)
                : orderData.items.reduce((sum, it) => sum + (Number(it.price || 0) * Number(it.quantity || 0)), 0);
            const gstAmount = orderData.gstAmount != null ? Number(orderData.gstAmount) : Number(orderData.gst) || 0;
            const delivery = orderData.deliveryCharge != null ? Number(orderData.deliveryCharge) : Number(orderData.deliveryFees) || 0;
            const discount = orderData.discountAmount != null ? Number(orderData.discountAmount) : 0;
            const finalTotal = orderData.finalTotal != null ? Number(orderData.finalTotal) : (orderData.totalPrice != null ? Number(orderData.totalPrice) : (subtotal + gstAmount + delivery - discount));
            const totalQty = orderData.items.reduce((s, it) => s + Number(it.quantity || 0), 0);
            const names = orderData.items.map(i => i.name).filter(Boolean);
            orderData.itemName = names.length > 3 ? `${names.slice(0,3).join(', ')}…` : names.join(', ');
            orderData.itemImage = orderData.items[0]?.image || orderData.itemImage;
            orderData.unitPrice = subtotal; // for backward compatibility in some UIs
            orderData.quantity = totalQty;
            orderData.subtotal = subtotal;
            orderData.gstAmount = gstAmount;
            orderData.deliveryCharge = delivery;
            orderData.discountAmount = discount;
            orderData.totalPrice = finalTotal;
        }

        // Assign a random available rider if none is assigned yet
        if (!orderData.assignedRider) {
            const rider = await (db.assignRandomRider ? db.assignRandomRider() : null);
            if (rider) {
                orderData.assignedRider = {
                    _id: rider._id,
                    full_name: rider.full_name,
                    phone: rider.phone,
                    profile_photo: rider.profile_photo,
                    age: rider.age || (20 + Math.floor(Math.random() * 15)),
                    rating: rider.rating || (3.5 + Math.random() * 1.5)
                };
                // Simple ETA defaults
                orderData.eta_minutes = undefined;
                orderData.eta_seconds = 900; // 15 minutes
                orderData.eta_set_at = new Date();
            }
        }

        const order = await db.createOrder(orderData);
        
        // Emit to admin clients and user room by phone if available
        io.emit('new-order', order);
        if (order.customerPhone) {
            io.to(String(order.customerPhone)).emit('rider:assigned', {
                orderId: order._id,
                rider: order.assignedRider,
                eta_minutes: order.eta_minutes,
                eta_seconds: order.eta_seconds,
                eta_set_at: order.eta_set_at
            });
        }
        
        res.status(201).json(order);
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// Get all orders (for user panel)
app.get('/api/orders', async (req, res) => {
    try {
        const orders = await db.getAllOrders();
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// Get order status
app.get('/api/orders/:orderId/status', async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await db.getOrderById(orderId);
        
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
        const existingAdmin = await db.getAdminByEmail(email);
        if (existingAdmin) {
            return res.status(400).json({ error: 'Email already registered. Please use a different email or login with existing account.' });
        }

        // Hash password
        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await bcryptjs.hash(password, salt);

        // Create admin
        const admin = await db.createAdmin({
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
        const admin = await db.getAdminByEmail(email);
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
        const menuItems = await db.getAllMenuItems();
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
        
        const menuItem = await db.createMenuItem(menuItemData);
        
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
        
        const menuItem = await db.updateMenuItem(req.params.id, updateData);
        
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
        const success = await db.deleteMenuItem(req.params.id);
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
        const orders = await db.getAllOrders();
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

        const order = await db.updateOrderStatus(req.params.id, status, adminNotes);

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

app.delete('/api/admin/orders/:id', authenticateAdmin, async (req, res) => {
    try {
        const success = await db.deleteOrder(req.params.id);
        if (success) {
            // Emit real-time update to all connected clients
            io.emit('order-deleted', {
                orderId: req.params.id
            });
            
            return res.json({ message: 'Order deleted successfully' });
        }
        return res.status(404).json({ error: 'Order not found' });
    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({ error: 'Failed to delete order' });
    }
});

// Dashboard stats
app.get('/api/admin/dashboard-stats', authenticateAdmin, async (req, res) => {
    try {
        const stats = await db.getDashboardStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// -------------------------
// Riders API (for Admin UI)
// -------------------------
// -------------------------
// Chefs API (for Admin UI)
// -------------------------
app.get('/api/chefs', async (req, res) => {
    try {
        const chefs = await db.getAllChefs();
        res.json(chefs);
    } catch (error) {
        console.error('Error fetching chefs:', error);
        res.status(500).json({ error: 'Failed to fetch chefs' });
    }
});

app.get('/api/chefs/active', async (req, res) => {
    try {
        const chefs = await db.getActiveChefs();
        res.json(chefs);
    } catch (error) {
        console.error('Error fetching active chefs:', error);
        res.status(500).json({ error: 'Failed to fetch active chefs' });
    }
});

app.get('/api/chefs/:id', async (req, res) => {
    try {
        const chef = await db.getChefById(req.params.id);
        if (chef) return res.json(chef);
        return res.status(404).json({ error: 'Chef not found' });
    } catch (error) {
        console.error('Error fetching chef:', error);
        res.status(500).json({ error: 'Failed to fetch chef' });
    }
});

app.post('/api/chefs', async (req, res) => {
    try {
        let { fullName, profilePhoto, experience, specialties, bio, rating, status } = req.body || {};

        fullName = typeof fullName === 'string' ? fullName.trim() : '';
        experience = typeof experience === 'string' ? experience.trim() : experience;
        bio = typeof bio === 'string' ? bio.trim() : bio;
        status = typeof status === 'string' ? status.trim() : status;

        if (!fullName || !experience) {
            return res.status(400).json({ error: 'Full name and experience are required' });
        }

        if (typeof specialties === 'string') {
            specialties = specialties.split(',').map(s => s.trim()).filter(Boolean);
        }
        if (!Array.isArray(specialties)) specialties = [];

        const parsedRating = Number(rating);
        rating = Number.isFinite(parsedRating) ? Math.min(5, Math.max(1, parsedRating)) : 4.5;

        const chef = await db.createChef({
            fullName,
            profilePhoto,
            experience,
            specialties,
            bio: bio || '',
            rating,
            status: status || 'active'
        });

        if (chef) return res.status(201).json(chef);
        return res.status(500).json({ error: 'Failed to create chef' });
    } catch (error) {
        console.error('Error creating chef:', error);
        return res.status(500).json({ error: 'Failed to create chef' });
    }
});

app.put('/api/chefs/:id', async (req, res) => {
    try {
        let { fullName, profilePhoto, experience, specialties, bio, rating, status } = req.body || {};

        const updates = {};
        if (typeof fullName === 'string' && fullName.trim()) updates.fullName = fullName.trim();
        if (profilePhoto) updates.profilePhoto = profilePhoto;
        if (typeof experience === 'string' && experience.trim()) updates.experience = experience.trim();

        if (specialties !== undefined) {
            if (typeof specialties === 'string') {
                specialties = specialties.split(',').map(s => s.trim()).filter(Boolean);
            }
            updates.specialties = Array.isArray(specialties) ? specialties : [];
        }

        if (bio !== undefined) updates.bio = typeof bio === 'string' ? bio.trim() : bio;

        if (rating !== undefined) {
            const parsedRating = Number(rating);
            if (Number.isFinite(parsedRating)) {
                updates.rating = Math.min(5, Math.max(1, parsedRating));
            }
        }

        if (typeof status === 'string' && status.trim()) updates.status = status.trim();

        const chef = await db.updateChef(req.params.id, updates);
        if (chef) return res.json(chef);
        return res.status(404).json({ error: 'Chef not found' });
    } catch (error) {
        console.error('Error updating chef:', error);
        return res.status(500).json({ error: 'Failed to update chef' });
    }
});

app.delete('/api/chefs/:id', async (req, res) => {
    try {
        const success = await db.deleteChef(req.params.id);
        if (success) return res.json({ message: 'Chef deleted successfully' });
        return res.status(404).json({ error: 'Chef not found' });
    } catch (error) {
        console.error('Error deleting chef:', error);
        return res.status(500).json({ error: 'Failed to delete chef' });
    }
});

app.get('/api/riders', async (req, res) => {
    try {
        const riders = await db.getAllRiders();
        res.json(riders);
    } catch (error) {
        console.error('Error fetching riders:', error);
        res.status(500).json({ error: 'Failed to fetch riders' });
    }
});

app.post('/api/riders', async (req, res) => {
    try {
        const { full_name, phone, profile_photo, lat, lng, status } = req.body || {};

        if (!full_name || !phone) {
            return res.status(400).json({ error: 'Full name and phone are required' });
        }

        // Indian phone validation
        const phoneRegex = /^(\+91|0)?[6-9]\d{9}$/;
        if (!phoneRegex.test(String(phone).replace(/[-\s]/g, ''))) {
            return res.status(400).json({ error: 'Invalid Indian phone number' });
        }

        const rider = await db.addRider({ full_name, phone, profile_photo, lat, lng, status });
        if (rider) {
            return res.status(201).json(rider);
        }
        return res.status(500).json({ error: 'Failed to add rider' });
    } catch (error) {
        console.error('Error adding rider:', error);
        res.status(500).json({ error: 'Failed to add rider' });
    }
});

app.put('/api/riders/:id', async (req, res) => {
    try {
        const updates = req.body || {};
        if (updates.phone) {
            const phoneRegex = /^(\+91|0)?[6-9]\d{9}$/;
            if (!phoneRegex.test(String(updates.phone).replace(/[-\s]/g, ''))) {
                return res.status(400).json({ error: 'Invalid Indian phone number' });
            }
        }
        const rider = await db.updateRider(req.params.id, updates);
        if (rider) return res.json(rider);
        return res.status(404).json({ error: 'Rider not found' });
    } catch (error) {
        console.error('Error updating rider:', error);
        res.status(500).json({ error: 'Failed to update rider' });
    }
});

app.delete('/api/riders/:id', async (req, res) => {
    try {
        const success = await db.deleteRider(req.params.id);
        if (success) return res.json({ message: 'Rider deleted successfully' });
        return res.status(404).json({ error: 'Rider not found' });
    } catch (error) {
        console.error('Error deleting rider:', error);
        res.status(500).json({ error: 'Failed to delete rider' });
    }
});

app.post('/api/riders/seed', async (req, res) => {
    try {
        const riders = db.seedSampleRiders();
        res.json({ message: `${riders.length} sample riders created`, riders });
    } catch (error) {
        console.error('Error seeding riders:', error);
        res.status(500).json({ error: 'Failed to seed riders' });
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
    console.log(`✅ Server running successfully on port ${PORT}`);
});