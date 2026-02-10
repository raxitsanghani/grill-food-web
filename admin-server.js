const express = require('express');
const path = require('path');
const cors = require('cors');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const http = require('http');
const socketIo = require('socket.io');
const LocalDatabase = require('./local-db');
let db;
try {
  if (process.env.MONGODB_URI || process.env.MONGO_URL) {
    const MongoDatabase = require('./services/mongo-db');
    db = new MongoDatabase();
    console.log('✅ MongoDB mode enabled (admin)');
  } else {
    db = new LocalDatabase();
    console.log('ℹ️  Using Local JSON Database (admin)');
  }
} catch (e) {
  console.warn('⚠️  MongoDB init failed (admin), falling back to Local JSON DB:', e.message);
  db = new LocalDatabase();
}
require('dotenv').config();

const ADMIN_PORT = process.env.ADMIN_PORT || 4001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: ["http://localhost:4000", "http://localhost:4001"],
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

// Database initialized above (MongoDB or Local JSON)

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased limit for Base64 images
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Also handle URL-encoded data
app.use(express.static(path.join(__dirname, 'admin-panel')));

// Add raw body parser for debugging
app.use((req, res, next) => {
    if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
        console.log(`Request to ${req.path} - Content-Type: ${req.headers['content-type']}`);
        console.log(`Request body size: ${JSON.stringify(req.body).length} characters`);
    }
    next();
});

// Local database is already initialized above

// Authentication Middleware
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

// Check if admin exists
const checkAdminExists = async () => {
    try {
        const admins = db.getAllAdmins();
        return admins.length > 0;
    } catch (error) {
        console.error('Error checking admin existence:', error);
        return false;
    }
};

// Routes

// Check if admin setup is required (always allow signup)
app.get('/api/admin/setup-status', async (req, res) => {
    try {
        // Always allow signup, but check if any admin exists
        const adminExists = await checkAdminExists();
        res.json({ 
            requiresSetup: false, // Always show login first
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

        // Check if email already exists (one email per account)
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

// Health check endpoint
app.get('/api/admin/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        database: 'Local JSON Database',
        server: 'Admin Server'
    });
});

// Get admin profile
app.get('/api/admin/profile', authenticateAdmin, async (req, res) => {
    try {
        // Return the admin info from the request (already authenticated)
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

// -----------------------------
// Chefs API (used by Admin UI)
// -----------------------------
app.get('/api/chefs', (req, res) => {
    try {
        const chefs = db.getAllChefs();
        res.json(chefs);
    } catch (error) {
        console.error('Error fetching chefs:', error);
        res.status(500).json({ error: 'Failed to fetch chefs' });
    }
});

app.get('/api/chefs/active', (req, res) => {
    try {
        const chefs = db.getActiveChefs();
        res.json(chefs);
    } catch (error) {
        console.error('Error fetching active chefs:', error);
        res.status(500).json({ error: 'Failed to fetch active chefs' });
    }
});

app.get('/api/chefs/:id', (req, res) => {
    try {
        const chef = db.getChefById(req.params.id);
        if (chef) {
            res.json(chef);
        } else {
            res.status(404).json({ error: 'Chef not found' });
        }
    } catch (error) {
        console.error('Error fetching chef:', error);
        res.status(500).json({ error: 'Failed to fetch chef' });
    }
});

app.post('/api/chefs', (req, res) => {
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

        const chef = db.createChef({
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

app.put('/api/chefs/:id', (req, res) => {
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

        const chef = db.updateChef(req.params.id, updates);
        if (chef) return res.json(chef);
        return res.status(404).json({ error: 'Chef not found' });
    } catch (error) {
        console.error('Error updating chef:', error);
        return res.status(500).json({ error: 'Failed to update chef' });
    }
});

app.delete('/api/chefs/:id', (req, res) => {
    try {
        const success = db.deleteChef(req.params.id);
        if (success) return res.json({ message: 'Chef deleted successfully' });
        return res.status(404).json({ error: 'Chef not found' });
    } catch (error) {
        console.error('Error deleting chef:', error);
        return res.status(500).json({ error: 'Failed to delete chef' });
    }
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

// Serve admin panel files
app.get('/admin/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-panel', 'dashboard.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-panel', 'index.html'));
});

// Serve admin panel
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-panel', 'index.html'));
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
server.listen(ADMIN_PORT, () => {
    console.log(`🚀 Admin Server is running on http://localhost:${ADMIN_PORT}`);
    console.log(`📊 Using Local JSON Database`);
});
