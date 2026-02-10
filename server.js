const express = require('express');
const path = require('path');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const LocalDatabase = require('./local-db');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: ["http://localhost:4000", "http://localhost:4001"],
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 4000;

// Initialize local database
const db = new LocalDatabase();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Authentication middleware removed - using local database

// Serve static files from the project directory (grilli-master subfolder)
const projectDir = path.join(__dirname, 'grilli-master');
app.use(express.static(projectDir));

// Authentication routes removed - using local database for simple ordering

// API Routes

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

// Get menu items for specific category
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
 // Get individual menu item by ID
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

// Listen for menu updates from admin server
io.on('connection', (socket) => {
    console.log('User connected to main server');
    
    socket.on('disconnect', () => {
        console.log('User disconnected from main server');
    });
});

// Menu update endpoint for admin server
app.post('/api/menu-update', async (req, res) => {
    try {
        const { action, item, itemId } = req.body;
        
        // Emit to all connected users
        io.emit('menu-updated', { action, item, itemId });
        
        res.json({ success: true, message: 'Menu update broadcasted' });
    } catch (error) {
        console.error('Error broadcasting menu update:', error);
        res.status(500).json({ error: 'Failed to broadcast menu update' });
    }
});

// Place order (no authentication required for user panel)
app.post('/api/orders', async (req, res) => {
    try {
        const orderData = req.body;
        
        // Validate required fields
        if (!orderData.itemId || !orderData.customerName || !orderData.customerPhone) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // Ensure all price fields are numbers
        orderData.subtotal = parseFloat(orderData.subtotal) || 0;
        orderData.gstAmount = parseFloat(orderData.gstAmount) || 0;
        orderData.deliveryCharge = parseFloat(orderData.deliveryCharge) || 0;
        orderData.totalPrice = parseFloat(orderData.totalPrice) || 0;
        
        // Create order
        const order = db.createOrder(orderData);
        
        // Emit real-time update to admin panel
        io.emit('new-order', order);
        
        res.status(201).json(order);
    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).json({ error: 'Failed to place order' });
    }
});

// Order status update endpoint (receives updates from admin server)
app.post('/api/order-status-update', async (req, res) => {
    try {
        const { orderId, status, adminNotes, order } = req.body;
        
        // Validate required fields
        if (!orderId || !status) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // Update order in local database
        const updatedOrder = db.updateOrderStatus(orderId, status, adminNotes);
        
        if (!updatedOrder) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        // Broadcast to all connected user clients
        io.emit('order-status-updated', { 
            orderId, 
            status, 
            adminNotes, 
            order: updatedOrder 
        });
        
        console.log(`✅ Order status updated: ${orderId} -> ${status}`);
        
        res.json({ success: true, message: 'Order status update broadcasted' });
    } catch (error) {
        console.error('Error broadcasting order status update:', error);
        res.status(500).json({ error: 'Failed to broadcast order status update' });
    }
});

