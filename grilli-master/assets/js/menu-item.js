// Menu Item Page JavaScript

class MenuItemManager {
    constructor() {
        this.apiBaseUrl = '/api';
        this.menuItems = [];
        this.currentItem = null;
        this.currentUser = null;
    }

    async init() {
        await this.loadMenuItems();
        this.setupEventListeners();
        this.handlePageLoad();
    }

    async loadMenuItems() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/menu-items`);
            if (response.ok) {
                this.menuItems = await response.json();
            } else {
                console.error('Failed to load menu items from API');
                this.menuItems = [];
            }
        } catch (error) {
            console.error('Error loading menu items:', error);
            this.menuItems = [];
        }
    }

    getMenuItems() {
        return this.menuItems;
    }

    getMenuItemById(id) {
        return this.menuItems.find(item => item._id === id);
    }

    setupEventListeners() {
        // Quantity buttons
        const quantityBtns = document.querySelectorAll('.quantity-btn');
        quantityBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleQuantityChange(e));
        });

        // Add to cart button
        const addToCartBtn = document.querySelector('.add-to-cart-btn');
        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', (e) => this.handleAddToCart(e));
        }

        // Payment method selection
        const paymentMethods = document.querySelectorAll('input[name="paymentMethod"]');
        paymentMethods.forEach(method => {
            method.addEventListener('click', (e) => this.handlePaymentMethodChange(e));
        });

        // Credit card input formatting
        const cardNumberInput = document.getElementById('cardNumber');
        if (cardNumberInput) {
            cardNumberInput.addEventListener('input', (e) => this.formatCardNumber(e));
        }

        const expiryInput = document.getElementById('expiryDate');
        if (expiryInput) {
            expiryInput.addEventListener('input', (e) => this.formatExpiryDate(e));
        }

        const cvvInput = document.getElementById('cvv');
        if (cvvInput) {
            cvvInput.addEventListener('input', (e) => this.formatCVV(e));
        }

        // Form submission
        const orderForm = document.getElementById('orderForm');
        if (orderForm) {
            orderForm.addEventListener('submit', (e) => this.handleOrderSubmission(e));
        }
    }

    handlePageLoad() {
        // Handle preloader
        const preloader = document.querySelector('.preload');
        if (preloader) {
            window.addEventListener('load', () => {
                preloader.style.display = 'none';
            });
        }

        // Get item ID from URL and load item details
        const urlParams = new URLSearchParams(window.location.search);
        const itemId = urlParams.get('id');
        
        if (itemId) {
            this.loadItemDetails(itemId);
        } else {
            console.error('No item ID provided in URL');
            // Show error message or redirect to menu
            this.showMessage('No menu item selected. Please go back to the menu.', 'error');
        }
    }

    async loadItemDetails(itemId) {
        try {
            // First try to find in loaded menu items
            let item = this.getMenuItemById(itemId);
            
            if (!item) {
                // If not found in loaded items, try to fetch from API
                const response = await fetch(`${this.apiBaseUrl}/menu-items/${itemId}`);
                if (response.ok) {
                    item = await response.json();
                }
            }
            
            if (item) {
                this.currentItem = item;
                this.updateItemDisplay(item);
            } else {
                console.error('Item not found:', itemId);
                this.showMessage('Menu item not found. Please go back to the menu.', 'error');
            }
        } catch (error) {
            console.error('Error loading item details:', error);
            this.showMessage('Error loading menu item. Please try again.', 'error');
        }
    }

    updateItemDisplay(item) {
        // Set current item first
        this.currentItem = item;
        
        // Update item image
        const itemImage = document.getElementById('itemImage');
        if (itemImage) {
            itemImage.src = item.image;
            itemImage.alt = item.name;
        }

        // Update item name
        const itemName = document.getElementById('itemName');
        if (itemName) {
            itemName.textContent = item.name;
        }

        // Update item description
        const itemDescription = document.getElementById('itemDescription');
        if (itemDescription) {
            itemDescription.textContent = item.description;
        }

        // Update item price
        const itemPrice = document.getElementById('itemPrice');
        if (itemPrice) {
            itemPrice.textContent = `₹${item.price.toFixed(2)}`;
        }

        // Update badge if exists
        const badgeElement = document.getElementById('itemBadge');
        if (badgeElement && item.badge) {
            badgeElement.textContent = item.badge;
            badgeElement.style.display = 'block';
        } else if (badgeElement) {
            badgeElement.style.display = 'none';
        }

        // Update delivery time
        const deliveryTime = document.getElementById('deliveryTime');
        if (deliveryTime) {
            deliveryTime.textContent = item.deliveryTime || '25-35 minutes';
        }

        // Update total price - now currentItem is set
        this.updateTotalPrice(1);
    }



    autoFillCustomerDetails(user) {
        const customerName = document.getElementById('customerName');
        const customerPhone = document.getElementById('customerPhone');
        const customerEmail = document.getElementById('customerEmail');

        if (customerName) customerName.value = user.name || '';
        if (customerPhone) customerPhone.value = user.phone || '';
        if (customerEmail) customerEmail.value = user.email || '';
    }

    handleQuantityChange(event) {
        const btn = event.currentTarget;
        const quantityDisplay = document.querySelector('.quantity-display');
        let currentQuantity = parseInt(quantityDisplay.textContent);

        if (btn.classList.contains('decrease') && currentQuantity > 1) {
            currentQuantity--;
        } else if (btn.classList.contains('increase')) {
            currentQuantity++;
        }

        quantityDisplay.textContent = currentQuantity;
        this.updateTotalPrice(currentQuantity);
    }

    updateTotalPrice(quantity) {
        if (!this.currentItem) return;

        const basePrice = this.currentItem.price * quantity;
        const deliveryFee = 40; // ₹40 delivery fee
        const gst = basePrice * 0.18; // 18% GST
        const totalPrice = basePrice + deliveryFee + gst;
        
        // Update base price display
        const basePriceElement = document.querySelector('.base-price');
        if (basePriceElement) {
            basePriceElement.textContent = `₹${basePrice.toFixed(2)}`;
        }
        
        // Update delivery fee display
        const deliveryFeeElement = document.querySelector('.delivery-fee');
        if (deliveryFeeElement) {
            deliveryFeeElement.textContent = `₹${deliveryFee.toFixed(2)}`;
        }
        
        // Update GST display
        const gstElement = document.querySelector('.gst-amount');
        if (gstElement) {
            gstElement.textContent = `₹${gst.toFixed(2)}`;
        }
        
        // Update total price display
        const totalPriceElement = document.querySelector('.total-price');
        if (totalPriceElement) {
            totalPriceElement.textContent = `₹${totalPrice.toFixed(2)}`;
        }
        
        // Store total price for order submission
        this.currentTotalPrice = totalPrice;
    }

    handleAddToCart(event) {
        event.preventDefault();
        
        const quantity = parseInt(document.querySelector('.quantity-display').textContent);
        const totalPrice = this.currentItem.price * quantity;

        // Add to cart logic here

        // Show success message
        this.showMessage('Item added to cart successfully!', 'success');
    }

    handlePaymentMethodChange(event) {
        const paymentMethod = event.target.value;
        const creditCardFields = document.querySelector('.credit-card-fields');
        const upiFields = document.querySelector('.upi-fields');

        if (paymentMethod === 'credit-card') {
            if (creditCardFields) creditCardFields.style.display = 'block';
            if (upiFields) upiFields.style.display = 'none';
        } else if (paymentMethod === 'upi') {
            if (creditCardFields) creditCardFields.style.display = 'none';
            if (upiFields) upiFields.style.display = 'block';
        } else {
            if (creditCardFields) creditCardFields.style.display = 'none';
            if (upiFields) upiFields.style.display = 'none';
        }
    }

    formatCardNumber(event) {
        let value = event.target.value.replace(/\D/g, '');
        value = value.replace(/(\d{4})/g, '$1 ').trim();
        event.target.value = value.substring(0, 19);
    }

    formatExpiryDate(event) {
        let value = event.target.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        event.target.value = value.substring(0, 5);
    }

    formatCVV(event) {
        let value = event.target.value.replace(/\D/g, '');
        event.target.value = value.substring(0, 3);
    }

    async handleOrderSubmission(event) {
        event.preventDefault();

        // Check if user is logged in
        if (!window.loginSystem || !window.loginSystem.isLoggedIn()) {
            this.showLoginRequiredMessage();
            return;
        }

        if (!this.validateOrderForm()) {
            return;
        }

        try {
            const orderData = this.collectOrderData();
            await this.submitOrder(orderData);
            this.showMessage('Order placed successfully!', 'success');
            this.resetForm();
        } catch (error) {
            console.error('Error submitting order:', error);
            this.showMessage('Error placing order. Please try again.', 'error');
        }
    }

    showLoginRequiredMessage() {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'login-required-message';
        messageDiv.innerHTML = `
            <div class="login-required-content">
                <div class="login-required-icon">
                    <ion-icon name="person-circle-outline" aria-hidden="true"></ion-icon>
                </div>
                <h3>Login Required</h3>
                <p>You need to be logged in to place orders. Please login first.</p>
                <div class="login-required-actions">
                    <button type="button" class="btn-secondary" onclick="this.parentElement.parentElement.parentElement.remove()">Cancel</button>
                    <button type="button" class="btn-primary" onclick="this.parentElement.parentElement.parentElement.remove(); window.loginSystem.showLogin();">Login Now</button>
                </div>
            </div>
        `;

        // Style the message
        messageDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--white);
            border: 2px solid var(--gold-crayola);
            border-radius: 20px;
            padding: 2rem;
            z-index: 10000;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            max-width: 400px;
            width: 90%;
        `;

