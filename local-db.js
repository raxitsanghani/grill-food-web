const fs = require('fs');
const path = require('path');

class LocalDatabase {
    constructor() {
        this.dbPath = path.join(__dirname, 'data');
        this.menuItemsPath = path.join(this.dbPath, 'menu-items.json');
        this.ordersPath = path.join(this.dbPath, 'orders.json');
        this.adminsPath = path.join(this.dbPath, 'admins.json');
        
        this.ensureDataDirectory();
        this.initializeDefaultData();
    }

    ensureDataDirectory() {
        if (!fs.existsSync(this.dbPath)) {
            fs.mkdirSync(this.dbPath, { recursive: true });
        }
    }

    initializeDefaultData() {
        // Initialize menu items if they don't exist
        if (!fs.existsSync(this.menuItemsPath)) {
            const defaultItems = [
                {
                    _id: '1',
                    name: 'Greek Salad',
                    type: 'veg',
                    category: 'salads',
                    price: 299.00,
                    badge: 'Seasonal',
                    image: './assets/images/menu-1.png',
                    description: 'Fresh tomatoes, green bell pepper, sliced cucumber, onion, olives, and feta cheese with olive oil dressing.',
                    deliveryTime: '25-35 minutes',
                    prepTime: 15,
                    createdAt: new Date()
                },
                {
                    _id: '2',
                    name: 'Lasagne',
                    type: 'non-veg',
                    category: 'main-course',
                    price: 399.00,
                    badge: 'Popular',
                    image: './assets/images/menu-2.png',
                    description: 'Vegetables, cheeses, ground meats, tomato sauce, seasonings and spices.',
                    deliveryTime: '25-35 minutes',
                    prepTime: 20,
                    createdAt: new Date()
                },
                {
                    _id: '3',
                    name: 'Butter Chicken',
                    type: 'non-veg',
                    category: 'main-course',
                    price: 499.00,
                    badge: 'Chef Special',
                    image: './assets/images/menu-3.png',
                    description: 'Tender chicken cooked in a rich, creamy tomato-based sauce with aromatic spices.',
                    deliveryTime: '30-40 minutes',
                    prepTime: 25,
                    createdAt: new Date()
                },
                {
                    _id: '4',
                    name: 'Margherita Pizza',
                    type: 'veg',
                    category: 'pizza',
                    price: 349.00,
                    badge: 'Classic',
                    image: './assets/images/menu-4.png',
                    description: 'Fresh mozzarella, tomato sauce, and basil on a crispy crust.',
                    deliveryTime: '20-30 minutes',
                    prepTime: 18,
                    createdAt: new Date()
                },
                {
                    _id: '5',
                    name: 'Pasta Carbonara',
                    type: 'non-veg',
                    category: 'pasta',
                    price: 379.00,
                    badge: 'Italian',
                    image: './assets/images/menu-5.png',
                    description: 'Creamy pasta with eggs, cheese, pancetta, and black pepper.',
                    deliveryTime: '25-35 minutes',
                    prepTime: 22,
                    createdAt: new Date()
                },
                {
                    _id: '6',
                    name: 'Vegetable Biryani',
                    type: 'veg',
                    category: 'rice',
                    price: 359.00,
                    badge: 'Spicy',
                    image: './assets/images/menu-6.png',
                    description: 'Fragrant basmati rice cooked with aromatic spices and fresh vegetables.',
                    deliveryTime: '35-45 minutes',
                    prepTime: 30,
                    createdAt: new Date()
                }
            ];
            this.writeFile(this.menuItemsPath, defaultItems);
        }

        // Initialize empty orders array
        if (!fs.existsSync(this.ordersPath)) {
            this.writeFile(this.ordersPath, []);
        }

        // Initialize empty admins array
        if (!fs.existsSync(this.adminsPath)) {
            this.writeFile(this.adminsPath, []);
        }
    }

    readFile(filePath) {
        try {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return [];
        }
    }

    writeFile(filePath, data) {
        try {
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.error('Error writing to file:', error);
            return false;
        }
    }

    // Menu Items
    getAllMenuItems() {
        return this.readFile(this.menuItemsPath);
    }

    getMenuItemById(id) {
        const items = this.readFile(this.menuItemsPath);
        return items.find(item => item._id === id);
    }

    getMenuItemsByCategory(category) {
        const items = this.readFile(this.menuItemsPath);
        return items.filter(item => item.category === category);
    }

    createMenuItem(itemData) {
        const items = this.readFile(this.menuItemsPath);
        
        // Ensure image path is properly formatted for both admin and user panels
        // Handle image - could be base64, URL, or relative path
        let imagePath = itemData.image;
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
        
        const newItem = {
            _id: Date.now().toString(),
            ...itemData,
            image: imagePath,
            createdAt: new Date()
        };
        items.push(newItem);
        this.writeFile(this.menuItemsPath, items);
        return newItem;
    }