// Get all orders (no authentication required for user panel)
app.get('/api/orders', async (req, res) => {
    try {
        const orders = db.getAllOrders();
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// User Authentication Endpoints

// Check if user accounts exist
app.get('/api/users/check-setup', async (req, res) => {
    try {
        const users = db.getAllUsers();
        res.json({ hasUsers: users.length > 0 });
    } catch (error) {
        console.error('Error checking user setup:', error);
        res.status(500).json({ error: 'Failed to check user setup' });
    }
});

// User registration
app.post('/api/users/register', async (req, res) => {
    try {
        const { fullName, email, phone, password } = req.body;
        
        // Validate required fields
        if (!fullName || !email || !phone || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        // Check if user already exists
        const existingUser = db.getUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }
        
        // Create new user
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

// User login
app.post('/api/users/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        
        // Authenticate user
        const user = db.authenticateUser(email, password);
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        // Generate simple token (in production, use JWT)
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

// Get user orders (requires authentication)
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
        
        // Get orders for this user
        const userOrders = db.getOrdersByUserId(userId);
        res.json(userOrders);
    } catch (error) {
        console.error('Error fetching user orders:', error);
        res.status(500).json({ error: 'Failed to fetch user orders' });
    }
});

// Get menu items (public endpoint)
app.get('/api/menu', async (req, res) => {
    try {
        const menuItems = db.getAllMenuItems();
        res.json(menuItems);
    } catch (error) {
        console.error('Error fetching menu items:', error);
        res.status(500).json({ error: 'Failed to fetch menu items' });
    }
});

// Initialize default menu items if database is empty
app.post('/api/init-menu', async (req, res) => {
    try {
        const menuItems = db.getAllMenuItems();
        res.json({ message: 'Menu items ready', count: menuItems.length });
    } catch (error) {
        console.error('Error initializing menu:', error);
        res.status(500).json({ error: 'Failed to initialize menu' });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        database: 'Local JSON Database'
    });
});

// Frontend Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(projectDir, 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(projectDir, 'index.html'));
});

app.get('/test', (req, res) => {
    res.sendFile(path.join(projectDir, 'index.html'));
});

app.get('/test-ordering', (req, res) => {
  res.sendFile(path.join(__dirname, 'test-ordering.html'));
});

app.get('/test-fixes', (req, res) => {
  res.sendFile(path.join(__dirname, 'test-fixes.html'));
});

app.get('/test-topbar-update', (req, res) => {
  res.sendFile(path.join(__dirname, 'test-topbar-update.html'));
});

// Messaging API Routes

// Get messages by customer ID
app.get('/api/messages', async (req, res) => {
    try {
        const { customerId } = req.query;
        if (!customerId) {
            return res.status(400).json({ error: 'Customer ID is required' });
        }
        const messages = db.getMessagesByCustomerId(customerId);
        res.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// Create new message
app.post('/api/messages', async (req, res) => {
    try {
        const messageData = req.body;
        
        if (!messageData.customerId || !messageData.content) {
            return res.status(400).json({ error: 'Customer ID and content are required' });
        }
        
        const message = db.createMessage(messageData);
        
        // Emit to all connected clients
        io.emit('newMessage', message);
        
        // If message is from customer, notify admin
        if (message.sender === 'customer') {
            io.emit('newCustomerMessage', message);
        }
        
        res.status(201).json(message);
    } catch (error) {
        console.error('Error creating message:', error);
        res.status(500).json({ error: 'Failed to create message' });
    }
});

// Get conversations list (for admin)
app.get('/api/messages/conversations', async (req, res) => {
    try {
        const conversations = db.getConversations();
        res.json(conversations);
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ error: 'Failed to fetch conversations' });
    }
});

// Mark messages as read
app.post('/api/messages/read', async (req, res) => {
    try {
        const { customerId } = req.body;
        if (!customerId) {
            return res.status(400).json({ error: 'Customer ID is required' });
        }
        db.markMessagesAsRead(customerId);
        
        // Emit read status update
        io.emit('messagesRead', { customerId });
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({ error: 'Failed to mark messages as read' });
    }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('🔌 User client connected:', socket.id);
    
    // Join chat room
    socket.on('joinChat', (data) => {
        const { customerId, orderId } = data;
        if (customerId) {
            socket.join(`customer_${customerId}`);
            console.log(`📱 Customer ${customerId} joined chat room`);
        }
        if (orderId) {
            socket.join(`order_${orderId}`);
        }
    });

    // Join admin room
    socket.on('joinAdminRoom', () => {
        socket.join('admin_room');
        console.log('👤 Admin joined admin room');
    });

    // Send message from customer
    socket.on('sendMessage', async (data) => {
        try {
            const message = db.createMessage({
                ...data,
                sender: 'customer'
            });
            
            // Emit to customer's room
            io.to(`customer_${data.customerId}`).emit('message', message);
            
            // Emit to admin room
            io.to('admin_room').emit('newMessage', message);
            
            console.log(`💬 Message from customer ${data.customerId}`);
        } catch (error) {
            console.error('Error handling sendMessage:', error);
        }
    });

    // Send message from admin
    socket.on('sendAdminMessage', async (data) => {
        try {
            const message = db.createMessage({
                ...data,
                sender: 'admin'
            });
            
            // Emit to customer's room
            io.to(`customer_${data.customerId}`).emit('message', message);
            
            // Emit to admin room
            io.to('admin_room').emit('newMessage', message);
            
            console.log(`💬 Message from admin to customer ${data.customerId}`);
        } catch (error) {
            console.error('Error handling sendAdminMessage:', error);
        }
    });

    // Typing indicator
    socket.on('typing', (data) => {
        const { customerId } = data;
        socket.to('admin_room').emit('typing', data);
        socket.to(`customer_${customerId}`).emit('typing', data);
    });

    socket.on('typingStop', (data) => {
        const { customerId } = data;
        socket.to('admin_room').emit('typingStop', data);
        socket.to(`customer_${customerId}`).emit('typingStop', data);
    });

    // Message read status
    socket.on('messageRead', (data) => {
        const { messageId, customerId } = data;
        socket.to(`customer_${customerId}`).emit('messageRead', { messageId });
    });
    
    socket.on('disconnect', () => {
        console.log('🔌 User client disconnected:', socket.id);
    });
});

app.use((req, res) => {
    res.status(404).sendFile(path.join(projectDir, 'index.html'));
});

server.listen(PORT, () => {
    console.log(`🚀 User Server is running on http://localhost:${PORT}`);
    console.log(`📊 Using Local JSON Database`);
});