        // Add dark theme support
        if (document.body.classList.contains('dark-theme') || document.documentElement.classList.contains('dark-theme')) {
            messageDiv.style.background = 'var(--eerie-black-1)';
            messageDiv.style.color = 'var(--white)';
            messageDiv.style.borderColor = 'var(--gold-crayola)';
        }

        document.body.appendChild(messageDiv);

        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 10000);
    }

    validateOrderForm() {
        const requiredFields = [
            'customerName', 'customerPhone', 'deliveryDate', 
            'deliveryTime', 'paymentMethod'
        ];

        for (const fieldId of requiredFields) {
            const field = document.getElementById(fieldId);
            if (!field || !field.value.trim()) {
                this.showMessage(`Please fill in ${fieldId.replace(/([A-Z])/g, ' $1').toLowerCase()}`, 'error');
                return false;
            }
        }

        // Validate phone number
        const phone = document.getElementById('customerPhone').value;
        if (phone.length < 10) {
            this.showMessage('Please enter a valid phone number', 'error');
            return false;
        }

        // Validate delivery date (must be future)
        const deliveryDate = new Date(document.getElementById('deliveryDate').value);
        const today = new Date();
        if (deliveryDate <= today) {
            this.showMessage('Delivery date must be in the future', 'error');
            return false;
        }

        // Validate payment method specific fields
        const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked');
        if (!paymentMethod) {
            this.showMessage('Please select a payment method', 'error');
            return false;
        }

        const paymentMethodValue = paymentMethod.value;
        
        if (paymentMethodValue === 'credit-card') {
            const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
            const expiryDate = document.getElementById('expiryDate').value;
            const cvv = document.getElementById('cvv').value;

            if (cardNumber.length !== 16) {
                this.showMessage('Please enter a valid 16-digit card number', 'error');
                return false;
            }

            if (!expiryDate || expiryDate.length !== 5) {
                this.showMessage('Please enter a valid expiry date (MM/YY)', 'error');
                return false;
            }

            if (cvv.length !== 3) {
                this.showMessage('Please enter a valid 3-digit CVV', 'error');
                return false;
            }
        } else if (paymentMethodValue === 'upi') {
            const upiId = document.getElementById('upiId').value;
            if (!upiId || !upiId.includes('@')) {
                this.showMessage('Please enter a valid UPI ID', 'error');
                return false;
            }
        }

        return true;
    }

    collectOrderData() {
        const quantity = parseInt(document.querySelector('.quantity-display').textContent);
        const totalPrice = this.currentTotalPrice || (this.currentItem.price * quantity);

        return {
            itemId: this.currentItem._id,
            itemName: this.currentItem.name,
            quantity: quantity,
            unitPrice: this.currentItem.price,
            totalPrice: totalPrice,
            customerName: document.getElementById('customerName').value,
            customerPhone: document.getElementById('customerPhone').value,
            customerEmail: document.getElementById('customerEmail').value,
            deliveryDate: document.getElementById('deliveryDate').value,
            deliveryTime: document.getElementById('deliveryTime').value,
            paymentMethod: document.querySelector('input[name="paymentMethod"]:checked').value,
            specialInstructions: document.getElementById('specialInstructions').value,
            orderDate: new Date().toISOString()
        };
    }

    async submitOrder(orderData) {
        try {
            // Always send to MongoDB API (no authentication required)
            const response = await fetch(`${this.apiBaseUrl}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            });

            if (!response.ok) {
                throw new Error('Failed to place order');
            }

            const savedOrder = await response.json();
            
            // Also save to localStorage for local reference
            const orders = JSON.parse(localStorage.getItem('grilliOrders') || '[]');
            orders.push(orderData);
            localStorage.setItem('grilliOrders', JSON.stringify(orders));
            
            return savedOrder;
        } catch (error) {
            console.error('Error saving order to MongoDB:', error);
            // Fallback to localStorage
            const orders = JSON.parse(localStorage.getItem('grilliOrders') || '[]');
            orders.push(orderData);
            localStorage.setItem('grilliOrders', JSON.stringify(orders));
            
            // Re-throw error to show user
            throw error;
        }
    }

    resetForm() {
        const form = document.getElementById('orderForm');
        if (form) {
            form.reset();
        }

        // Reset quantity
        const quantityDisplay = document.querySelector('.quantity-display');
        if (quantityDisplay) {
            quantityDisplay.textContent = '1';
        }

        // Reset total price
        this.updateTotalPrice(1);

        // Hide payment method specific fields
        const creditCardFields = document.querySelector('.credit-card-fields');
        const upiFields = document.querySelector('.upi-fields');
        if (creditCardFields) creditCardFields.style.display = 'none';
        if (upiFields) upiFields.style.display = 'none';
    }

    showMessage(message, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;

        const container = document.querySelector('.menu-item-container');
        if (container) {
            container.insertBefore(messageDiv, container.firstChild);

            setTimeout(() => {
                messageDiv.remove();
            }, 5000);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const menuItemManager = new MenuItemManager();
    menuItemManager.init();
});
