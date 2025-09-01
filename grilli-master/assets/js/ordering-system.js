// Working Ordering System for Grilli Restaurant
class OrderingSystem {
    constructor() {
        this.cart = [];
        this.currentItem = null;
        this.gstRate = 0.18; // 18% GST
        this.deliveryCharge = 40; // Fixed delivery charge
        this.apiBaseUrl = '/api';
        this.socket = null;
        this.isDarkTheme = true; // Set dark theme as default
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeSocket();
        this.loadCartFromStorage();
        this.updateCartDisplay();
        this.setupMenuCardClickHandlers();
        this.addThemeToggle();
        this.loadThemePreference();
    }

    setupEventListeners() {
        // Listen for order form submission
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'orderForm') {
                e.preventDefault();
                this.handleOrderSubmission();
            }
        });

        // Listen for quantity changes
        document.addEventListener('change', (e) => {
            if (e.target.id === 'quantity') {
                this.updatePriceBreakdown();
            }
        });

        // Listen for order button clicks
        document.addEventListener('click', (e) => {
            if (e.target.id === 'orderNowBtn') {
                this.showOrderModal();
            }
        });
    }

    setupMenuCardClickHandlers() {
        // Find all menu cards and add click handlers
        const menuCards = document.querySelectorAll('.menu-card');
        menuCards.forEach(card => {
            card.addEventListener('click', (e) => {
                // Don't trigger if clicking on links
                if (e.target.closest('a')) return;
                
                const itemId = card.dataset.itemId;
                if (itemId) {
                    this.showOrderModal(itemId);
                }
            });
        });
    }

    async showOrderModal(itemId = null) {
        // Allow ordering without requiring login
        // If loginSystem exists and user is logged in, we can still proceed normally

        let item = this.currentItem;
        
        if (itemId && !item) {
            try {
                const response = await fetch(`${this.apiBaseUrl}/menu-items/${itemId}`);
                if (response.ok) {
                    item = await response.json();
                    this.currentItem = item;
                }
            } catch (error) {
                console.error('Error fetching item details:', error);
                this.showNotification('Error loading item details', 'error');
                return;
            }
        }

        if (!item) {
            this.showNotification('No item selected for ordering', 'error');
            return;
        }

        this.displayOrderModal(item);
    }

    showLoginRequiredModal() {
        const modalHTML = `
            <div id="loginRequiredModal" class="order-modal active">
                <div class="order-modal-content">
                    <div class="order-modal-header">
                        <h2>Login Required</h2>
                        <button class="close-modal" onclick="orderingSystem.closeLoginRequiredModal()">&times;</button>
                    </div>
                    
                    <div class="login-required-content">
                        <div class="login-required-icon">
                            <ion-icon name="person-circle-outline" aria-hidden="true"></ion-icon>
                        </div>
                        
                        <h3>Please Login to Place Orders</h3>
                        <p>You need to be logged in to place orders and track your food delivery.</p>
                        
                        <div class="login-required-actions">
                            <button type="button" class="btn-secondary" onclick="orderingSystem.closeLoginRequiredModal()">Cancel</button>
                            <button type="button" class="btn-primary" onclick="orderingSystem.openLoginModal()">Login Now</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('loginRequiredModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Apply current theme to the modal immediately
        this.updateTheme();
        
        // Force dark theme if it's the default
        if (this.isDarkTheme) {
            const modal = document.getElementById('loginRequiredModal');
            if (modal) {
                modal.classList.add('dark-theme');
            }
        }
    }

    closeLoginRequiredModal() {
        const modal = document.getElementById('loginRequiredModal');
        if (modal) {
            modal.remove();
        }
    }

    openLoginModal() {
        this.closeLoginRequiredModal();
        if (window.loginSystem) {
            window.loginSystem.showLogin();
        }
    }

    displayOrderModal(item) {
        const modalHTML = `
            <div id="orderModal" class="order-modal active">
                <div class="order-modal-content">
                    <div class="order-modal-header">
                        <h2>Order ${item.name}</h2>
                        <button class="close-modal" onclick="orderingSystem.closeOrderModal()">&times;</button>
                    </div>
                    
                    <div class="order-item-details">
                        <div class="item-image">
                            <img src="${item.image}" alt="${item.name}" onerror="this.src='./assets/images/menu-1.png'">
                        </div>
                        <div class="item-info">
                            <h3>${item.name}</h3>
                            <p class="item-description">${item.description}</p>
                            <p class="item-type ${item.type === 'veg' ? 'vegetarian' : 'non-vegetarian'}">${item.type === 'veg' ? '🥬 Vegetarian' : '🍖 Non-Vegetarian'}</p>
                            <p class="item-price">₹${item.price.toFixed(2)}</p>
                        </div>
                    </div>
                    
                    <form id="orderForm" class="order-form">
                        <div class="form-group">
                            <label for="customerName">Name:</label>
                            <input type="text" id="customerName" name="customerName" required>
                        </div>

                        <div class="form-group">
                            <label for="vegType">Veg / Non-Veg:</label>
                            <select id="vegType" name="vegType" required>
                                <option value="">Select Type</option>
                                <option value="veg">Vegetarian</option>
                                <option value="non-veg">Non-Vegetarian</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="address">Address:</label>
                            <textarea id="address" name="address" rows="3" required placeholder="Full delivery address"></textarea>
                        </div>

                        <div class="form-group">
                            <label for="quantity">Quantity:</label>
                            <input type="number" id="quantity" name="quantity" value="1" min="1" max="50" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="specialInstructions">Note (extra instructions):</label>
                            <textarea id="specialInstructions" name="specialInstructions" rows="3" placeholder="Any special requests or instructions..." required></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="deliveryDate">Date:</label>
                            <input type="date" id="deliveryDate" name="deliveryDate" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="deliveryTime">Time:</label>
                            <input type="time" id="deliveryTime" name="deliveryTime" required>
                        </div>
                        
                        <div class="price-breakdown">
                            <h4>Price Breakdown</h4>
                            <div class="price-row">
                                <span>Item Price:</span>
                                <span id="itemPrice">₹${item.price.toFixed(2)}</span>
                            </div>
                            <div class="price-row">
                                <span>Quantity:</span>
                                <span id="quantityDisplay">1</span>
                            </div>
                            <div class="price-row">
                                <span>Subtotal:</span>
                                <span id="subtotal">₹${item.price.toFixed(2)}</span>
                            </div>
                            <div class="price-row">
                                <span>GST (18%):</span>
                                <span id="gstAmount">₹${(item.price * this.gstRate).toFixed(2)}</span>
                            </div>
                            <div class="price-row">
                                <span>Delivery Charge:</span>
                                <span id="deliveryChargeDisplay">₹${this.deliveryCharge.toFixed(2)}</span>
                            </div>
                            <div class="price-row total">
                                <span>Total Amount:</span>
                                <span id="totalAmount">₹${this.calculateTotal(item.price, 1).toFixed(2)}</span>
                            </div>
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="btn-secondary" onclick="orderingSystem.closeOrderModal()">Cancel</button>
                            <button type="submit" class="btn-primary">Place Order</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('orderModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Apply current theme to the modal immediately
        this.updateTheme();
        
        if (this.isDarkTheme) {
            const modal = document.getElementById('orderModal');
            if (modal) {
                modal.classList.add('dark-theme');
            }
        }
        
        const quantityInput = document.getElementById('quantity');
        if (quantityInput) {
            quantityInput.addEventListener('change', () => {
                this.updatePriceBreakdown();
            });
        }

        // Set minimum delivery date to today
        const deliveryDateInput = document.getElementById('deliveryDate');
        if (deliveryDateInput) {
            const today = new Date();
            deliveryDateInput.min = today.toISOString().split('T')[0];
        }
    }

    closeOrderModal() {
        const modal = document.getElementById('orderModal');
        if (modal) {
            modal.remove();
        }
        this.currentItem = null;
    }

    updatePriceBreakdown() {
        if (!this.currentItem) return;

        const quantity = parseInt(document.getElementById('quantity').value) || 1;
        const subtotal = this.currentItem.price * quantity;
        const gstAmount = subtotal * this.gstRate;
        const total = this.calculateTotal(this.currentItem.price, quantity);

        document.getElementById('quantityDisplay').textContent = quantity;
        document.getElementById('subtotal').textContent = `₹${subtotal.toFixed(2)}`;
        document.getElementById('gstAmount').textContent = `₹${gstAmount.toFixed(2)}`;
        document.getElementById('totalAmount').textContent = `₹${total.toFixed(2)}`;
    }

    calculateTotal(itemPrice, quantity) {
        const subtotal = itemPrice * quantity;
        const gstAmount = subtotal * this.gstRate;
        return subtotal + gstAmount + this.deliveryCharge;
    }

    async handleOrderSubmission() {
        if (!this.currentItem) {
            this.showNotification('No item selected for ordering', 'error');
            return;
        }

        const form = document.getElementById('orderForm');
        if (!form.checkValidity()) {
            this.showNotification('Please fill all required fields', 'warning');
            form.reportValidity();
            return;
        }

        const formData = new FormData(form);
        const quantity = parseInt(formData.get('quantity')) || 1;
        const orderData = {
            itemId: this.currentItem._id,
            itemName: this.currentItem.name,
            itemImage: this.currentItem.image,
            unitPrice: this.currentItem.price,
            quantity,
            customerName: formData.get('customerName'),
            customerPhone: formData.get('customerPhone') || '',
            customerEmail: formData.get('customerEmail') || '',
            vegType: formData.get('vegType'),
            customerAddress: formData.get('address'),
            deliveryDate: formData.get('deliveryDate'),
            deliveryTime: formData.get('deliveryTime'),
            paymentMethod: 'cash',
            specialInstructions: formData.get('specialInstructions') || '',
            subtotal: this.currentItem.price * quantity,
            gstAmount: (this.currentItem.price * quantity * this.gstRate),
            deliveryCharge: this.deliveryCharge,
            totalPrice: this.calculateTotal(this.currentItem.price, quantity)
        };

        try {
            const response = await fetch(`${this.apiBaseUrl}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            });

            if (response.ok) {
                const order = await response.json();
                this.saveOrderToLocalStorage(order);
                this.showNotification('Order placed successfully!', 'success');
                this.closeOrderModal();
                this.addToCart(order);
                this.updateCartDisplay();
            } else {
                const errorData = await response.json();
                this.showNotification(errorData.error || 'Failed to place order', 'error');
            }
        } catch (error) {
            console.error('Error placing order:', error);
            this.showNotification('Network error. Please try again.', 'error');
        }
    }

    saveOrderToLocalStorage(order) {
        try {
            // Get existing orders from localStorage
            const existingOrders = JSON.parse(localStorage.getItem('grilliOrders') || '[]');
            
            // Create a user-friendly order object
            const userOrder = {
                id: order._id,
                item: {
                    name: order.itemName,
                    price: order.unitPrice,
                    image: order.itemImage
                },
                quantity: order.quantity,
                totalAmount: order.totalPrice,
                customerName: order.customerName,
                customerPhone: order.customerPhone,
                customerEmail: order.customerEmail,
                customerAddress: order.customerAddress || 'Not specified',
                customerCity: order.customerCity || 'Not specified',
                customerPincode: order.customerPincode || 'Not specified',
                deliveryDate: order.deliveryDate,
                deliveryTime: order.deliveryTime,
                paymentMethod: order.paymentMethod,
                specialInstructions: order.specialInstructions,
                orderTime: new Date().toISOString(),
                status: 'pending',
                estimatedDelivery: order.deliveryDate + ' at ' + order.deliveryTime
            };
            
            // Add new order to the beginning
            existingOrders.unshift(userOrder);
            
            // Save back to localStorage
            localStorage.setItem('grilliOrders', JSON.stringify(existingOrders));
            
            console.log('Order saved to localStorage:', userOrder);
        } catch (error) {
            console.error('Error saving order to localStorage:', error);
        }
    }

    addToCart(order) {
        this.cart.push(order);
        this.saveCartToStorage();
    }

    loadCartFromStorage() {
        const cartData = localStorage.getItem('grilliCart');
        if (cartData) {
            this.cart = JSON.parse(cartData);
        }
    }

    updateCartDisplay() {
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            cartCount.textContent = this.cart.length;
        }
    }

    saveCartToStorage() {
        localStorage.setItem('grilliCart', JSON.stringify(this.cart));
    }

    initializeSocket() {
        // Initialize Socket.IO connection
        if (typeof io !== 'undefined') {
            this.socket = io();
            
            this.socket.on('connect', () => {
                console.log('Connected to main server for ordering');
            });

            this.socket.on('disconnect', () => {
                console.log('Disconnected from main server');
            });

            // Listen for order updates
            this.socket.on('order-updated', (data) => {
                this.handleOrderUpdate(data);
            });
        }
    }

    handleOrderUpdate(data) {
        // Update order status if user is on orders page
        if (window.location.pathname.includes('orders.html')) {
            window.location.reload();
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : type === 'warning' ? '#ff9800' : '#2196f3'};
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            max-width: 300px;
            font-size: 14px;
            transform: translateX(400px);
            transition: transform 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after 4 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }

    addThemeToggle() {
        // Create theme toggle button
        const themeToggle = document.createElement('button');
        themeToggle.className = 'theme-toggle';
        // Set initial state based on current theme
        themeToggle.innerHTML = this.isDarkTheme ? '☀️' : '🌙';
        themeToggle.title = this.isDarkTheme ? 'Switch to Light Theme' : 'Switch to Dark Theme';
        themeToggle.onclick = () => this.toggleTheme();
        
        // Add to body
        document.body.appendChild(themeToggle);
    }

    toggleTheme() {
        this.isDarkTheme = !this.isDarkTheme;
        this.updateTheme();
        this.saveThemePreference();
    }

    updateTheme() {
        const modal = document.getElementById('orderModal');
        const themeToggle = document.querySelector('.theme-toggle');
        
        if (this.isDarkTheme) {
            if (modal) modal.classList.add('dark-theme');
            if (themeToggle) {
                themeToggle.innerHTML = '☀️';
                themeToggle.title = 'Switch to Light Theme';
            }
        } else {
            if (modal) modal.classList.remove('dark-theme');
            if (themeToggle) {
                themeToggle.innerHTML = '🌙';
                themeToggle.title = 'Switch to Dark Theme';
            }
        }
    }

    loadThemePreference() {
        const savedTheme = localStorage.getItem('grilliTheme');
        // Default to dark theme unless user explicitly chose light
        if (savedTheme === 'light') {
            this.isDarkTheme = false;
        } else {
            this.isDarkTheme = true; // Default to dark theme
        }
        this.updateTheme();
    }

    saveThemePreference() {
        localStorage.setItem('grilliTheme', this.isDarkTheme ? 'dark' : 'light');
    }
    
    // Force refresh theme for debugging
    forceDarkTheme() {
        this.isDarkTheme = true;
        this.updateTheme();
        this.saveThemePreference();
        console.log('🔧 Forced dark theme');
        
        // Apply to existing modal if open
        const modal = document.getElementById('orderModal');
        if (modal) {
            modal.classList.add('dark-theme');
            console.log('✅ Dark theme applied to existing modal');
        }
    }
}

// Initialize ordering system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.orderingSystem = new OrderingSystem();
});
