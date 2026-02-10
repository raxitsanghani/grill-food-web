// Shopping Cart System for Grilli Restaurant

class ShoppingCart {
    constructor() {
        this.items = [];
        this.storageKey = 'grilliShoppingCart';
        this.init();
    }

    init() {
        this.loadFromStorage();
        this.updateCartDisplay();
        this.setupEventListeners();
    }

    /**
     * Add item to cart
     * @param {Object} item - Menu item object
     * @param {number} quantity - Quantity to add
     */
    addItem(item, quantity = 1) {
        if (!item || !item._id) {
            if (window.showNotification) {
                window.showNotification('Invalid item', 'error');
            }
            return;
        }

        const existingItemIndex = this.items.findIndex(cartItem => cartItem.item._id === item._id);

        if (existingItemIndex > -1) {
            // Update quantity if item already exists
            this.items[existingItemIndex].quantity += quantity;
        } else {
            // Add new item
            this.items.push({
                item: item,
                quantity: quantity,
                addedAt: new Date().toISOString()
            });
        }

        this.saveToStorage();
        this.updateCartDisplay();
        
        if (window.showNotification) {
            window.showNotification(`${item.name} added to cart`, 'success');
        }
    }

    /**
     * Remove item from cart
     * @param {string} itemId - Item ID to remove
     */
    removeItem(itemId) {
        this.items = this.items.filter(cartItem => cartItem.item._id !== itemId);
        this.saveToStorage();
        this.updateCartDisplay();
        
        if (window.showNotification) {
            window.showNotification('Item removed from cart', 'info');
        }
    }

    /**
     * Update item quantity
     * @param {string} itemId - Item ID
     * @param {number} quantity - New quantity
     */
    updateQuantity(itemId, quantity) {
        if (quantity <= 0) {
            this.removeItem(itemId);
            return;
        }

        const item = this.items.find(cartItem => cartItem.item._id === itemId);
        if (item) {
            item.quantity = quantity;
            this.saveToStorage();
            this.updateCartDisplay();
        }
    }

    /**
     * Get cart total
     * @returns {Object} - Total breakdown
     */
    getTotal() {
        let subtotal = 0;
        
        this.items.forEach(cartItem => {
            subtotal += cartItem.item.price * cartItem.quantity;
        });

        // Use unified price calculator if available
        if (window.PriceCalculator && this.items.length > 0) {
            // Calculate for first item (delivery charge applies once per order)
            const sampleItem = this.items[0];
            const priceBreakdown = window.PriceCalculator.calculateOrderTotal(subtotal, 1);
            return {
                subtotal: subtotal,
                gstAmount: priceBreakdown.gstAmount,
                deliveryCharge: priceBreakdown.deliveryCharge,
                total: subtotal + priceBreakdown.gstAmount + priceBreakdown.deliveryCharge,
                itemCount: this.items.length,
                totalQuantity: this.items.reduce((sum, item) => sum + item.quantity, 0)
            };
        } else {
            // Fallback calculation
            const gstRate = 0.18;
            const deliveryCharge = 40;
            const gstAmount = subtotal * gstRate;
            return {
                subtotal: subtotal,
                gstAmount: gstAmount,
                deliveryCharge: deliveryCharge,
                total: subtotal + gstAmount + deliveryCharge,
                itemCount: this.items.length,
                totalQuantity: this.items.reduce((sum, item) => sum + item.quantity, 0)
            };
        }
    }

    /**
     * Clear cart
     */
    clear() {
        this.items = [];
        this.saveToStorage();
        this.updateCartDisplay();
    }

    /**
     * Get cart items
     * @returns {Array} - Cart items
     */
    getItems() {
        return this.items;
    }

    /**
     * Get cart count
     * @returns {number} - Total number of items
     */
    getCount() {
        return this.items.reduce((sum, item) => sum + item.quantity, 0);
    }

    /**
     * Check if cart is empty
     * @returns {boolean}
     */
    isEmpty() {
        return this.items.length === 0;
    }

    /**
     * Save cart to localStorage
     */
    saveToStorage() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.items));
        } catch (error) {
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                console.error('Error saving cart to storage:', error);
            }
        }
    }

    /**
     * Load cart from localStorage
     */
    loadFromStorage() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                this.items = JSON.parse(saved);
            }
        } catch (error) {
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                console.error('Error loading cart from storage:', error);
            }
            this.items = [];
        }
    }

    /**
     * Update cart display (badge, count, etc.)
     */
    updateCartDisplay() {
        const count = this.getCount();
        
        // Update cart badge
        const cartBadges = document.querySelectorAll('.cart-count, .cart-badge, [data-cart-count]');
        cartBadges.forEach(badge => {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'block' : 'none';
        });

        // Dispatch cart updated event
        window.dispatchEvent(new CustomEvent('cartUpdated', {
            detail: { count: count, items: this.items }
        }));
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for add to cart events
        document.addEventListener('click', (e) => {
            if (e.target.closest('[data-add-to-cart]')) {
                const button = e.target.closest('[data-add-to-cart]');
                const itemId = button.getAttribute('data-item-id');
                const quantity = parseInt(button.getAttribute('data-quantity') || '1');
                
                // Find item details (you may need to fetch from API)
                this.addItemById(itemId, quantity);
            }
        });

        // Listen for cart updates
        window.addEventListener('cartUpdated', () => {
            this.updateCartDisplay();
        });
    }

    /**
     * Add item to cart by ID
     * @param {string} itemId - Item ID
     * @param {number} quantity - Quantity
     */
    async addItemById(itemId, quantity = 1) {
        try {
            const response = await fetch(`/api/menu-items/${itemId}`);
            if (response.ok) {
                const item = await response.json();
                this.addItem(item, quantity);
            } else {
                if (window.showNotification) {
                    window.showNotification('Failed to add item to cart', 'error');
                }
            }
        } catch (error) {
            const errorMessage = window.ErrorHandler ? 
                window.ErrorHandler.handleError(error, 'Add to Cart') :
                'Failed to add item to cart';
            if (window.showNotification) {
                window.showNotification(errorMessage, 'error');
            }
        }
    }
}

// Initialize shopping cart
window.shoppingCart = new ShoppingCart();

