class AdminPanel {
    constructor() {
        console.log('AdminPanel constructor called');
        this.socket = null;
        this.adminToken = null;
        this.currentEditingItem = null;
        this.currentOrderId = null;
        this.orders = [];
        this.menuItems = [];
        
        this.initializeEventListeners();
        this.initializeSocket();
        this.showLoadingScreen();
        console.log('AdminPanel constructor completed');
    }

    initializeEventListeners() {
        // Account creation form
        document.getElementById('accountCreationForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAccountCreation();
        });

        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.handleLogout();
        });

        // Menu item modal
        document.getElementById('addMenuItemBtn').addEventListener('click', () => {
            this.openMenuItemModal();
        });

        document.getElementById('closeMenuItemModal').addEventListener('click', () => {
            this.closeMenuItemModal();
        });

        document.getElementById('cancelMenuItem').addEventListener('click', () => {
            this.closeMenuItemModal();
        });

        document.getElementById('menuItemForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleMenuItemSubmit();
        });

        // Order modal
        document.getElementById('closeOrderModal').addEventListener('click', () => {
            this.closeOrderModal();
        });

        // Status filter
        document.getElementById('statusFilter').addEventListener('change', (e) => {
            this.filterOrders(e.target.value);
        });

        // Update status button
        document.getElementById('updateStatusBtn').addEventListener('click', () => {
            this.updateOrderStatus();
        });
    }

    showLoadingScreen() {
        // Show loading screen for 2 seconds
        setTimeout(() => {
            document.getElementById('loadingScreen').classList.remove('active');
            this.checkSetupStatus();
        }, 2000);
    }

    initializeSocket() {
        this.socket = io('http://localhost:4001');
        
        this.socket.on('connect', () => {
            console.log('Connected to admin server');
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from admin server');
        });

        this.socket.on('menu-updated', (data) => {
            this.handleMenuUpdate(data);
        });

        this.socket.on('order-status-updated', (data) => {
            this.handleOrderStatusUpdate(data);
        });

        this.socket.on('new-order', (order) => {
            this.handleNewOrder(order);
        });
    }

    async checkSetupStatus() {
        try {
            const response = await fetch('http://localhost:4001/api/admin/setup-status');
            const data = await response.json();
            
            if (data.adminExists) {
                // Admin exists, show login form
                this.showLogin();
            } else {
                // No admin exists, show account creation form
                this.showAccountCreation();
            }
        } catch (error) {
            console.error('Error checking setup status:', error);
            // Default to account creation if there's an error
            this.showAccountCreation();
        }
    }

    showAccountCreation() {
        document.getElementById('accountCreationModal').classList.add('active');
        document.getElementById('loginModal').classList.remove('active');
        document.getElementById('adminPanel').classList.add('hidden');
    }

    showLogin() {
        document.getElementById('accountCreationModal').classList.remove('active');
        document.getElementById('loginModal').classList.add('active');
        document.getElementById('adminPanel').classList.add('hidden');
    }

    showDashboard() {
        try {
            // Hide all modals and show admin panel
            const accountCreationModal = document.getElementById('accountCreationModal');
            const loginModal = document.getElementById('loginModal');
            const adminPanel = document.getElementById('adminPanel');
            const dashboard = document.getElementById('dashboard');
            const addItemsPage = document.getElementById('addItemsPage');
            const orderStatusPage = document.getElementById('orderStatusPage');
            
            console.log('Elements found:', {
                accountCreationModal: !!accountCreationModal,
                loginModal: !!loginModal,
                adminPanel: !!adminPanel,
                dashboard: !!dashboard,
                addItemsPage: !!addItemsPage,
                orderStatusPage: !!orderStatusPage
            });
            
            if (accountCreationModal) accountCreationModal.classList.remove('active');
            if (loginModal) loginModal.classList.remove('active');
            if (adminPanel) adminPanel.classList.remove('hidden');
            
            if (dashboard) {
                dashboard.classList.add('active');
                // Force display block as a fallback
                dashboard.style.display = 'block';
            }
            if (addItemsPage) addItemsPage.classList.remove('active');
            if (orderStatusPage) orderStatusPage.classList.remove('active');
            
            // Debug: Check final state
            console.log('Final dashboard state:', {
                classes: dashboard ? dashboard.className : 'not found',
                style: dashboard ? dashboard.style.display : 'not found',
                hidden: adminPanel ? adminPanel.classList.contains('hidden') : 'not found'
            });
            
            // Load admin info and dashboard data
            this.loadAdminInfo();
            this.loadDashboardStats();
            this.loadMenuItems();
            this.loadOrders();
            
            console.log('Dashboard shown successfully');
        } catch (error) {
            console.error('Error showing dashboard:', error);
            this.showNotification('Error loading dashboard', 'error');
        }
    }

    async loadAdminInfo() {
        try {
            const response = await fetch('http://localhost:4001/api/admin/profile', {
                headers: {
                    'Authorization': `Bearer ${this.adminToken}`
                }
            });

            if (response.ok) {
                const admin = await response.json();
                const adminInfoElement = document.getElementById('adminInfo');
                if (adminInfoElement) {
                    adminInfoElement.textContent = `Welcome, ${admin.fullName}`;
                }
            }
        } catch (error) {
            console.error('Error loading admin info:', error);
        }
    }

    async handleAccountCreation() {
        const fullName = document.getElementById('fullName').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const securityKey = document.getElementById('securityKey').value;

        const errorDiv = document.getElementById('accountCreationError');
        errorDiv.textContent = '';

        // Validation
        if (!fullName || !email || !phone || !password || !confirmPassword || !securityKey) {
            errorDiv.textContent = 'All fields are required';
            return;
        }

        if (password !== confirmPassword) {
            errorDiv.textContent = 'Passwords do not match';
            return;
        }

        if (password.length < 6) {
            errorDiv.textContent = 'Password must be at least 6 characters long';
            return;
        }

        if (securityKey.length !== 6 || !/^\d{6}$/.test(securityKey)) {
            errorDiv.textContent = 'Security key must be exactly 6 digits';
            return;
        }

        const formData = {
            fullName,
            email,
            phone,
            password,
            securityKey
        };

        try {
            const response = await fetch('http://localhost:4001/api/admin/setup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                this.adminToken = data.token;
                localStorage.setItem('adminToken', data.token);
                this.showNotification('Admin account created successfully!', 'success');
                // Clear form
                document.getElementById('accountCreationForm').reset();
                // Redirect to dashboard page
                setTimeout(() => {
                    window.location.href = './dashboard.html';
                }, 1000);
            } else {
                errorDiv.textContent = data.error || 'Account creation failed';
            }
        } catch (error) {
            console.error('Account creation error:', error);
            errorDiv.textContent = 'Network error. Please try again.';
        }
    }

    async handleLogin() {
        const formData = {
            email: document.getElementById('loginEmail').value,
            password: document.getElementById('loginPassword').value,
            securityKey: document.getElementById('loginSecurityKey').value
        };

        const errorDiv = document.getElementById('loginError');
        errorDiv.textContent = '';

        try {
            const response = await fetch('http://localhost:4001/api/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                this.adminToken = data.token;
                localStorage.setItem('adminToken', data.token);
                this.showNotification('Login successful!', 'success');
                
                // Clear form
                document.getElementById('loginForm').reset();
                
                console.log('Login successful, redirecting to dashboard...');
                // Redirect to separate dashboard page
                setTimeout(() => {
                    window.location.href = './dashboard.html';
                }, 1000);
            } else {
                errorDiv.textContent = data.error || 'Login failed';
            }
        } catch (error) {
            console.error('Login error:', error);
            errorDiv.textContent = 'Network error. Please try again.';
        }
    }

    handleLogout() {
        this.adminToken = null;
        localStorage.removeItem('adminToken');
        this.showNotification('Logged out successfully', 'info');
        this.showLogin();
    }

    async loadDashboardStats() {
        try {
            const response = await fetch('http://localhost:4001/api/admin/dashboard-stats', {
                headers: {
                    'Authorization': `Bearer ${this.adminToken}`
                }
            });

            if (response.ok) {
                const stats = await response.json();
                document.getElementById('totalOrders').textContent = stats.totalOrders;
                document.getElementById('pendingOrders').textContent = stats.pendingOrders;
                document.getElementById('totalMenuItems').textContent = stats.totalMenuItems;
                document.getElementById('todayRevenue').textContent = `₹${stats.todayRevenue}`;
            }
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
        }
    }

    async loadMenuItems() {
        try {
            const response = await fetch('http://localhost:4001/api/admin/menu-items', {
                headers: {
                    'Authorization': `Bearer ${this.adminToken}`
                }
            });

            if (response.ok) {
                this.menuItems = await response.json();
                this.renderMenuGrid();
            } 
        } catch (error) {
            console.error('Error loading menu items:', error);
        }
    }

    async loadOrders() {
        try {
            const response = await fetch('http://localhost:4001/api/admin/orders', {
                headers: {
                    'Authorization': `Bearer ${this.adminToken}`
                }
            });

            if (response.ok) {
                this.orders = await response.json();
                this.renderOrders();
            }
        } catch (error) {
            console.error('Error loading orders:', error);
        }
    }

    renderMenuGrid() {
        const grid = document.getElementById('menuGrid');
        grid.innerHTML = '';

        this.menuItems.forEach(item => {
            const itemCard = document.createElement('div');
            itemCard.className = 'menu-item-card';
            itemCard.innerHTML = `
                <div class="item-image">
                    <img src="${item.image}" alt="${item.name}" onerror="this.src='../grilli-master/assets/images/menu-1.png'">
                </div>
                <div class="item-details">
                    <h3>${item.name}</h3>
                    <p class="item-type ${item.type}">${item.type === 'veg' ? '🥬 Vegetarian' : '🍖 Non-Vegetarian'}</p>
                    <p class="item-price">₹${item.price}</p>
                    <p class="item-delivery">${item.deliveryTime || '25-35 minutes'}</p>
                    <p class="item-prep">Prep: ${item.prepTime || 15} min</p>
                    ${item.badge ? `<span class="item-badge">${item.badge}</span>` : ''}
                </div>
                <div class="item-actions">
                    <button class="edit-btn" onclick="adminPanel.editMenuItem('${item._id}')">✏️ Edit</button>
                    <button class="delete-btn" onclick="adminPanel.deleteMenuItem('${item._id}')">🗑️ Delete</button>
                </div>
            `;
            grid.appendChild(itemCard);
        });
    }

    renderOrders() {
        const container = document.getElementById('ordersContainer');
        container.innerHTML = '';

        this.orders.forEach(order => {
            const orderCard = document.createElement('div');
            orderCard.className = `order-card status-${order.status}`;
            orderCard.innerHTML = `
                <div class="order-header">
                    <h3>${order.itemName}</h3>
                    <span class="order-status ${order.status}">${this.formatStatus(order.status)}</span>
                </div>
                <div class="order-details">
                    <p><strong>Customer:</strong> ${order.customerName}</p>
                    <p><strong>Phone:</strong> ${order.customerPhone}</p>
                    <p><strong>Quantity:</strong> ${order.quantity}</p>
                    <p><strong>Total:</strong> ₹${order.totalPrice}</p>
                    <p><strong>Delivery:</strong> ${order.deliveryDate} at ${order.deliveryTime}</p>
                    <p><strong>Payment:</strong> ${order.paymentMethod}</p>
                    ${order.specialInstructions ? `<p><strong>Special Instructions:</strong> ${order.specialInstructions}</p>` : ''}
                    ${order.adminNotes ? `<p><strong>Admin Notes:</strong> ${order.adminNotes}</p>` : ''}
                </div>
                <div class="order-actions">
                    <button class="view-btn" onclick="adminPanel.viewOrderDetails('${order._id}')">View Details</button>
                </div>
            `;
            container.appendChild(orderCard);
        });
    }

    formatStatus(status) {
        const statusMap = {
            'pending': '⏳ Pending',
            'payment-done': '💰 Payment Done',
            'preparing': '👨‍🍳 Preparing',
            'out-for-delivery': '🚚 Out for Delivery',
            'delivered': '✅ Delivered',
            'rejected': '❌ Rejected'
        };
        return statusMap[status] || status;
    }

    filterOrders(status) {
        const filteredOrders = status ? this.orders.filter(order => order.status === status) : this.orders;
        this.renderFilteredOrders(filteredOrders);
    }

    renderFilteredOrders(orders) {
        const container = document.getElementById('ordersContainer');
        container.innerHTML = '';

        orders.forEach(order => {
            const orderCard = document.createElement('div');
            orderCard.className = `order-card status-${order.status}`;
            orderCard.innerHTML = `
                <div class="order-header">
                    <h3>${order.itemName}</h3>
                    <span class="order-status ${order.status}">${this.formatStatus(order.status)}</span>
                </div>
                <div class="order-details">
                    <p><strong>Customer:</strong> ${order.customerName}</p>
                    <p><strong>Phone:</strong> ${order.customerPhone}</p>
                    <p><strong>Quantity:</strong> ${order.quantity}</p>
                    <p><strong>Total:</strong> ₹${order.totalPrice}</p>
                    <p><strong>Delivery:</strong> ${order.deliveryDate} at ${order.deliveryTime}</p>
                    <p><strong>Payment:</strong> ${order.paymentMethod}</p>
                    ${order.specialInstructions ? `<p><strong>Special Instructions:</strong> ${order.specialInstructions}</p>` : ''}
                    ${order.adminNotes ? `<p><strong>Admin Notes:</strong> ${order.adminNotes}</p>` : ''}
                </div>
                <div class="order-actions">
                    <button class="view-btn" onclick="adminPanel.viewOrderDetails('${order._id}')">View Details</button>
                </div>
            `;
            container.appendChild(orderCard);
        });
    }

    openMenuItemModal(itemId = null) {
        this.currentEditingItem = itemId;
        const modal = document.getElementById('menuItemModal');
        const title = document.getElementById('menuItemModalTitle');
        const form = document.getElementById('menuItemForm');

        if (itemId) {
            const item = this.menuItems.find(i => i._id === itemId);
            if (item) {
                title.textContent = 'Edit Menu Item';
                document.getElementById('itemName').value = item.name;
                document.getElementById('itemType').value = item.type;
                document.getElementById('itemPrice').value = item.price;
                document.getElementById('itemBadge').value = item.badge || '';
                document.getElementById('itemDeliveryTime').value = item.deliveryTime || '25-35 minutes';
                document.getElementById('itemPrepTime').value = item.prepTime || 15;
                document.getElementById('itemDescription').value = item.description || '';
                document.getElementById('itemImage').value = item.image;
            }
        } else {
            title.textContent = 'Add New Menu Item';
            form.reset();
            document.getElementById('itemDeliveryTime').value = '25-35 minutes';
            document.getElementById('itemPrepTime').value = 15;
        }

        modal.classList.add('active');
    }

    closeMenuItemModal() {
        document.getElementById('menuItemModal').classList.remove('active');
        this.currentEditingItem = null;
    }

    async handleMenuItemSubmit() {
        const formData = {
            name: document.getElementById('itemName').value,
            type: document.getElementById('itemType').value,
            price: parseFloat(document.getElementById('itemPrice').value),
            badge: document.getElementById('itemBadge').value,
            deliveryTime: document.getElementById('itemDeliveryTime').value,
            prepTime: parseInt(document.getElementById('itemPrepTime').value),
            description: document.getElementById('itemDescription').value,
            image: document.getElementById('itemImage').value
        };

        // Validation
        if (!formData.name || !formData.type || !formData.price || !formData.description || !formData.image) {
            this.showNotification('Please fill in all required fields', 'error');
            return;
        }

        if (formData.price <= 0) {
            this.showNotification('Price must be greater than 0', 'error');
            return;
        }

        try {
            const url = this.currentEditingItem 
                ? `http://localhost:4001/api/admin/menu-items/${this.currentEditingItem}`
                : 'http://localhost:4001/api/admin/menu-items';
            
            const method = this.currentEditingItem ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.adminToken}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const message = this.currentEditingItem ? 'Menu item updated successfully!' : 'Menu item added successfully!';
                this.showNotification(message, 'success');
                this.closeMenuItemModal();
                
                // Refresh the menu items
                await this.loadMenuItems();
                this.loadDashboardStats();
            } else {
                const data = await response.json();
                this.showNotification(data.error || 'Operation failed', 'error');
            }
        } catch (error) {
            console.error('Menu item operation error:', error);
            this.showNotification('Network error. Please try again.', 'error');
        }
    }

    async deleteMenuItem(itemId) {
        if (!confirm('Are you sure you want to delete this menu item?')) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:4001/api/admin/menu-items/${itemId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.adminToken}`
                }
            });

            if (response.ok) {
                this.showNotification('Menu item deleted successfully!', 'success');
                this.loadMenuItems();
                this.loadDashboardStats();
            } else {
                const data = await response.json();
                this.showNotification(data.error || 'Deletion failed', 'error');
            }
        } catch (error) {
            console.error('Delete error:', error);
            this.showNotification('Network error. Please try again.', 'error');
        }
    }

    editMenuItem(itemId) {
        this.openMenuItemModal(itemId);
    }

    async viewOrderDetails(orderId) {
        this.currentOrderId = orderId;
        const order = this.orders.find(o => o._id === orderId);
        
        if (order) {
            const detailsDiv = document.getElementById('orderDetails');
            detailsDiv.innerHTML = `
                <div class="order-info">
                    <h3>${order.itemName}</h3>
                    <div class="order-meta">
                        <p><strong>Order ID:</strong> ${order._id}</p>
                        <p><strong>Customer:</strong> ${order.customerName}</p>
                        <p><strong>Phone:</strong> ${order.customerPhone}</p>
                        <p><strong>Email:</strong> ${order.customerEmail || 'Not provided'}</p>
                        <p><strong>Quantity:</strong> ${order.quantity}</p>
                        <p><strong>Unit Price:</strong> ₹${order.unitPrice}</p>
                        <p><strong>Total Price:</strong> ₹${order.totalPrice}</p>
                        <p><strong>Delivery Date:</strong> ${order.deliveryDate}</p>
                        <p><strong>Delivery Time:</strong> ${order.deliveryTime}</p>
                        <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
                        <p><strong>Order Date:</strong> ${new Date(order.orderDate).toLocaleString()}</p>
                        ${order.specialInstructions ? `<p><strong>Special Instructions:</strong> ${order.specialInstructions}</p>` : ''}
                    </div>
                </div>
            `;

            document.getElementById('orderStatus').value = order.status;
            document.getElementById('adminNotes').value = order.adminNotes || '';
            
            document.getElementById('orderModal').classList.add('active');
        }
    }

    closeOrderModal() {
        document.getElementById('orderModal').classList.remove('active');
        this.currentOrderId = null;
    }

    async updateOrderStatus() {
        const status = document.getElementById('orderStatus').value;
        const adminNotes = document.getElementById('adminNotes').value;

        try {
            const response = await fetch(`http://localhost:4001/api/admin/orders/${this.currentOrderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.adminToken}`
                },
                body: JSON.stringify({ status, adminNotes })
            });

            if (response.ok) {
                this.showNotification('Order status updated successfully!', 'success');
                this.closeOrderModal();
                
                // Update the order in the local array
                const orderIndex = this.orders.findIndex(order => order._id === this.currentOrderId);
                if (orderIndex !== -1) {
                    this.orders[orderIndex].status = status;
                    this.orders[orderIndex].adminNotes = adminNotes;
                }
                
                // Refresh the display
                this.renderOrders();
                this.loadDashboardStats();
            } else {
                const data = await response.json();
                this.showNotification(data.error || 'Status update failed', 'error');
            }
        } catch (error) {
            console.error('Status update error:', error);
            this.showNotification('Network error. Please try again.', 'error');
        }
    }

    showAddItems() {
        document.getElementById('dashboard').classList.remove('active');
        document.getElementById('addItemsPage').classList.add('active');
        document.getElementById('orderStatusPage').classList.remove('active');
    }

    showUpdateOrders() {
        document.getElementById('dashboard').classList.remove('active');
        document.getElementById('addItemsPage').classList.remove('active');
        document.getElementById('orderStatusPage').classList.add('active');
    }

    showDashboard() {
        document.getElementById('dashboard').classList.add('active');
        document.getElementById('addItemsPage').classList.remove('active');
        document.getElementById('orderStatusPage').classList.remove('active');
    }

    showNotification(message, type = 'info') {
        const toast = document.getElementById('notificationToast');
        toast.textContent = message;
        toast.className = `notification-toast ${type}`;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    handleMenuUpdate(data) {
        if (data.action === 'item-added') {
            // Add new item to the beginning of the list
            this.menuItems.unshift(data.item);
        } else if (data.action === 'item-updated') {
            // Update existing item
            const index = this.menuItems.findIndex(item => item._id === data.item._id);
            if (index !== -1) {
                this.menuItems[index] = data.item;
            }
        } else if (data.action === 'item-deleted') {
            // Remove deleted item
            this.menuItems = this.menuItems.filter(item => item._id !== data.itemId);
        }
        
        // Refresh the display
        this.renderMenuGrid();
        this.loadDashboardStats();
    }

    handleOrderStatusUpdate(data) {
        // Update the order in the local array
        const orderIndex = this.orders.findIndex(order => order._id === data.orderId);
        if (orderIndex !== -1) {
            this.orders[orderIndex].status = data.status;
            this.orders[orderIndex].adminNotes = data.adminNotes;
        }
        
        // Refresh the display
        this.renderOrders();
        this.loadDashboardStats();
    }

    handleNewOrder(order) {
        // Add new order to the beginning of the list
        this.orders.unshift(order);
        
        // Refresh the display if on orders page
        if (document.getElementById('orderStatusPage').classList.contains('active')) {
            this.renderOrders();
        }
        
        this.loadDashboardStats();
        
        // Show notification
        this.showNotification('New order received!', 'success');
    }








}

// Global functions for onclick handlers
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const type = input.type === 'password' ? 'text' : 'password';
    input.type = type;
}

function showSignup() {
    adminPanel.showAccountCreation();
}

function showLogin() {
    adminPanel.showLogin();
}

function showAddItems() {
    adminPanel.showAddItems();
}

function showUpdateOrders() {
    adminPanel.showUpdateOrders();
}

function showDashboard() {
    adminPanel.showDashboard();
}

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
});
