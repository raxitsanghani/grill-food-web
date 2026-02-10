// Working Ordering System for Grilli Restaurant
class OrderingSystem {
    constructor() {
        this.cart = [];
        this.currentItem = null;
        this.gstRate = 0.18; // 18% GST
        this.deliveryCharge = 40; // Fixed delivery charge ₹40
        this.apiBaseUrl = '/api';
        this.socket = null;
        this.isDarkTheme = true; // Set dark theme as default
        this.priceCalculator = window.PriceCalculator || null;
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
        console.log('showOrderModal called with itemId:', itemId);
        
        // Allow ordering without requiring login
        // If loginSystem exists and user is logged in, we can still proceed normally

        let item = this.currentItem;
        
        if (itemId && !item) {
            try {
                console.log('Fetching item details for:', itemId);
                // Use explicit by-id endpoint to avoid category route collision
                const response = await fetch(`${this.apiBaseUrl}/menu-items/by-id/${itemId}`);
                console.log('Response status:', response.status);
                if (response.ok) {
                    item = await response.json();
                    console.log('Item fetched:', item);
                    this.currentItem = item;
                } else {
                    console.error('Failed to fetch item:', response.status, response.statusText);
                    this.showNotification('Error loading item details', 'error');
                    return;
                }
            } catch (error) {
                console.error('Error fetching item details:', error);
                this.showNotification('Error loading item details', 'error');
                return;
            }
        }

        if (!item) {
            console.error('No item available for ordering');
            this.showNotification('No item selected for ordering', 'error');
            return;
        }

        console.log('Displaying order modal for item:', item);
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
                <div class="order-modal-overlay" onclick="orderingSystem.closeOrderModal()"></div>
                <div class="order-modal-content">
                    <div class="order-modal-header">
                        <div class="header-content">
                            <h2>🍽️ Place Your Order</h2>
                            <p class="header-subtitle">Complete your order details below</p>
                        </div>
                        <button class="close-modal" onclick="orderingSystem.closeOrderModal()">
                            <span>&times;</span>
                        </button>
                    </div>
                    
                    <div class="order-modal-body">
                        <!-- Item Details Section -->
                        <div class="item-details-section">
                            <div class="item-image-container">
                                <img src="${item.image}" alt="${item.name}" class="item-image" onerror="this.src='./assets/images/menu-1.png'">
                                ${item.badge ? `<div class="item-badge">${item.badge}</div>` : ''}
                            </div>
                            <div class="item-info">
                                <h3 class="item-name">${item.name}</h3>
                                <p class="item-description">${item.description}</p>
                                <div class="item-meta">
                                    <div class="item-type">
                                        <span class="type-icon">${item.type === 'veg' ? '🌱' : '🍖'}</span>
                                        <span>${item.type === 'veg' ? 'Vegetarian' : 'Non-Vegetarian'}</span>
                                    </div>
                                    <div class="item-delivery-time">
                                        <span class="time-icon">⏱️</span>
                                        <span>${item.deliveryTime || '25-35 min'}</span>
                                    </div>
                                </div>
                                <div class="item-price">
                                    <span class="price-label">Price:</span>
                                    <span class="price-amount">₹${item.price.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Order Form -->
                        <form id="orderForm" class="order-form">
                            <div class="form-section">
                                <h4 class="section-title">📝 Order Details</h4>
                                
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="quantity">Quantity</label>
                                        <div class="quantity-selector">
                                            <button type="button" class="qty-btn" onclick="orderingSystem.decreaseQuantity()">-</button>
                                            <input type="number" id="quantity" name="quantity" min="1" value="1" readonly>
                                            <button type="button" class="qty-btn" onclick="orderingSystem.increaseQuantity()">+</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-section">
                                <h4 class="section-title">👤 Customer Information</h4>
                                
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="customerName">Full Name *</label>
                                        <input type="text" id="customerName" name="customerName" placeholder="Enter your full name" required>
                                    </div>
                                </div>
                                
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="customerPhone">Phone Number *</label>
                                        <input type="tel" id="customerPhone" name="customerPhone" placeholder="Enter your phone number" required>
                                    </div>
                                    <div class="form-group">
                                        <label for="customerEmail">Email (Optional)</label>
                                        <input type="email" id="customerEmail" name="customerEmail" placeholder="Enter your email">
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-section">
                                <h4 class="section-title">📍 Delivery Information</h4>
                                
                                <div class="form-group">
                                    <label for="deliveryAddress">Delivery Address *</label>
                                    <textarea id="deliveryAddress" name="deliveryAddress" rows="3" placeholder="Enter your complete delivery address" required></textarea>
                                </div>
                                
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="deliveryDate">Preferred Delivery Date</label>
                                        <input type="date" id="deliveryDate" name="deliveryDate" min="${new Date().toISOString().split('T')[0]}">
                                    </div>
                                    <div class="form-group">
                                        <label for="deliveryTime">Preferred Time</label>
                                        <select id="deliveryTime" name="deliveryTime">
                                            <option value="">Select time</option>
                                            <option value="12:00-13:00">12:00 PM - 1:00 PM</option>
                                            <option value="13:00-14:00">1:00 PM - 2:00 PM</option>
                                            <option value="19:00-20:00">7:00 PM - 8:00 PM</option>
                                            <option value="20:00-21:00">8:00 PM - 9:00 PM</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-section">
                                <h4 class="section-title">💳 Payment Method</h4>
                                
                                <div class="payment-options">
                                    <label class="payment-option">
                                        <input type="radio" name="paymentMethod" value="cash" required>
                                        <div class="payment-card">
                                            <span class="payment-icon">💵</span>
                                            <span class="payment-text">Cash on Delivery</span>
                                        </div>
                                    </label>
                                    
                                    <label class="payment-option">
                                        <input type="radio" name="paymentMethod" value="card" required>
                                        <div class="payment-card">
                                            <span class="payment-icon">💳</span>
                                            <span class="payment-text">Credit/Debit Card</span>
                                        </div>
                                    </label>
                                    
                                    <label class="payment-option">
                                        <input type="radio" name="paymentMethod" value="upi" required>
                                        <div class="payment-card">
                                            <span class="payment-icon">📱</span>
                                            <span class="payment-text">UPI Payment</span>
                                        </div>
                                    </label>
                                </div>
                            </div>
                            
                            <!-- Order Summary -->
                            <div class="order-summary-section">
                                <h4 class="section-title">💰 Order Summary</h4>
                                <div class="order-summary">
                                    <div class="summary-row">
                                        <span>Item Price (×<span id="summaryQuantity">1</span>):</span>
                                        <span>₹<span id="summaryItemPrice">${item.price.toFixed(2)}</span></span>
                                    </div>
                                    <div class="summary-row">
                                        <span>Delivery Fee:</span>
                                        <span>₹<span id="deliveryFee">40.00</span></span>
                                    </div>
                                    <div class="summary-row">
                                        <span>GST (18%):</span>
                                        <span>₹<span id="serviceTax">${(item.price * 0.18).toFixed(2)}</span></span>
                                    </div>
                                    <div class="summary-row total">
                                        <span>Total Amount:</span>
                                        <span>₹<span id="totalAmount">${(item.price + 40 + (item.price * 0.18)).toFixed(2)}</span></span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-actions">
                                <button type="button" class="btn-secondary" onclick="orderingSystem.closeOrderModal()">
                                    <span>Cancel</span>
                                </button>
                                <button type="submit" class="btn-primary">
                                    <span>🚀 Place Order</span>
                                </button>
                            </div>
                        </form>
                    </div>
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

    increaseQuantity() {
        const quantityInput = document.getElementById('quantity');
        if (quantityInput) {
            const currentQty = parseInt(quantityInput.value) || 1;
            const newQty = Math.min(currentQty + 1, 10); // Max 10 items
            quantityInput.value = newQty;
            this.updateOrderSummary();
        }
    }

    decreaseQuantity() {
        const quantityInput = document.getElementById('quantity');
        if (quantityInput) {
            const currentQty = parseInt(quantityInput.value) || 1;
            const newQty = Math.max(currentQty - 1, 1); // Min 1 item
            quantityInput.value = newQty;
            this.updateOrderSummary();
        }
    }

    updateOrderSummary() {
        if (!this.currentItem) return;
        
        const quantity = parseInt(document.getElementById('quantity')?.value) || 1;
        
        // Use unified price calculator if available
        let priceBreakdown;
        if (this.priceCalculator) {
            priceBreakdown = this.priceCalculator.calculateOrderTotal(this.currentItem.price, quantity);
        } else {
            // Fallback calculation
            const subtotal = this.currentItem.price * quantity;
            const gstAmount = subtotal * this.gstRate;
            priceBreakdown = {
                subtotal: subtotal,
                gstAmount: gstAmount,
                deliveryCharge: this.deliveryCharge,
                total: subtotal + gstAmount + this.deliveryCharge,
                quantity: quantity
            };
        }

        // Update summary elements
        const summaryQuantity = document.getElementById('summaryQuantity');
        const summaryItemPrice = document.getElementById('summaryItemPrice');
        const deliveryFeeElement = document.getElementById('deliveryFee');
        const serviceTaxElement = document.getElementById('serviceTax');
        const gstAmountElement = document.getElementById('gstAmount');
        const totalAmount = document.getElementById('totalAmount');

        if (summaryQuantity) summaryQuantity.textContent = priceBreakdown.quantity;
        if (summaryItemPrice) summaryItemPrice.textContent = priceBreakdown.subtotal.toFixed(2);
        if (deliveryFeeElement) deliveryFeeElement.textContent = priceBreakdown.deliveryCharge.toFixed(2);
        if (serviceTaxElement) {
            // Update label and value to show GST instead of Service Tax
            serviceTaxElement.textContent = priceBreakdown.gstAmount.toFixed(2);
            const serviceTaxLabel = serviceTaxElement.previousElementSibling;
            if (serviceTaxLabel && serviceTaxLabel.tagName === 'SPAN') {
                serviceTaxLabel.textContent = 'GST (18%):';
            }
        }
        if (gstAmountElement) gstAmountElement.textContent = priceBreakdown.gstAmount.toFixed(2);
        if (totalAmount) totalAmount.textContent = priceBreakdown.total.toFixed(2);
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
        if (!form) {
            this.showNotification('Order form not found', 'error');
            return;
        }
        
        if (!form.checkValidity()) {
            this.showNotification('Please fill all required fields', 'warning');
            form.reportValidity();
            return;
        }

        const formData = new FormData(form);
        const quantity = parseInt(formData.get('quantity')) || 1;
        
        // Use unified price calculation
        let priceBreakdown;
        if (this.priceCalculator) {
            priceBreakdown = this.priceCalculator.calculateOrderTotal(this.currentItem.price, quantity);
        } else {
            priceBreakdown = this.calculatePriceBreakdown(this.currentItem.price, quantity);
        }
        
        const orderData = {
            itemId: this.currentItem._id,
            itemName: this.currentItem.name,
            itemImage: this.currentItem.image,
            unitPrice: this.currentItem.price,
            quantity,
            customerName: formData.get('customerName'),
            customerPhone: formData.get('customerPhone') || '',
            customerEmail: formData.get('customerEmail') || '',
            customerAddress: formData.get('deliveryAddress') || '',
            deliveryDate: formData.get('deliveryDate') || '',
            deliveryTime: formData.get('deliveryTime') || '',
            paymentMethod: formData.get('paymentMethod') || 'cash',
            specialInstructions: formData.get('specialInstructions') || '',
            subtotal: priceBreakdown.subtotal,
            gstAmount: priceBreakdown.gstAmount,
            deliveryCharge: priceBreakdown.deliveryCharge,
            totalPrice: priceBreakdown.total
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
                const errorData = await response.json().catch(() => ({ error: 'Failed to place order' }));
                const errorMessage = window.ErrorHandler ? 
                    window.ErrorHandler.handleError(new Error(errorData.error || 'Failed to place order'), 'Order Submission') :
                    (errorData.error || 'Failed to place order');
                this.showNotification(errorMessage, 'error');
            }
        } catch (error) {
            const errorMessage = window.ErrorHandler ? 
                window.ErrorHandler.handleError(error, 'Order Submission') :
                'Network error. Please try again.';
            this.showNotification(errorMessage, 'error');
        }
    }
    
    calculatePriceBreakdown(itemPrice, quantity) {
        const subtotal = itemPrice * quantity;
        const gstAmount = subtotal * this.gstRate;
        return {
            subtotal: parseFloat(subtotal.toFixed(2)),
            gstAmount: parseFloat(gstAmount.toFixed(2)),
            deliveryCharge: this.deliveryCharge,
            total: parseFloat((subtotal + gstAmount + this.deliveryCharge).toFixed(2))
        };
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

    async initializeSocket() {
        // Use SocketManager for proper error handling
        if (window.SocketManager) {
            const socketManager = new window.SocketManager();
            const connected = await socketManager.connect('http://localhost:5000');
            
            if (connected) {
                this.socket = socketManager.socket;
                
                // Listen for order updates
                socketManager.on('order-updated', (data) => {
                    this.handleOrderUpdate(data);
                });
                
                socketManager.on('order-status-updated', (data) => {
                    this.handleOrderUpdate(data);
                });
            } else {
                // Fallback mode - continue without Socket.IO
                this.socket = null;
            }
        } else if (typeof io !== 'undefined') {
            // Fallback to direct Socket.IO if SocketManager not available
            try {
                this.socket = io('http://localhost:5000', {
                    reconnection: true,
                    reconnectionDelay: 1000,
                    reconnectionAttempts: 5,
                    timeout: 5000
                });
                
                this.socket.on('connect', () => {
                    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                        console.log('Connected to unified server for ordering');
                    }
                });

                this.socket.on('disconnect', () => {
                    // Silent disconnect - no error shown to user
                });

                this.socket.on('connect_error', (error) => {
                    // Silent connection error - continue in fallback mode
                    this.socket = null;
                });

                // Listen for order updates
                this.socket.on('order-updated', (data) => {
                    this.handleOrderUpdate(data);
                });
                
                this.socket.on('order-status-updated', (data) => {
                    this.handleOrderUpdate(data);
                });
            } catch (error) {
                // Silent error - continue without Socket.IO
                this.socket = null;
            }
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
    console.log('Initializing ordering system...');
    try {
        window.orderingSystem = new OrderingSystem();
        console.log('Ordering system initialized successfully:', !!window.orderingSystem);
    } catch (error) {
        console.error('Error initializing ordering system:', error);
    }
});
