const mongoose = require('mongoose');

class MongoDatabase {
  constructor() {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URL;
    if (!uri) {
      throw new Error('MONGODB_URI not set');
    }
    this._connect(uri);
    this._initModels();
  }

  _connect(uri) {
    mongoose.set('strictQuery', true);
    if (mongoose.connection.readyState === 1) return;
    
    mongoose.connect(uri, {
      dbName: process.env.MONGODB_DB || undefined,
    }).then(() => {
      console.log('✅ MongoDB connected successfully');
    }).catch((e) => {
      console.error('❌ MongoDB connection error:', e.message);
      throw e;
    });
  }

  _initModels() {
    const commonOpts = { timestamps: true, versionKey: false };

    this.MenuItem = mongoose.models.MenuItem || mongoose.model('MenuItem', new mongoose.Schema({
      name: String,
      type: String,
      category: String,
      price: Number,
      badge: String,
      image: String,
      description: String,
      deliveryTime: String,
      prepTime: Number,
    }, commonOpts));

    this.Order = mongoose.models.Order || mongoose.model('Order', new mongoose.Schema({
      // Support single-item and multi-item (cart) orders
      items: [{
        itemId: String,
        name: String,
        price: Number,
        quantity: Number,
        image: String
      }],
      orderId: String,
      itemId: String,
      itemName: String,
      itemImage: String,
      unitPrice: Number,
      quantity: Number,
      subtotal: Number,
      discountAmount: Number,
      appliedDiscount: mongoose.Schema.Types.Mixed,
      gstAmount: Number,
      deliveryCharge: Number,
      totalPrice: Number, // finalTotal
      customerName: String,
      customerPhone: String,
      customerEmail: String,
      customerAddress: String,
      customerCity: String,
      customerPincode: String,
      paymentMethod: String,
      paymentStatus: String,
      paymentDetails: mongoose.Schema.Types.Mixed,
      specialInstructions: String,
      deliveryDate: String,
      deliveryTime: String,
      orderDate: Date,
      status: { type: String, default: 'pending' },
      assignedRider: mongoose.Schema.Types.Mixed,
      eta_minutes: Number,
      eta_seconds: Number,
      eta_set_at: Date,
      adminNotes: String,
      updatedAt: Date,
    }, commonOpts));

    this.Rider = mongoose.models.Rider || mongoose.model('Rider', new mongoose.Schema({
      full_name: String,
      phone: String,
      profile_photo: String,
      lat: Number,
      lng: Number,
      status: { type: String, default: 'available' },
      lastLocationUpdate: Date,
    }, commonOpts));

    this.Chef = mongoose.models.Chef || mongoose.model('Chef', new mongoose.Schema({
      fullName: String,
      profilePhoto: String,
      experience: String,
      specialties: [String],
      bio: String,
      rating: Number,
      status: { type: String, default: 'active' },
    }, commonOpts));

    this.Admin = mongoose.models.Admin || mongoose.model('Admin', new mongoose.Schema({
      fullName: String,
      email: String,
      password: String,
      securityKey: String,
      role: { type: String, default: 'admin' },
      status: { type: String, default: 'active' },
    }, commonOpts));

    this.User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
      fullName: String,
      email: String,
      password: String,
      phone: String,
      address: String,
      city: String,
      pincode: String,
      status: { type: String, default: 'active' },
    }, commonOpts));
  }

  // Menu methods
  async getAllMenuItems() { 
    try {
      return await this.MenuItem.find().lean(); 
    } catch (error) {
      console.error('Error fetching menu items from MongoDB:', error);
      return [];
    }
  }
  
  async getMenuItemById(id) { 
    try {
      return await this.MenuItem.findById(id).lean(); 
    } catch (error) {
      console.error('Error fetching menu item by ID from MongoDB:', error);
      return null;
    }
  }
  
  async createMenuItem(data) { 
    try {
      return await this.MenuItem.create(data); 
    } catch (error) {
      console.error('Error creating menu item in MongoDB:', error);
      throw error;
    }
  }
  
  async updateMenuItem(id, data) { 
    try {
      return await this.MenuItem.findByIdAndUpdate(id, data, { new: true }).lean(); 
    } catch (error) {
      console.error('Error updating menu item in MongoDB:', error);
      return null;
    }
  }
  
  async deleteMenuItem(id) { 
    try {
      await this.MenuItem.findByIdAndDelete(id); 
      return true; 
    } catch (error) {
      console.error('Error deleting menu item from MongoDB:', error);
      return false;
    }
  }

  // Orders
  async getAllOrders() { 
    try {
      return await this.Order.find().sort({ createdAt: -1 }).lean(); 
    } catch (error) {
      console.error('Error fetching orders from MongoDB:', error);
      return [];
    }
  }
  
  async createOrder(data) { 
    try {
      // Add timestamps
      data.createdAt = new Date();
      data.updatedAt = new Date();
      return await this.Order.create(data); 
    } catch (error) {
      console.error('Error creating order in MongoDB:', error);
      throw error;
    }
  }
  
  async updateOrderStatus(id, status, adminNotes) {
    try {
      return await this.Order.findByIdAndUpdate(id, { status, adminNotes, updatedAt: new Date() }, { new: true }).lean();
    } catch (error) {
      console.error('Error updating order status in MongoDB:', error);
      return null;
    }
  }
  
  async getOrderById(id) { 
    try {
      return await this.Order.findById(id).lean(); 
    } catch (error) {
      console.error('Error fetching order by ID from MongoDB:', error);
      return null;
    }
  }

  async deleteOrder(id) {
    try {
      const result = await this.Order.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      console.error('Error deleting order from MongoDB:', error);
      return false;
    }
  }

  // Admins
  async getAllAdmins() { 
    try {
      return await this.Admin.find().lean(); 
    } catch (error) {
      console.error('Error fetching admins from MongoDB:', error);
      return [];
    }
  }
  
  async getAdminById(id) { 
    try {
      return await this.Admin.findById(id).lean(); 
    } catch (error) {
      console.error('Error fetching admin by ID from MongoDB:', error);
      return null;
    }
  }
  
  async getAdminByEmail(email) { 
    try {
      return await this.Admin.findOne({ email }).lean(); 
    } catch (error) {
      console.error('Error fetching admin by email from MongoDB:', error);
      return null;
    }
  }
  
  async createAdmin(data) { 
    try {
      return await this.Admin.create(data); 
    } catch (error) {
      console.error('Error creating admin in MongoDB:', error);
      throw error;
    }
  }
  
  async updateAdmin(id, updates) { 
    try {
      return await this.Admin.findByIdAndUpdate(id, updates, { new: true }).lean(); 
    } catch (error) {
      console.error('Error updating admin in MongoDB:', error);
      return null;
    }
  }
  
  async deleteAdmin(id) { 
    try {
      await this.Admin.findByIdAndDelete(id); 
      return true; 
    } catch (error) {
      console.error('Error deleting admin from MongoDB:', error);
      return false;
    }
  }
  
  async authenticateAdmin(email, password) {
    try {
      const admin = await this.Admin.findOne({ email }).lean();
      return admin && admin.password === password ? admin : null;
    } catch (error) {
      console.error('Error authenticating admin in MongoDB:', error);
      return null;
    }
  }

  // Users
  async getAllUsers() { 
    try {
      return await this.User.find().lean(); 
    } catch (error) {
      console.error('Error fetching users from MongoDB:', error);
      return [];
    }
  }
  
  async getUserById(id) { 
    try {
      return await this.User.findById(id).lean(); 
    } catch (error) {
      console.error('Error fetching user by ID from MongoDB:', error);
      return null;
    }
  }
  
  async getUserByEmail(email) { 
    try {
      return await this.User.findOne({ email }).lean(); 
    } catch (error) {
      console.error('Error fetching user by email from MongoDB:', error);
      return null;
    }
  }
  
  async createUser(data) { 
    try {
      return await this.User.create(data); 
    } catch (error) {
      console.error('Error creating user in MongoDB:', error);
      throw error;
    }
  }
  
  async updateUser(id, updates) { 
    try {
      return await this.User.findByIdAndUpdate(id, updates, { new: true }).lean(); 
    } catch (error) {
      console.error('Error updating user in MongoDB:', error);
      return null;
    }
  }
  
  async deleteUser(id) { 
    try {
      await this.User.findByIdAndDelete(id); 
      return true; 
    } catch (error) {
      console.error('Error deleting user from MongoDB:', error);
      return false;
    }
  }
  
  async authenticateUser(email, password) {
    try {
      const user = await this.User.findOne({ email }).lean();
      return user && user.password === password ? user : null;
    } catch (error) {
      console.error('Error authenticating user in MongoDB:', error);
      return null;
    }
  }
  
  async getOrdersByUserId(userId) { 
    try {
      return await this.Order.find({ userId }).lean(); 
    } catch (error) {
      console.error('Error fetching user orders from MongoDB:', error);
      return [];
    }
  }

  // Riders
  async getAllRiders() { 
    try {
      return await this.Rider.find().lean(); 
    } catch (error) {
      console.error('Error fetching riders from MongoDB:', error);
      return [];
    }
  }
  
  async saveRiders(/* riders */) { return true; }
  
  async addRider(data) { 
    try {
      return await this.Rider.create(data); 
    } catch (error) {
      console.error('Error creating rider in MongoDB:', error);
      throw error;
    }
  }
  
  async updateRider(id, updates) { 
    try {
      return await this.Rider.findByIdAndUpdate(id, updates, { new: true }).lean(); 
    } catch (error) {
      console.error('Error updating rider in MongoDB:', error);
      return null;
    }
  }
  
  async deleteRider(id) { 
    try {
      await this.Rider.findByIdAndDelete(id); 
      return true; 
    } catch (error) {
      console.error('Error deleting rider from MongoDB:', error);
      return false;
    }
  }
  
  async getAvailableRiders() { 
    try {
      return await this.Rider.find({ status: 'available' }).lean(); 
    } catch (error) {
      console.error('Error fetching available riders from MongoDB:', error);
      return [];
    }
  }
  
  async assignRandomRider() {
    try {
      const riders = await this.getAvailableRiders();
      if (!riders.length) return null;
      return riders[Math.floor(Math.random() * riders.length)];
    } catch (error) {
      console.error('Error assigning random rider from MongoDB:', error);
      return null;
    }
  }
  
  async updateRiderLocation(id, lat, lng) {
    try {
      return await this.Rider.findByIdAndUpdate(id, { lat, lng, lastLocationUpdate: new Date() }, { new: true }).lean();
    } catch (error) {
      console.error('Error updating rider location in MongoDB:', error);
      return null;
    }
  }
  
  seedSampleRiders() { return []; }

  // Chefs
  async getAllChefs() { 
    try {
      return await this.Chef.find().lean(); 
    } catch (error) {
      console.error('Error fetching chefs from MongoDB:', error);
      return [];
    }
  }
  
  async getChefById(id) { 
    try {
      return await this.Chef.findById(id).lean(); 
    } catch (error) {
      console.error('Error fetching chef by ID from MongoDB:', error);
      return null;
    }
  }
  
  async createChef(data) { 
    try {
      return await this.Chef.create(data); 
    } catch (error) {
      console.error('Error creating chef in MongoDB:', error);
      throw error;
    }
  }
  
  async updateChef(id, updates) { 
    try {
      return await this.Chef.findByIdAndUpdate(id, updates, { new: true }).lean(); 
    } catch (error) {
      console.error('Error updating chef in MongoDB:', error);
      return null;
    }
  }
  
  async deleteChef(id) { 
    try {
      await this.Chef.findByIdAndDelete(id); 
      return true; 
    } catch (error) {
      console.error('Error deleting chef from MongoDB:', error);
      return false;
    }
  }
  
  async getActiveChefs() { 
    try {
      return await this.Chef.find({ status: 'active' }).lean(); 
    } catch (error) {
      console.error('Error fetching active chefs from MongoDB:', error);
      return [];
    }
  }

  // Additional methods needed for compatibility
  async getMenuItemsByCategory(category) {
    try {
      return await this.MenuItem.find({ category }).lean();
    } catch (error) {
      console.error('Error fetching menu items by category from MongoDB:', error);
      return [];
    }
  }

  async getDashboardStats() {
    try {
      const [totalOrders, totalMenuItems, totalUsers, totalRiders, totalChefs] = await Promise.all([
        this.Order.countDocuments(),
        this.MenuItem.countDocuments(),
        this.User.countDocuments(),
        this.Rider.countDocuments(),
        this.Chef.countDocuments()
      ]);

      // Get pending orders count
      const pendingOrders = await this.Order.countDocuments({ status: 'pending' });

      // Get today's revenue - try both createdAt and orderDate fields
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      
      // Try createdAt first (from timestamps), then orderDate as fallback
      let todayOrders = await this.Order.find({
        createdAt: {
          $gte: startOfDay,
          $lt: endOfDay
        }
      }).lean();

      // If no orders found with createdAt, try orderDate
      if (todayOrders.length === 0) {
        todayOrders = await this.Order.find({
          orderDate: {
            $gte: startOfDay,
            $lt: endOfDay
          }
        }).lean();
      }

      const todayRevenue = todayOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);

      const recentOrders = await this.Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

      return {
        totalOrders,
        pendingOrders,
        totalMenuItems,
        todayRevenue,
        totalUsers,
        totalRiders,
        totalChefs,
        recentOrders
      };
    } catch (error) {
      console.error('Error fetching dashboard stats from MongoDB:', error);
      return {
        totalOrders: 0,
        pendingOrders: 0,
        totalMenuItems: 0,
        todayRevenue: 0,
        totalUsers: 0,
        totalRiders: 0,
        totalChefs: 0,
        recentOrders: []
      };
    }
  }
}

module.exports = MongoDatabase;