    updateMenuItem(id, updateData) {
        try {
            console.log('Updating menu item with ID:', id);
            console.log('Update data:', updateData);
            
            const items = this.readFile(this.menuItemsPath);
            console.log('Current items count:', items.length);
            
            const index = items.findIndex(item => item._id === id);
            console.log('Found item at index:', index);
            
            if (index !== -1) {
                const updatedItem = { ...items[index], ...updateData };
                console.log('Updated item:', updatedItem);
                
                items[index] = updatedItem;
                this.writeFile(this.menuItemsPath, items);
                console.log('Menu item updated successfully');
                
                return updatedItem;
            } else {
                console.log('Menu item not found with ID:', id);
                return null;
            }
        } catch (error) {
            console.error('Error in updateMenuItem:', error);
            throw error;
        }
    }

    deleteMenuItem(id) {
        const items = this.readFile(this.menuItemsPath);
        const filteredItems = items.filter(item => item._id !== id);
        this.writeFile(this.menuItemsPath, filteredItems);
        return true;
    }

    // Orders
    getAllOrders() {
        const orders = this.readFile(this.ordersPath);
        // Sort orders by creation date (newest first)
        return orders.sort((a, b) => {
            const dateA = new Date(a.orderDate || a.createdAt || 0);
            const dateB = new Date(b.orderDate || b.createdAt || 0);
            return dateB - dateA; // Newest first
        });
    }

    createOrder(orderData) {
        const orders = this.readFile(this.ordersPath);
        const newOrder = {
            _id: Date.now().toString(),
            ...orderData,
            orderDate: new Date(),
            createdAt: new Date(), // Add creation timestamp for sorting
            status: 'pending'
        };
        orders.push(newOrder);
        this.writeFile(this.ordersPath, orders);
        return newOrder;
    }

    updateOrderStatus(id, status, adminNotes) {
        const orders = this.readFile(this.ordersPath);
        const index = orders.findIndex(order => order._id === id);
        if (index !== -1) {
            orders[index].status = status;
            orders[index].adminNotes = adminNotes;
            orders[index].updatedAt = new Date();
            this.writeFile(this.ordersPath, orders);
            return orders[index];
        }
        return null;
    }

    // Admins
    getAllAdmins() {
        return this.readFile(this.adminsPath);
    }

    getAdminByEmail(email) {
        const admins = this.readFile(this.adminsPath);
        return admins.find(admin => admin.email === email);
    }

    getAdminById(id) {
        const admins = this.readFile(this.adminsPath);
        return admins.find(admin => admin._id === id);
    }

    createAdmin(adminData) {
        const admins = this.readFile(this.adminsPath);
        const newAdmin = {
            _id: Date.now().toString(),
            ...adminData,
            createdAt: new Date()
        };
        admins.push(newAdmin);
        this.writeFile(this.adminsPath, admins);
        return newAdmin;
    }

    // Dashboard Stats
    getDashboardStats() {
        const orders = this.readFile(this.ordersPath);
        const menuItems = this.readFile(this.menuItemsPath);
        
        const today = new Date();
        const todayOrders = orders.filter(order => {
            const orderDate = new Date(order.orderDate);
            return orderDate.toDateString() === today.toDateString();
        });

        const todayRevenue = todayOrders.reduce((sum, order) => sum + order.totalPrice, 0);
        const pendingOrders = orders.filter(order => order.status === 'pending').length;

        return {
            totalOrders: orders.length,
            pendingOrders,
            totalMenuItems: menuItems.length,
            todayRevenue
        };
    }

    // User Management Methods

    getAllUsers() {
        try {
            const usersPath = path.join(__dirname, 'data', 'users.json');
            if (!fs.existsSync(usersPath)) {
                return [];
            }
            const data = fs.readFileSync(usersPath, 'utf8');
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error reading users:', error);
            return [];
        }
    }

    createUser(userData) {
        try {
            const users = this.getAllUsers();
            const newUser = {
                _id: Date.now().toString(),
                fullName: userData.fullName,
                email: userData.email,
                phone: userData.phone,
                password: userData.password,
                createdAt: new Date().toISOString()
            };
            
            users.push(newUser);
            this.writeFile(path.join(__dirname, 'data', 'users.json'), users);
            
            return newUser;
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    getUserByEmail(email) {
        try {
            const users = this.getAllUsers();
            return users.find(user => user.email === email);
        } catch (error) {
            console.error('Error finding user by email:', error);
            return null;
        }
    }

    authenticateUser(email, password) {
        try {
            const user = this.getUserByEmail(email);
            if (user && user.password === password) {
                return user;
            }
            return null;
        } catch (error) {
            console.error('Error authenticating user:', error);
            return null;
        }
    }

    getOrdersByUserId(userId) {
        try {
            const orders = this.getAllOrders();
            // For now, return all orders since we need to add user association
            // In a real app, orders would have a userId field
            return orders;
        } catch (error) {
            console.error('Error getting user orders:', error);
            return [];
        }
    }
}

module.exports = LocalDatabase;
