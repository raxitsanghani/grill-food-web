class AdminDashboard {
    constructor() {
        this.socket = null;
        this.adminToken = null;
        this.currentEditingItem = null;
        this.currentOrderId = null;
        this.orders = [];
        this.menuItems = [];
        
        this.initializeEventListeners();
        this.initializeSocket();
        this.checkAuthAndLoad();
    }

    initializeEventListeners() {
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

        // Image upload handling
        const imageInput = document.getElementById('itemImage');
        if (imageInput) {
            imageInput.addEventListener('change', (e) => {
                console.log('Image input change event triggered');
                this.handleImageUpload(e);
            });
            
            // Also add click event for better UX
            imageInput.addEventListener('click', (e) => {
                console.log('Image input clicked');
            });
        } else {
            console.error('Image input element not found!');
        }

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

        // Test image upload button
        const testImageBtn = document.getElementById('testImageUpload');
        if (testImageBtn) {
            testImageBtn.addEventListener('click', () => {
                this.testImageUpload();
            });
        }
    }

    initializeSocket() {
        // Use the same port as the unified server
        this.socket = io();
        
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

    checkAuthAndLoad() {
        // Check if admin token exists in localStorage
        const token = localStorage.getItem('adminToken');
        if (token) {
            this.adminToken = token;
            this.loadAdminInfo();
            this.loadDashboardStats();
            this.loadMenuItems();
            this.loadOrders();
        } else {
            // No token, redirect to login
            window.location.href = './index.html';
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
            } else if (response.status === 401) {
                // Token expired or invalid, redirect to login
                localStorage.removeItem('adminToken');
                window.location.href = './index.html';
            }
        } catch (error) {
            console.error('Error loading admin info:', error);
        }
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

    async refreshMenuItems() {
        this.showNotification('Refreshing menu items...', 'info');
        await this.loadMenuItems();
        this.showNotification('Menu items refreshed successfully!', 'success');
    }

    handleImageUpload(event) {
        console.log('handleImageUpload called with event:', event);
        
        const file = event.target.files[0];
        console.log('Selected file:', file);
        
        if (!file) {
            console.log('No file selected');
            return;
        }

        console.log('File details:', {
            name: file.name,
            type: file.type,
            size: file.size,
            lastModified: file.lastModified
        });

        // Validate the file
        if (!this.validateImageFile(file)) {
            console.log('File validation failed');
            // Reset the file input
            event.target.value = '';
            return;
        }

        console.log('File validation passed, showing preview');
        // Show preview
        this.showImagePreview(file);
        console.log('Image upload handled successfully:', file.name);
    }

    showImagePreview(file) {
        console.log('showImagePreview called with file:', file.name);
        
        const preview = document.getElementById('uploadPreview');
        if (!preview) {
            console.error('Upload preview element not found!');
            return;
        }

        const reader = new FileReader();

        reader.onload = (e) => {
            console.log('FileReader onload triggered');
            const result = e.target.result;
            console.log('Base64 result length:', result.length);
            
            preview.innerHTML = `<img src="${result}" alt="Preview" style="max-width: 100%; height: auto; object-fit: contain; background-color: #000; padding: 10px; border-radius: 10px;">`;
            preview.classList.add('has-image');
            console.log('Image preview displayed successfully');
        };

        reader.onerror = (error) => {
            console.error('FileReader error:', error);
            this.showNotification('Error reading image file', 'error');
        };

        reader.onabort = () => {
            console.log('FileReader aborted');
            this.showNotification('Image reading was cancelled', 'error');
        };

        reader.onprogress = (event) => {
            if (event.lengthComputable) {
                const progress = (event.loaded / event.total) * 100;
                console.log(`Reading progress: ${progress.toFixed(1)}%`);
            }
        };

        console.log('Starting to read file as Data URL...');
        reader.readAsDataURL(file);
    }

    resetImageUpload() {
        console.log('Resetting image upload');
        
        const preview = document.getElementById('uploadPreview');
        const fileInput = document.getElementById('itemImage');
        
        if (preview) {
            preview.innerHTML = `
                <div class="upload-placeholder">
                    <ion-icon name="cloud-upload-outline"></ion-icon>
                    <p>Click to upload image or drag & drop</p>
                    <small>Supports: JPG, PNG, GIF (Max: 5MB)</small>
                </div>
            `;
            preview.classList.remove('has-image');
            console.log('Preview reset successfully');
        } else {
            console.error('Preview element not found during reset');
        }
        
        if (fileInput) {
            fileInput.value = '';
            console.log('File input reset successfully');
        } else {
            console.error('File input element not found during reset');
        }
        
        console.log('Image upload reset completed');
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
        if (!grid) return;
        
        grid.innerHTML = '';

        this.menuItems.forEach(item => {
            const itemCard = document.createElement('div');
            itemCard.className = 'menu-item-card';
            
            // Handle image path - could be base64, URL, or relative path
            let imagePath = item.image;
            if (imagePath) {
                if (imagePath.startsWith('data:image/')) {
                    // Base64 image - use as is
                    imagePath = imagePath;
                } else if (imagePath.startsWith('http')) {
                    // Full URL - use as is
                    imagePath = imagePath;
                } else if (!imagePath.startsWith('./')) {
                    // Relative path - add proper prefix
                    imagePath = `../grilli-master/assets/images/${imagePath}`;
                }
            }
            
            console.log(`Rendering menu item: ${item.name}, Image path: ${imagePath ? 'Base64/URL/Path' : 'No image'}`);
            
            itemCard.innerHTML = `
                <div class="item-image">
                    <img src="${imagePath || '../grilli-master/assets/images/menu-1.png'}" alt="${item.name}" onerror="this.src='../grilli-master/assets/images/menu-1.png'" style="object-fit: contain; background-color: #000; padding: 10px; border-radius: 10px;">
                </div>
                <div class="item-details">
                    <h3>${item.name}</h3>
                    <p class="item-type ${item.type}">${item.type === 'veg' ? '🥬 Vegetarian' : '🍖 Non-Vegetarian'}</p>
                    <p class="item-price">₹${item.price.toFixed(2)}</p>
                    <p class="item-delivery">${item.deliveryTime || '25-35 minutes'}</p>
                    <p class="item-prep">Prep: ${item.prepTime || 15} min</p>
                    ${item.badge ? `<span class="item-badge">${item.badge}</span>` : ''}
                    ${item.category ? `<p class="item-category">Category: ${item.category}</p>` : ''}
                </div>
                <div class="item-actions">
                    <button class="edit-btn" onclick="adminDashboard.editMenuItem('${item._id}')">✏️ Edit</button>
                    <button class="delete-btn" onclick="adminDashboard.deleteMenuItem('${item._id}')">🗑️ Delete</button>
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
                    <button class="view-btn" onclick="adminDashboard.viewOrderDetails('${order._id}')">View Details</button>
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
                    <button class="view-btn" onclick="adminDashboard.viewOrderDetails('${order._id}')">View Details</button>
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
                document.getElementById('itemCategory').value = item.category || 'main-course';
                document.getElementById('itemPrice').value = item.price;
                document.getElementById('itemBadge').value = item.badge || '';
                document.getElementById('itemDeliveryTime').value = item.deliveryTime || '25-35 minutes';
                document.getElementById('itemPrepTime').value = item.prepTime || 15;
                document.getElementById('itemDescription').value = item.description || '';
                
                // Show existing image for editing
                if (item.image) {
                    console.log('Showing existing image for editing:', item.image);
                    const preview = document.getElementById('uploadPreview');
                    if (preview) {
                        preview.innerHTML = `<img src="${item.image}" alt="Preview" style="max-width: 100%; height: auto; object-fit: contain; background-color: #000; padding: 10px; border-radius: 10px;">`;
                        preview.classList.add('has-image');
                        console.log('Existing image displayed in preview');
                    } else {
                        console.error('Preview element not found');
                    }
                } else {
                    console.log('No existing image, resetting upload');
                    // Reset if no image exists
                    this.resetImageUpload();
                }
            }
        } else {
            title.textContent = 'Add New Menu Item';
            form.reset();
            document.getElementById('itemDeliveryTime').value = '25-35 minutes';
            document.getElementById('itemPrepTime').value = 15;
            document.getElementById('itemCategory').value = 'main-course';
            this.resetImageUpload();
            console.log('Modal opened for new item');
        }

        modal.classList.add('active');
    }

    closeMenuItemModal() {
        document.getElementById('menuItemModal').classList.remove('active');
        this.currentEditingItem = null;
        this.resetImageUpload();
        console.log('Modal closed and reset');
    }

    async handleMenuItemSubmit() {
        const formData = {
            name: document.getElementById('itemName').value,
            type: document.getElementById('itemType').value,
            category: document.getElementById('itemCategory').value || 'main-course',
            price: parseFloat(document.getElementById('itemPrice').value),
            badge: document.getElementById('itemBadge').value,
            deliveryTime: document.getElementById('itemDeliveryTime').value,
            prepTime: parseInt(document.getElementById('itemPrepTime').value),
            description: document.getElementById('itemDescription').value
        };

        // Handle image upload
        const imageFile = document.getElementById('itemImage').files[0];
        
        // For new items, image is required
        if (!this.currentEditingItem && !imageFile) {
            this.showNotification('Please select an image', 'error');
            return;
        }

        // For editing, if no new image is selected, keep the existing one
        if (this.currentEditingItem && !imageFile) {
            const existingItem = this.menuItems.find(i => i._id === this.currentEditingItem);
            if (!existingItem || !existingItem.image) {
                this.showNotification('Image is required', 'error');
                return;
            }
        }

        // Validate image file if one is selected
        if (imageFile && !this.validateImageFile(imageFile)) {
            return;
        }

        // Validation
        if (!formData.name || !formData.type || !formData.price || !formData.description) {
            this.showNotification('Please fill in all required fields', 'error');
            return;
        }

        if (formData.price <= 0) {
            this.showNotification('Price must be greater than 0', 'error');
            return;
        }

        try {
            let imageData = null;
            
            if (imageFile) {
                // Convert file to base64 for storage
                imageData = await this.fileToBase64(imageFile);
                console.log('Image converted to base64 successfully');
            } else if (this.currentEditingItem) {
                // Keep existing image if editing and no new image selected
                const existingItem = this.menuItems.find(i => i._id === this.currentEditingItem);
                if (existingItem && existingItem.image) {
                    imageData = existingItem.image;
                    console.log('Using existing image for editing');
                }
            }

            if (!imageData) {
                this.showNotification('Image is required', 'error');
                return;
            }

            console.log('Image data prepared successfully');

            const menuItemData = {
                ...formData,
                image: imageData
            };

            console.log('Prepared menu item data:', {
                name: menuItemData.name,
                type: menuItemData.type,
                price: menuItemData.price,
                hasImage: !!menuItemData.image,
                imageLength: menuItemData.image ? menuItemData.image.length : 0
            });

            const url = this.currentEditingItem 
                ? `/api/admin/menu-items/${this.currentEditingItem}`
                : '/api/admin/menu-items';
            
            const method = this.currentEditingItem ? 'PUT' : 'POST';
            
            console.log('Sending request to:', url, 'Method:', method);

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.adminToken}`
                },
                body: JSON.stringify(menuItemData)
            });

            console.log('Response received:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok
            });

            if (response.ok) {
                const message = this.currentEditingItem ? 'Menu item updated successfully!' : 'Menu item added successfully!';
                this.showNotification(message, 'success');
                this.closeMenuItemModal();
                
                // Refresh the menu items
                await this.loadMenuItems();
                this.loadDashboardStats();
            } else {
                // Check if response is JSON
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    try {
                        const data = await response.json();
                        this.showNotification(data.error || 'Operation failed', 'error');
                    } catch (jsonError) {
                        console.error('Error parsing JSON response:', jsonError);
                        this.showNotification('Server returned invalid response', 'error');
                    }
                } else {
                    // Handle HTML response (server error)
                    const textResponse = await response.text();
                    console.error('Server returned HTML instead of JSON:', textResponse.substring(0, 200));
                    this.showNotification('Server error - please try again', 'error');
                }
            }
        } catch (error) {
            console.error('Menu item operation error:', error);
            if (error.message.includes('Failed to fetch')) {
                this.showNotification('Network error. Please check your connection and try again.', 'error');
            } else if (error.message.includes('Unexpected token')) {
                this.showNotification('Server returned invalid response. Please try again.', 'error');
            } else {
                this.showNotification('Error: ' + error.message, 'error');
            }
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

    handleLogout() {
        this.adminToken = null;
        localStorage.removeItem('adminToken');
        this.showNotification('Logged out successfully', 'info');
        // Redirect to login page
        setTimeout(() => {
            window.location.href = './index.html';
        }, 1000);
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
        
        // Sort orders by creation date (newest first) to ensure proper order
        this.orders.sort((a, b) => {
            const dateA = new Date(a.orderDate || a.createdAt || 0);
            const dateB = new Date(b.orderDate || b.createdAt || 0);
            return dateB - dateA; // Newest first
        });
        
        // Refresh the display if on orders page
        if (document.getElementById('orderStatusPage').classList.contains('active')) {
            this.renderOrders();
        }
        
        this.loadDashboardStats();
        
        // Show notification
        this.showNotification('New order received!', 'success');
    }

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            try {
                console.log('fileToBase64 called with file:', file.name);
                
                if (!file) {
                    reject(new Error('No file provided'));
                    return;
                }

                const reader = new FileReader();
                
                reader.onload = () => {
                    console.log('FileReader onload in fileToBase64, result length:', reader.result.length);
                    resolve(reader.result);
                };
                
                reader.onerror = (error) => {
                    console.error('FileReader error in fileToBase64:', error);
                    reject(new Error('Failed to read image file'));
                };
                
                reader.onabort = () => {
                    console.log('FileReader aborted in fileToBase64');
                    reject(new Error('Image reading was aborted'));
                };

                reader.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const progress = (event.loaded / event.total) * 100;
                        console.log(`Base64 conversion progress: ${progress.toFixed(1)}%`);
                    }
                };
                
                console.log('Starting fileToBase64 conversion...');
                reader.readAsDataURL(file);
                
            } catch (error) {
                console.error('Error in fileToBase64:', error);
                reject(new Error('Failed to process image file: ' + error.message));
            }
        });
    }

    // Helper method to validate image file
    validateImageFile(file) {
        console.log('Validating file:', file.name);
        
        if (!file) {
            console.log('No file provided for validation');
            this.showNotification('Please select an image file', 'error');
            return false;
        }

        console.log('File type:', file.type);
        console.log('File size:', file.size, 'bytes');

        // Validate file type
        if (!file.type.startsWith('image/')) {
            console.log('Invalid file type:', file.type);
            this.showNotification('Please select a valid image file (JPG, PNG, GIF)', 'error');
            return false;
        }

        // Validate file size (5MB limit)
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (file.size > maxSize) {
            console.log('File too large:', file.size, '>', maxSize);
            this.showNotification(`Image size must be less than 5MB (current: ${(file.size / 1024 / 1024).toFixed(1)}MB)`, 'error');
            return false;
        }

        console.log('File validation passed');
        return true;
    }

    // Test method for debugging image upload
    testImageUpload() {
        console.log('=== Testing Image Upload ===');
        console.log('Current editing item:', this.currentEditingItem);
        console.log('Image input element:', document.getElementById('itemImage'));
        console.log('Upload preview element:', document.getElementById('uploadPreview'));
        
        // Test file input
        const fileInput = document.getElementById('itemImage');
        if (fileInput) {
            console.log('File input found, files:', fileInput.files);
            console.log('File input accept:', fileInput.accept);
            console.log('File input required:', fileInput.required);
        }
        
        // Test preview
        const preview = document.getElementById('uploadPreview');
        if (preview) {
            console.log('Preview element found, classes:', preview.className);
            console.log('Preview innerHTML length:', preview.innerHTML.length);
        }
        
        this.showNotification('Image upload test completed - check console', 'info');
    }
}

// Global functions for onclick handlers
function showAddItems() {
    document.getElementById('dashboard').classList.remove('active');
    document.getElementById('addItemsPage').classList.add('active');
    document.getElementById('orderStatusPage').classList.remove('active');
}

function showUpdateOrders() {
    document.getElementById('dashboard').classList.remove('active');
    document.getElementById('addItemsPage').classList.remove('active');
    document.getElementById('orderStatusPage').classList.add('active');
}

function showDashboard() {
    document.getElementById('dashboard').classList.add('active');
    document.getElementById('addItemsPage').classList.remove('active');
    document.getElementById('orderStatusPage').classList.remove('active');
}

// Initialize admin dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminDashboard = new AdminDashboard();
});
