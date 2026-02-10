class AdminDashboard {
    constructor() {
        this.socket = null;
        this.adminToken = null;
        this.currentEditingItem = null;
        this.currentOrderId = null;
        this.orders = [];
        this.menuItems = [];
        this.riders = [];
        this.chefs = [];
        this.tableBookings = [];
        this.currentEditingRider = null;
        this.currentEditingChef = null;
        
        this.initializeEventListeners();
        this.initializeSocket();
        this.checkAuthAndLoad();
    }

    initializeEventListeners() {
        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.handleLogout();
        });

        // Sidebar toggle
        const hamburger = document.getElementById('hamburger');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        const toggleSidebar = (show) => {
            const open = show != null ? show : !sidebar.classList.contains('open');
            if (open) {
                sidebar.classList.add('open');
                overlay.classList.add('show');
                sidebar.setAttribute('aria-hidden', 'false');
            } else {
                sidebar.classList.remove('open');
                overlay.classList.remove('show');
                sidebar.setAttribute('aria-hidden', 'true');
            }
        };
        if (hamburger) hamburger.addEventListener('click', () => toggleSidebar());
        if (overlay) overlay.addEventListener('click', () => toggleSidebar(false));

        // Sidebar nav actions
        const wire = (id, fn) => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('click', () => { fn(); toggleSidebar(false); });
        };
        wire('navDesktop', () => showDashboard());
        wire('navUpdateOrders', () => showUpdateOrders());
        wire('navAddItems', () => showAddItems());
        wire('navRiders', () => showRiders());
        wire('navChefs', () => showChefs());
        wire('navTableBooking', () => showTableBooking());

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

        // Rider modal
        document.getElementById('addRiderBtn').addEventListener('click', () => {
            this.openRiderModal();
        });

        document.getElementById('closeRiderModal').addEventListener('click', () => {
            this.closeRiderModal();
        });

        document.getElementById('cancelRider').addEventListener('click', () => {
            this.closeRiderModal();
        });

        document.getElementById('riderForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRiderSubmit();
        });

        // Rider photo input
        const riderPhotoInput = document.getElementById('riderPhoto');
        if (riderPhotoInput) {
            riderPhotoInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                if (!file.type.startsWith('image/')) {
                    this.showNotification('Please select a valid image', 'error');
                    e.target.value = '';
                    return;
                }
                if (file.size > 2 * 1024 * 1024) {
                    this.showNotification('Image must be <= 2MB', 'error');
                    e.target.value = '';
                    return;
                }
                const preview = document.getElementById('riderPhotoPreview');
                const reader = new FileReader();
                reader.onload = () => {
                    preview.innerHTML = `<img src="${reader.result}" alt="Preview" style="max-height: 140px; border-radius: 10px;">`;
                    preview.classList.add('has-image');
                };
                reader.readAsDataURL(file);
            });
        }

        // Chef modal
        document.getElementById('addChefBtn').addEventListener('click', () => {
            this.openChefModal();
        });

        document.getElementById('closeChefModal').addEventListener('click', () => {
            this.closeChefModal();
        });

        document.getElementById('cancelChef').addEventListener('click', () => {
            this.closeChefModal();
        });

        document.getElementById('chefForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleChefSubmit();
        });

        // Table booking refresh button
        document.getElementById('refreshBookingsBtn').addEventListener('click', () => {
            this.refreshTableBookings();
        });

        // Chef photo input
        const chefPhotoInput = document.getElementById('chefPhoto');
        if (chefPhotoInput) {
            chefPhotoInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                if (!file.type.startsWith('image/')) {
                    this.showNotification('Please select a valid image', 'error');
                    e.target.value = '';
                    return;
                }
                if (file.size > 2 * 1024 * 1024) {
                    this.showNotification('Image must be <= 2MB', 'error');
                    e.target.value = '';
                    return;
                }
                const preview = document.getElementById('chefPhotoPreview');
                const reader = new FileReader();
                reader.onload = () => {
                    preview.innerHTML = `<img src="${reader.result}" alt="Preview" style="max-height: 140px; border-radius: 10px;">`;
                    preview.classList.add('has-image');
                };
                reader.readAsDataURL(file);
            });
        }
    }

    initializeSocket() {
        // Connect to the admin server
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

        this.socket.on('new-table-booking', (booking) => {
            this.handleNewTableBooking(booking);
        });

        this.socket.on('table-booking-updated', (booking) => {
            this.handleTableBookingUpdate(booking);
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
        await this.loadMenuItems();
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
            
            const paymentText = this.formatPaymentMethod(order.paymentMethod, order.paymentStatus, order.paymentDetails);
            
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
                    <button class="view-btn" onclick="adminDashboard.viewOrderDetails('${order._id}')">View Details</button>
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

    formatOrderDate(dateValue) {
        if (!dateValue) return 'Date not available';
        
        try {
            const date = new Date(dateValue);
            if (isNaN(date.getTime())) return 'Invalid Date';
            
            // Format: Date first, then time
            const options = {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            };
            
            return date.toLocaleString('en-US', options);
        } catch (error) {
            return 'Date not available';
        }
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
                ? order.items.map(i => (i && i.name ? i.name : '')).filter(Boolean).join(', ')
                : (order.itemName || '');
            const safeTitleAttr = (!fullNames || String(fullNames).trim().toLowerCase() === 'undefined') ? '' : fullNames;

            const paymentText = this.formatPaymentMethod(order.paymentMethod, order.paymentStatus, order.paymentDetails);

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
        document.body.classList.add('modal-open');
    }

    closeMenuItemModal() {
        document.getElementById('menuItemModal').classList.remove('active');
        this.currentEditingItem = null;
        this.resetImageUpload();
        console.log('Modal closed and reset');
        document.body.classList.remove('modal-open');
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
                const message = this.currentEditingItem ? 'Item updated successfully' : 'Item added successfully';
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
                        this.showNotification(data.error || 'Operation failed. Please try again.', 'error');
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
                this.showNotification('Item deleted successfully', 'success');
                this.loadMenuItems();
                this.loadDashboardStats();
            } else {
                const data = await response.json();
                this.showNotification(data.error || 'Failed to delete item. Please try again.', 'error');
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
                        <p><strong>Order Date:</strong> ${this.formatOrderDate(order.createdAt || order.orderDate)}</p>
                        ${order.specialInstructions ? `<p><strong>Special Instructions:</strong> ${order.specialInstructions}</p>` : ''}
                    </div>
                </div>
            `;

            // Rider details + live map
            const rider = order.assignedRider;
            if (rider) {
                const name = rider.full_name || rider.name || 'Delivery Partner';
                const phone = rider.phone || '—';
                const photo = rider.profile_photo || '../grilli-master/assets/images/testi-avatar.jpg';
                const age = rider.age != null ? rider.age : '--';
                const rating = rider.rating != null ? Number(rider.rating).toFixed(1) : '4.5';

                const mapCoords = this.getRandomAhmedabadCoord();
                const mapEmbed = this.buildGMapEmbed(mapCoords.lat, mapCoords.lng);

                const riderBlock = document.createElement('div');
                riderBlock.innerHTML = `
                    <div style="margin-top: 12px; padding: 12px; border: 1px solid rgba(212,175,55,.25); border-radius: 12px;">
                        <div style="display:flex;gap:12px;align-items:center;">
                            <img src="${photo}" alt="Rider" style="width:56px;height:56px;border-radius:50%;object-fit:cover;border:2px solid var(--gold-crayola)" onerror="this.src='../grilli-master/assets/images/testi-avatar.jpg'">
                            <div>
                                <h3 style="color: var(--gold-crayola); margin: 0 0 6px 0;">Delivery Partner</h3>
                                <p style="margin:0;color:var(--quick-silver);">${name} • Age: ${age} • ⭐ ${rating}</p>
                                <p style="margin:0;color:var(--quick-silver);">Contact: ${phone}</p>
                            </div>
                        </div>
                        ${order.status === 'delivered' ? '' : `<div style="margin-top:10px;border-radius:12px;overflow:hidden;">${mapEmbed}</div>`}
                    </div>
                `;
                detailsDiv.appendChild(riderBlock);
            }

            document.getElementById('orderStatus').value = order.status;
            document.getElementById('adminNotes').value = order.adminNotes || '';
            
            document.getElementById('orderModal').classList.add('active');
            document.body.classList.add('modal-open');
        }
    }

    getRandomAhmedabadCoord() {
        const clusters = [
            { lat: 23.0225, lng: 72.5714 },
            { lat: 23.0300, lng: 72.5800 },
            { lat: 23.0497, lng: 72.5660 },
            { lat: 23.0336, lng: 72.5247 },
            { lat: 23.0700, lng: 72.5300 },
            { lat: 23.0580, lng: 72.6340 },
            { lat: 23.0440, lng: 72.6200 }
        ];
        const base = clusters[Math.floor(Math.random()*clusters.length)];
        const jitter = () => (Math.random() - 0.5) * 0.02;
        return { lat: base.lat + jitter(), lng: base.lng + jitter() };
    }

    buildGMapEmbed(lat, lng) {
        const q = encodeURIComponent(`${lat},${lng}`);
        const url = `https://www.google.com/maps?q=${q}&z=15&output=embed`;
        return `<iframe src="${url}" width="100%" height="220" style="border:0;" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;
    }

    closeOrderModal() {
        document.getElementById('orderModal').classList.remove('active');
        this.currentOrderId = null;
        document.body.classList.remove('modal-open');
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
                this.showNotification('Order updated successfully', 'success');
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
                this.showNotification(data.error || 'Failed to update order. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Status update error:', error);
            this.showNotification('Network error. Please try again.', 'error');
        }
    }

    handleLogout() {
        this.adminToken = null;
        localStorage.removeItem('adminToken');
        this.showNotification('Logged out successfully', 'success');
        // Redirect to selection page
        setTimeout(() => {
            window.location.href = '/';
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
            // Add new item to the list
            this.menuItems.push(data.item);
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
        // Add new order to the list
        this.orders.push(order);
        
        // Refresh the display if on orders page
        if (document.getElementById('orderStatusPage').classList.contains('active')) {
            this.renderOrders();
        }
        
        this.loadDashboardStats();
        
        // Show notification
        this.showNotification('New order received', 'success');
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

    // ==================== RIDERS FUNCTIONALITY ====================

    async refreshRiders() {
        try {
            const response = await fetch('/api/riders');
            if (response.ok) {
                this.riders = await response.json();
                this.renderRiders();
            } else {
                this.showNotification('Failed to load riders', 'error');
            }
        } catch (error) {
            console.error('Error refreshing riders:', error);
            this.showNotification('Error loading riders', 'error');
        }
    }

    async loadRiders() {
        try {
            const response = await fetch('/api/riders');
            if (response.ok) {
                this.riders = await response.json();
                this.renderRiders();
            }
        } catch (error) {
            console.error('Error loading riders:', error);
        }
    }

    async seedRiders() {
        try {
            const response = await fetch('/api/riders/seed', { method: 'POST' });
            const result = await response.json();
            
            if (response.ok) {
                this.showNotification(result.message, 'success');
                await this.refreshRiders();
            } else {
                this.showNotification(`Failed to seed riders: ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Error seeding riders:', error);
            this.showNotification('Error seeding riders', 'error');
        }
    }

    renderRiders() {
        const ridersGrid = document.getElementById('ridersGrid');
        if (!ridersGrid) return;

        if (this.riders.length === 0) {
            ridersGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--quick-silver);">
                    <h3>No riders found</h3>
                    <p>Click "Add New Rider" to create a delivery rider</p>
                </div>
            `;
            return;
        }

        ridersGrid.innerHTML = this.riders.map(rider => `
            <div class="rider-card">
                <div class="rider-header">
                    <img src="${rider.profile_photo}" alt="${rider.full_name}" class="rider-photo">
                    <div class="rider-info">
                        <h4>${rider.full_name}</h4>
                        <p>${rider.phone}</p>
                    </div>
                </div>
                
                <div class="rider-details">
                    <div class="rider-detail">
                        <span>Location:</span>
                        <span>${rider.lat.toFixed(4)}, ${rider.lng.toFixed(4)}</span>
                    </div>
                    <div class="rider-detail">
                        <span>Status:</span>
                        <span class="rider-status ${rider.status}">${rider.status}</span>
                    </div>
                </div>
                
                <div class="rider-actions">
                    <button class="edit-rider-btn" onclick="adminDashboard.editRider('${rider._id}')">
                        ✏️ Edit
                    </button>
                    <button class="delete-rider-btn" onclick="adminDashboard.deleteRider('${rider._id}')">
                        🗑️ Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    openRiderModal(riderId = null) {
        const modal = document.getElementById('riderModal');
        const title = document.getElementById('riderModalTitle');
        const form = document.getElementById('riderForm');
        
        if (riderId) {
            // Edit mode
            const rider = this.riders.find(r => r._id === riderId);
            if (rider) {
                this.currentEditingRider = rider;
                title.textContent = 'Edit Rider';
                
                // Populate form
                document.getElementById('riderName').value = rider.full_name;
                document.getElementById('riderPhone').value = rider.phone;
                document.getElementById('riderLat').value = rider.lat;
                document.getElementById('riderLng').value = rider.lng;
                document.getElementById('riderStatus').value = rider.status;
            }
        } else {
            // Add mode
            this.currentEditingRider = null;
            title.textContent = 'Add New Rider';
            form.reset();
        }
        
        modal.style.display = 'flex';
    }

    closeRiderModal() {
        const modal = document.getElementById('riderModal');
        modal.style.display = 'none';
        this.currentEditingRider = null;
    }

    async handleRiderSubmit() {
        const formEl = document.getElementById('riderForm');
        const formData = new FormData(formEl);
        const riderData = {
            full_name: formData.get('full_name'),
            phone: formData.get('phone'),
            lat: parseFloat(formData.get('lat')) || 23.0225,
            lng: parseFloat(formData.get('lng')) || 72.5714,
            status: formData.get('status')
        };

        // Attach base64 photo if provided
        const photoInput = document.getElementById('riderPhoto');
        if (photoInput && photoInput.files && photoInput.files[0]) {
            const photoFile = photoInput.files[0];
            riderData.profile_photo = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(photoFile);
            });
        }

        try {
            let response;
            if (this.currentEditingRider) {
                // Update existing rider
                response = await fetch(`/api/riders/${this.currentEditingRider._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(riderData)
                });
            } else {
                // Add new rider
                response = await fetch('/api/riders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(riderData)
                });
            }

            const result = await response.json();
            
            if (response.ok) {
                this.showNotification(result.message || 'Rider saved successfully', 'success');
                this.closeRiderModal();
                await this.refreshRiders();
            } else {
                this.showNotification(`Failed to save rider: ${result.error || 'Unknown error'}`, 'error');
            }
        } catch (error) {
            console.error('Error saving rider:', error);
            this.showNotification('Error saving rider', 'error');
        }
    }

    editRider(riderId) {
        this.openRiderModal(riderId);
    }

    async deleteRider(riderId) {
        if (!confirm('Are you sure you want to delete this rider?')) {
            return;
        }

        try {
            const response = await fetch(`/api/riders/${riderId}`, { method: 'DELETE' });
            const result = await response.json();
            
            if (response.ok) {
                this.showNotification('Rider deleted successfully', 'success');
                await this.refreshRiders();
            } else {
                this.showNotification(`Failed to delete rider: ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Error deleting rider:', error);
            this.showNotification('Error deleting rider', 'error');
        }
    }

    // Chef Management Methods
    async refreshChefs() {
        try {
            const response = await fetch('/api/chefs');
            if (response.ok) {
                this.chefs = await response.json();
                this.renderChefs();
            } else {
                this.showNotification('Failed to load chefs', 'error');
            }
        } catch (error) {
            console.error('Error refreshing chefs:', error);
            this.showNotification('Error loading chefs', 'error');
        }
    }

    async loadChefs() {
        try {
            const response = await fetch('/api/chefs');
            if (response.ok) {
                this.chefs = await response.json();
                this.renderChefs();
            }
        } catch (error) {
            console.error('Error loading chefs:', error);
        }
    }

    renderChefs() {
        const chefsGrid = document.getElementById('chefsGrid');
        if (!chefsGrid) return;

        if (this.chefs.length === 0) {
            chefsGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--quick-silver);">
                    <h3>No chefs found</h3>
                    <p>Click "Add New Chef" to create a chef profile</p>
                </div>
            `;
            return;
        }

        chefsGrid.innerHTML = this.chefs.map(chef => `
            <div class="chef-card">
                <div class="chef-header">
                    <img src="${chef.profilePhoto}" alt="${chef.fullName}" class="chef-photo">
                    <div class="chef-info">
                        <h4>${chef.fullName}</h4>
                        <p>${chef.experience}</p>
                        <div class="chef-rating">
                            ${'★'.repeat(Math.floor(chef.rating))}${'☆'.repeat(5 - Math.floor(chef.rating))} ${chef.rating}
                        </div>
                    </div>
                </div>
                
                <div class="chef-details">
                    <div class="chef-specialties">
                        <strong>Specialties:</strong>
                        <div class="specialty-tags">
                            ${chef.specialties.map(specialty => `<span class="specialty-tag">${specialty}</span>`).join('')}
                        </div>
                    </div>
                    ${chef.bio ? `<div class="chef-bio"><strong>Bio:</strong> ${chef.bio}</div>` : ''}
                    <div class="chef-status">
                        <span>Status:</span>
                        <span class="status-badge ${chef.status}">${chef.status}</span>
                    </div>
                </div>
                
                <div class="chef-actions">
                    <button class="edit-chef-btn" onclick="adminDashboard.editChef('${chef._id}')">
                        ✏️ Edit
                    </button>
                    <button class="delete-chef-btn" onclick="adminDashboard.deleteChef('${chef._id}')">
                        🗑️ Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    openChefModal(chefId = null) {
        this.currentEditingChef = chefId;
        const modal = document.getElementById('chefModal');
        const title = document.getElementById('chefModalTitle');
        const form = document.getElementById('chefForm');
        
        if (chefId) {
            const chef = this.chefs.find(c => c._id === chefId);
            if (chef) {
                title.textContent = 'Edit Chef';
                document.getElementById('chefName').value = chef.fullName;
                document.getElementById('chefExperience').value = chef.experience;
                document.getElementById('chefSpecialties').value = chef.specialties.join(', ');
                document.getElementById('chefBio').value = chef.bio || '';
                document.getElementById('chefRating').value = chef.rating;
                document.getElementById('chefStatus').value = chef.status;
                
                // Show existing photo
                const preview = document.getElementById('chefPhotoPreview');
                preview.innerHTML = `<img src="${chef.profilePhoto}" alt="Preview" style="max-height: 140px; border-radius: 10px;">`;
                preview.classList.add('has-image');
            }
        } else {
            title.textContent = 'Add New Chef';
            form.reset();
            const preview = document.getElementById('chefPhotoPreview');
            preview.innerHTML = '<span class="upload-placeholder">No image selected</span>';
            preview.classList.remove('has-image');
        }
        
        modal.style.display = 'flex';
    }

    closeChefModal() {
        document.getElementById('chefModal').style.display = 'none';
        this.currentEditingChef = null;
    }

    async handleChefSubmit() {
        const formData = new FormData(document.getElementById('chefForm'));
        const chefData = {
            fullName: formData.get('fullName'),
            experience: formData.get('experience'),
            specialties: formData.get('specialties').split(',').map(s => s.trim()).filter(s => s),
            bio: formData.get('bio'),
            rating: parseFloat(formData.get('rating')),
            status: formData.get('status')
        };

        // Handle photo upload
        const photoFile = document.getElementById('chefPhoto').files[0];
        if (photoFile && photoFile.size > 0) {
            const reader = new FileReader();
            reader.onload = async () => {
                chefData.profilePhoto = reader.result;
                await this.saveChef(chefData);
            };
            reader.readAsDataURL(photoFile);
        } else {
            await this.saveChef(chefData);
        }
    }

    async saveChef(chefData) {
        try {
            const url = this.currentEditingChef ? `/api/chefs/${this.currentEditingChef}` : '/api/chefs';
            const method = this.currentEditingChef ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(chefData)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                this.showNotification(
                    this.currentEditingChef ? 'Chef details updated successfully' : 'Chef added successfully', 
                    'success'
                );
                this.closeChefModal();
                await this.refreshChefs();
            } else {
                this.showNotification(`Failed to save chef: ${result.error || 'Unknown error'}`, 'error');
            }
        } catch (error) {
            console.error('Error saving chef:', error);
            this.showNotification('Error saving chef', 'error');
        }
    }

    editChef(chefId) {
        this.openChefModal(chefId);
    }

    async deleteChef(chefId) {
        if (!confirm('Are you sure you want to delete this chef?')) {
            return;
        }

        try {
            const response = await fetch(`/api/chefs/${chefId}`, { method: 'DELETE' });
            const result = await response.json();
            
            if (response.ok) {
                this.showNotification('Chef deleted successfully', 'success');
                await this.refreshChefs();
            } else {
                this.showNotification(`Failed to delete chef: ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Error deleting chef:', error);
            this.showNotification('Error deleting chef', 'error');
        }
    }

    // Table Booking Methods
    async loadTableBookings() {
        try {
            const response = await fetch('/api/table-bookings');
            if (response.ok) {
                this.tableBookings = await response.json();
                this.renderTableBookings();
            }
        } catch (error) {
            console.error('Error loading table bookings:', error);
            this.showNotification('Error loading table bookings', 'error');
        }
    }

    async refreshTableBookings() {
        try {
            await this.loadTableBookings();
        } catch (error) {
            console.error('Error refreshing table bookings:', error);
            this.showNotification('Error loading table bookings', 'error');
        }
    }

    renderTableBookings() {
        const bookingsGrid = document.getElementById('bookingsGrid');
        if (!bookingsGrid) return;

        if (this.tableBookings.length === 0) {
            bookingsGrid.innerHTML = `
                <div class="no-bookings">
                    <h3>No table bookings found</h3>
                    <p>Table bookings from users will appear here</p>
                </div>
            `;
            return;
        }

        bookingsGrid.innerHTML = this.tableBookings.map(booking => `
            <div class="booking-card">
                <div class="booking-header">
                    <h3 class="booking-name">${booking.fullName}</h3>
                    <span class="booking-status ${booking.status}">${booking.status}</span>
                </div>
                
                <div class="booking-details">
                    <div class="booking-detail">
                        <span class="booking-detail-label">Table</span>
                        <span class="booking-detail-value">${booking.tableNumber || 'Table ' + booking.tableId}</span>
                    </div>
                    
                    <div class="booking-detail">
                        <span class="booking-detail-label">Persons</span>
                        <span class="booking-detail-value">${booking.persons} people</span>
                    </div>
                    
                    <div class="booking-detail">
                        <span class="booking-detail-label">Date</span>
                        <span class="booking-detail-value">${new Date(booking.bookingDate).toLocaleDateString()}</span>
                    </div>
                    
                    <div class="booking-detail">
                        <span class="booking-detail-label">Time</span>
                        <span class="booking-detail-value">${booking.bookingTime}</span>
                    </div>
                    
                    <div class="booking-detail">
                        <span class="booking-detail-label">Phone</span>
                        <span class="booking-detail-value">${booking.phone}</span>
                    </div>
                    
                    <div class="booking-detail">
                        <span class="booking-detail-label">Payment</span>
                        <div class="booking-payment">
                            <span class="payment-icon">${booking.paymentMethod === 'card' ? '💳' : '📱'}</span>
                            <span class="booking-detail-value">${booking.paymentMethod.toUpperCase()}</span>
                        </div>
                    </div>
                </div>
                
                <div class="booking-actions">
                    <button class="booking-action-btn primary" onclick="window.adminDashboard.updateBookingStatus('${booking.id}', 'confirmed')">
                        Confirm
                    </button>
                    <button class="booking-action-btn secondary" onclick="window.adminDashboard.updateBookingStatus('${booking.id}', 'pending')">
                        Pending
                    </button>
                    <button class="booking-action-btn danger" onclick="window.adminDashboard.updateBookingStatus('${booking.id}', 'cancelled')">
                        Cancel
                    </button>
                </div>
            </div>
        `).join('');
    }

    async updateBookingStatus(bookingId, newStatus) {
        try {
            const response = await fetch(`/api/table-bookings/${bookingId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.adminToken}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                this.showNotification('Booking status updated successfully', 'success');
                await this.loadTableBookings();
            } else {
                const error = await response.json();
                this.showNotification(error.message || 'Failed to update booking status', 'error');
            }
        } catch (error) {
            console.error('Error updating booking status:', error);
            this.showNotification('Error updating booking status', 'error');
        }
    }

    // Socket event handlers for table bookings
    handleNewTableBooking(booking) {
        console.log('New table booking received:', booking);
        this.showNotification('New table booking received', 'success');
        
        // Refresh the table bookings list
        this.loadTableBookings();
        
        // Update dashboard stats if on dashboard
        const dashboard = document.getElementById('dashboard');
        if (dashboard && dashboard.classList.contains('active')) {
            this.loadDashboardStats();
        }
    }

    handleTableBookingUpdate(booking) {
        console.log('Table booking updated:', booking);
        
        // Refresh the table bookings list
        this.loadTableBookings();
    }
}

// Global functions for onclick handlers
function showAddItems() {
    document.getElementById('dashboard').classList.remove('active');
    document.getElementById('addItemsPage').classList.add('active');
    document.getElementById('orderStatusPage').classList.remove('active');
    document.getElementById('ridersPage').classList.remove('active');
    document.getElementById('chefsPage').classList.remove('active');
    document.getElementById('tableBookingPage').classList.remove('active');
    
    // Hide dashboard header and stats
    const dashboardHeader = document.querySelector('.dashboard-header');
    const dashboardStats = document.querySelector('.dashboard-stats');
    if (dashboardHeader) dashboardHeader.style.display = 'none';
    if (dashboardStats) dashboardStats.style.display = 'none';
    
    // Load menu items when page is shown
    if (window.adminDashboard) {
        window.adminDashboard.loadMenuItems();
    }
}

function showUpdateOrders() {
    document.getElementById('dashboard').classList.remove('active');
    document.getElementById('addItemsPage').classList.remove('active');
    document.getElementById('orderStatusPage').classList.add('active');
    document.getElementById('ridersPage').classList.remove('active');
    document.getElementById('chefsPage').classList.remove('active');
    document.getElementById('tableBookingPage').classList.remove('active');
    
    // Hide dashboard header and stats
    const dashboardHeader = document.querySelector('.dashboard-header');
    const dashboardStats = document.querySelector('.dashboard-stats');
    if (dashboardHeader) dashboardHeader.style.display = 'none';
    if (dashboardStats) dashboardStats.style.display = 'none';
    
    // Load orders when page is shown
    if (window.adminDashboard) {
        window.adminDashboard.loadOrders();
    }
}

function showRiders() {
    document.getElementById('dashboard').classList.remove('active');
    document.getElementById('addItemsPage').classList.remove('active');
    document.getElementById('orderStatusPage').classList.remove('active');
    document.getElementById('ridersPage').classList.add('active');
    document.getElementById('chefsPage').classList.remove('active');
    document.getElementById('tableBookingPage').classList.remove('active');
    
    // Hide dashboard header and stats
    const dashboardHeader = document.querySelector('.dashboard-header');
    const dashboardStats = document.querySelector('.dashboard-stats');
    if (dashboardHeader) dashboardHeader.style.display = 'none';
    if (dashboardStats) dashboardStats.style.display = 'none';
    
    // Load riders when page is shown
    if (window.adminDashboard) {
        window.adminDashboard.loadRiders();
    }
}

function showChefs() {
    document.getElementById('dashboard').classList.remove('active');
    document.getElementById('addItemsPage').classList.remove('active');
    document.getElementById('orderStatusPage').classList.remove('active');
    document.getElementById('ridersPage').classList.remove('active');
    document.getElementById('chefsPage').classList.add('active');
    document.getElementById('tableBookingPage').classList.remove('active');
    
    // Hide dashboard header and stats
    const dashboardHeader = document.querySelector('.dashboard-header');
    const dashboardStats = document.querySelector('.dashboard-stats');
    if (dashboardHeader) dashboardHeader.style.display = 'none';
    if (dashboardStats) dashboardStats.style.display = 'none';
    
    // Load chefs when page is shown
    if (window.adminDashboard) {
        window.adminDashboard.loadChefs();
    }
}

function showTableBooking() {
    document.getElementById('dashboard').classList.remove('active');
    document.getElementById('addItemsPage').classList.remove('active');
    document.getElementById('orderStatusPage').classList.remove('active');
    document.getElementById('ridersPage').classList.remove('active');
    document.getElementById('chefsPage').classList.remove('active');
    document.getElementById('tableBookingPage').classList.add('active');
    
    // Hide dashboard header and stats
    const dashboardHeader = document.querySelector('.dashboard-header');
    const dashboardStats = document.querySelector('.dashboard-stats');
    if (dashboardHeader) dashboardHeader.style.display = 'none';
    if (dashboardStats) dashboardStats.style.display = 'none';
    
    // Load table bookings when page is shown
    if (window.adminDashboard) {
        window.adminDashboard.loadTableBookings();
    }
}

function showDashboard() {
    document.getElementById('dashboard').classList.add('active');
    document.getElementById('addItemsPage').classList.remove('active');
    document.getElementById('orderStatusPage').classList.remove('active');
    document.getElementById('ridersPage').classList.remove('active');
    document.getElementById('chefsPage').classList.remove('active');
    document.getElementById('tableBookingPage').classList.remove('active');
    
    // Show dashboard header and stats
    const dashboardHeader = document.querySelector('.dashboard-header');
    const dashboardStats = document.querySelector('.dashboard-stats');
    if (dashboardHeader) dashboardHeader.style.display = 'block';
    if (dashboardStats) dashboardStats.style.display = 'grid';
}

// Initialize admin dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminDashboard = new AdminDashboard();
});
