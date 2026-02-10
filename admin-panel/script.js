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
        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.handleLogout();
        });

        // Create Admin button
        document.getElementById('createAdminBtn').addEventListener('click', () => {
            window.location.href = '/admin/create-admin';
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
            this.checkAuthentication();
        }, 2000);
    }

    initializeSocket() {
        // Connect to the unified server on port 5000
        this.socket = io('http://localhost:5000');

        this.socket.on('connect', () => {
            console.log('Connected to unified server on port 5000');
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

    async checkAuthentication() {
        try {
            // Check if user is authenticated via session storage
            const isAuthenticated = sessionStorage.getItem('adminAuthenticated') === 'true';

            if (isAuthenticated) {
                // User is authenticated, show dashboard
                this.adminToken = 'authenticated'; // Set a dummy token for fixed admin
                this.showDashboard();
            } else {
                // User is not authenticated, show login modal
                this.showLogin();
            }
        } catch (error) {
            console.error('Error checking authentication:', error);
            // Show login if there's an error
            this.showLogin();
        }
    }

    showLogin() {
        // Hide auth check modal and show login modal
        document.getElementById('authCheck').classList.remove('active');
        document.getElementById('loginModal').classList.add('active');
        document.getElementById('adminPanel').classList.add('hidden');
    }

    showDashboard() {
        try {
            // Hide all modals and show admin panel
            const authCheck = document.getElementById('authCheck');
            const loginModal = document.getElementById('loginModal');
            const adminPanel = document.getElementById('adminPanel');
            const dashboard = document.getElementById('dashboard');
            const addItemsPage = document.getElementById('addItemsPage');
            const orderStatusPage = document.getElementById('orderStatusPage');

            console.log('Elements found:', {
                authCheck: !!authCheck,
                loginModal: !!loginModal,
                adminPanel: !!adminPanel,
                dashboard: !!dashboard,
                addItemsPage: !!addItemsPage,
                orderStatusPage: !!orderStatusPage
            });

            if (authCheck) authCheck.classList.remove('active');
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
            const response = await fetch('/api/admin/profile', {
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



    async handleLogin() {
        const formData = {
            email: document.getElementById('loginEmail').value.trim(),
            password: document.getElementById('loginPassword').value.trim(),
            securityKey: document.getElementById('loginSecurityKey').value.trim()
        };

        const errorDiv = document.getElementById('loginError');
        errorDiv.textContent = '';

        try {
            const response = await fetch('/api/admin/login', {
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
                // Redirect to dashboard under /admin namespace so assets resolve correctly
                setTimeout(() => {
                    window.location.href = '/admin/dashboard';
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
        sessionStorage.removeItem('adminAuthenticated');
        sessionStorage.removeItem('adminEmail');
        this.showNotification('Logged out successfully', 'info');
        // Redirect to selection page
        setTimeout(() => {
            window.location.href = '/';
        }, 1000);
    }

    async loadDashboardStats() {
        try {
            const response = await fetch('/api/admin/dashboard-stats', {
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
            const response = await fetch('/api/admin/menu-items', {
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
            const response = await fetch('/api/admin/orders', {
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

            // Build compact title: show up to 3 item names if items exist
            let compactTitle = 'Food Order';

            if (order.items && Array.isArray(order.items) && order.items.length > 0) {
                const names = order.items
                    .map(i => (i && i.name ? String(i.name).trim() : ''))
                    .filter(n => n.length > 0 && n !== 'undefined' && n.toLowerCase() !== 'undefined');
                if (names.length > 0) {
                    compactTitle = names.slice(0, 3).join(', ');
                    if (names.length > 3) compactTitle += '…';
                }
            }
            else if (order.itemName &&
                typeof order.itemName === 'string' &&
                order.itemName.trim() !== '' &&
                order.itemName !== 'undefined' &&
                order.itemName.toLowerCase() !== 'undefined') {
                compactTitle = order.itemName.trim();
            }

            if (!compactTitle ||
                compactTitle === 'undefined' ||
                String(compactTitle).trim() === '' ||
                String(compactTitle).toLowerCase() === 'undefined') {
                compactTitle = 'Food Order';
            }

            const paymentText = this.formatPayment(order.paymentMethod, order.paymentDetails);

            orderCard.innerHTML = `
                <div class="order-header">
                    <h3>${compactTitle}</h3>
                    <span class="order-status ${order.status}">${this.formatStatus(order.status)}</span>
                </div>
                <div class="order-details">
                    <p><strong>Customer:</strong> ${order.customerName}</p>
                    <p><strong>Phone:</strong> ${order.customerPhone}</p>
                    <p><strong>Quantity:</strong> ${order.quantity}</p>
                    <p><strong>Total:</strong> ₹${order.totalPrice}</p>
                    <p><strong>Payment:</strong> ${paymentText}</p>
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

    formatPaymentMethod(method, status, details) {
        const methodMap = {
            'cash': 'Cash on Delivery',
            'card': 'Credit/Debit Card',
            'upi': 'UPI Payment'
        };

        const methodText = methodMap[method] || method;

        if (status === 'paid' && details) {
            if (method === 'card') {
                return `${methodText} - Paid (****${details.cardNumber.slice(-4)})`;
            } else if (method === 'upi') {
                return `${methodText} - Paid (${details.upiId})`;
            }
            return `${methodText} - Paid`;
        }

        return methodText;
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

            // Build compact title: show up to 3 item names if items exist
            let compactTitle = 'Food Order';

            // First try to get names from items array
            if (order.items && Array.isArray(order.items) && order.items.length > 0) {
                const names = order.items
                    .map(i => (i && i.name ? String(i.name).trim() : ''))
                    .filter(n => n.length > 0 && n !== 'undefined' && n.toLowerCase() !== 'undefined');
                if (names.length > 0) {
                    compactTitle = names.slice(0, 3).join(', ');
                    if (names.length > 3) compactTitle += '…';
                }
            }
            // Fallback to itemName if it exists and is valid
            else if (order.itemName &&
                typeof order.itemName === 'string' &&
                order.itemName.trim() !== '' &&
                order.itemName !== 'undefined' &&
                order.itemName.toLowerCase() !== 'undefined') {
                compactTitle = order.itemName.trim();
            }

            // Final safety check
            if (!compactTitle ||
                compactTitle === 'undefined' ||
                String(compactTitle).trim() === '' ||
                String(compactTitle).toLowerCase() === 'undefined') {
                compactTitle = 'Food Order';
            }

            const fullNames = (order.items && Array.isArray(order.items) && order.items.length > 0)
                ? order.items.map(i => (i && i.name ? i.name : '')).filter(n => n && n !== 'undefined').join(', ')
                : (order.itemName && order.itemName !== 'undefined' ? order.itemName : '');
            const safeTitleAttr = (!fullNames || String(fullNames).trim().toLowerCase() === 'undefined') ? '' : fullNames;

            const paymentText = this.formatPayment(order.paymentMethod, order.paymentDetails);

            orderCard.innerHTML = `
                <div class="order-header">
                    <h3 title="${safeTitleAttr}">${compactTitle}</h3>
                    <span class="order-status ${order.status}">${this.formatStatus(order.status)}</span>
                </div>
                <div class="order-details">
                    <p><strong>Customer:</strong> ${order.customerName}</p>
                    <p><strong>Phone:</strong> ${order.customerPhone}</p>
                    <p><strong>Quantity:</strong> ${order.quantity}</p>
                    <p><strong>Total:</strong> ₹${order.totalPrice}</p>
                    <p><strong>Payment:</strong> ${paymentText}</p>
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
                ? `/api/admin/menu-items/${this.currentEditingItem}`
                : '/api/admin/menu-items';

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
            const response = await fetch(`/api/admin/menu-items/${itemId}`, {
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

            // Calculate GST and Delivery Fees
            const gst = order.gst || (order.unitPrice * 0.05) || 0; // 5% GST if not provided
            const deliveryFees = order.deliveryFees || order.deliveryCharge || 46 || 0;

            // Display all items from the order
            let itemsDisplay = '';
            let itemsTitle = '';

            if (order.items && Array.isArray(order.items) && order.items.length > 0) {
                // Multiple items order
                const itemNames = order.items.map(item => item.name).join(', ');
                itemsTitle = `<h3 style="color: var(--gold-crayola); margin-bottom: 1rem;">${itemNames}</h3>`;
                itemsDisplay = '<div style="margin-bottom: 1rem; padding: 1rem; background: rgba(212, 175, 55, 0.1); border-radius: 10px; border: 1px solid rgba(212, 175, 55, 0.3);">';
                itemsDisplay += '<p style="color: var(--gold-crayola); font-weight: 600; margin-bottom: 0.5rem;">Order Items:</p>';
                itemsDisplay += '<ul style="margin-left: 20px; color: var(--white);">';
                order.items.forEach(item => {
                    const totalItemPrice = item.price * item.quantity;
                    itemsDisplay += `<li style="margin-bottom: 0.3rem;">${item.name} <span style="color: var(--quick-silver);">x ${item.quantity}</span> = <span style="color: var(--gold-crayola);">₹${totalItemPrice}</span></li>`;
                });
                itemsDisplay += '</ul></div>';
            } else if (order.itemName) {
                // Single item order
                itemsTitle = `<h3 style="color: var(--gold-crayola); margin-bottom: 1rem;">${order.itemName}</h3>`;
            }

            detailsDiv.innerHTML = `
                <div class="order-info">
                    ${itemsTitle}
                    ${itemsDisplay}
                    <div class="order-meta">
                        <p><strong>Order ID:</strong> ${order._id}</p>
                        <p><strong>Customer:</strong> ${order.customerName}</p>
                        <p><strong>Phone:</strong> ${order.customerPhone}</p>
                        <p><strong>Email:</strong> ${order.customerEmail || 'Not provided'}</p>
                        <p><strong>Quantity:</strong> ${order.quantity}</p>
                        <p><strong>Unit Price:</strong> ₹${order.unitPrice}</p>
                        <p><strong>GST:</strong> ₹${gst.toFixed(2)}</p>
                        <p><strong>Delivery Fees:</strong> ₹${deliveryFees}</p>
                        <p><strong>Total Price:</strong> ₹${order.totalPrice}</p>
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
            const response = await fetch(`/api/admin/orders/${this.currentOrderId}/status`, {
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

// Removed showSignup function - no signup allowed for admin

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
