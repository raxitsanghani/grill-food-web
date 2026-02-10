// Utility functions for Grilli Restaurant App

/**
 * Unified Price Calculation System
 * Ensures consistent pricing across all pages
 */
class PriceCalculator {
    constructor() {
        this.GST_RATE = 0.18; // 18% GST
        this.DELIVERY_CHARGE = 40; // Fixed delivery charge ₹40
    }

    /**
     * Calculate order total with GST and delivery charge
     * @param {number} itemPrice - Price of single item
     * @param {number} quantity - Quantity of items
     * @returns {Object} - Price breakdown object
     */
    calculateOrderTotal(itemPrice, quantity = 1) {
        const subtotal = itemPrice * quantity;
        const gstAmount = subtotal * this.GST_RATE;
        const deliveryCharge = this.DELIVERY_CHARGE;
        const total = subtotal + gstAmount + deliveryCharge;

        return {
            subtotal: parseFloat(subtotal.toFixed(2)),
            gstAmount: parseFloat(gstAmount.toFixed(2)),
            deliveryCharge: deliveryCharge,
            total: parseFloat(total.toFixed(2)),
            quantity: quantity
        };
    }

    /**
     * Format price for display
     * @param {number} price - Price to format
     * @returns {string} - Formatted price string
     */
    formatPrice(price) {
        return `₹${price.toFixed(2)}`;
    }
}

// Export singleton instance
window.PriceCalculator = new PriceCalculator();

/**
 * Error Handler Utility
 * Provides consistent error handling across the app
 */
class ErrorHandler {
    /**
     * Handle API errors gracefully
     * @param {Error} error - Error object
     * @param {string} context - Context where error occurred
     * @returns {string} - User-friendly error message
     */
    static handleError(error, context = 'operation') {
        let message = 'An error occurred. Please try again.';
        
        if (error.message) {
            if (error.message.includes('network') || error.message.includes('fetch')) {
                message = 'Network error. Please check your connection.';
            } else if (error.message.includes('timeout')) {
                message = 'Request timed out. Please try again.';
            } else {
                message = error.message;
            }
        }

        // Log error for debugging (only in development)
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.error(`[${context}]`, error);
        }

        return message;
    }

    /**
     * Show error notification
     * @param {string} message - Error message
     * @param {string} type - Error type (error, warning, info)
     */
    static showError(message, type = 'error') {
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            alert(message);
        }
    }
}

window.ErrorHandler = ErrorHandler;

/**
 * Socket.IO Connection Manager
 * Handles Socket.IO connections with proper error handling and fallbacks
 */
class SocketManager {
    constructor() {
        this.socket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.isConnected = false;
    }

    /**
     * Initialize Socket.IO connection
     * @param {string} url - Socket.IO server URL
     * @returns {Promise<boolean>} - Connection success status
     */
    async connect(url = 'http://localhost:5000') {
        return new Promise((resolve) => {
            try {
                if (typeof io === 'undefined') {
                    console.warn('Socket.IO not loaded, using fallback mode');
                    resolve(false);
                    return;
                }

                this.socket = io(url, {
                    reconnection: true,
                    reconnectionDelay: this.reconnectDelay,
                    reconnectionAttempts: this.maxReconnectAttempts,
                    timeout: 5000,
                    transports: ['websocket', 'polling']
                });

                this.socket.on('connect', () => {
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    console.log('✅ Socket.IO connected');
                    resolve(true);
                });

                this.socket.on('disconnect', () => {
                    this.isConnected = false;
                    console.log('⚠️ Socket.IO disconnected');
                });

                this.socket.on('connect_error', (error) => {
                    this.isConnected = false;
                    this.reconnectAttempts++;
                    console.warn(`⚠️ Socket.IO connection error (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}):`, error.message);
                    
                    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                        console.warn('⚠️ Max reconnection attempts reached, continuing in fallback mode');
                        resolve(false);
                    }
                });

                this.socket.on('reconnect', (attemptNumber) => {
                    console.log(`✅ Socket.IO reconnected after ${attemptNumber} attempts`);
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                });

                // Set timeout for connection
                setTimeout(() => {
                    if (!this.isConnected) {
                        console.warn('⚠️ Socket.IO connection timeout, continuing in fallback mode');
                        resolve(false);
                    }
                }, 5000);

            } catch (error) {
                console.warn('⚠️ Socket.IO initialization failed:', error);
                resolve(false);
            }
        });
    }

    /**
     * Disconnect Socket.IO
     */
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
        }
    }

    /**
     * Emit event with error handling
     * @param {string} event - Event name
     * @param {any} data - Event data
     */
    emit(event, data) {
        if (this.isConnected && this.socket) {
            this.socket.emit(event, data);
        }
    }

    /**
     * Listen to event
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    on(event, callback) {
        if (this.socket) {
            this.socket.on(event, callback);
        }
    }

    /**
     * Remove event listener
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    off(event, callback) {
        if (this.socket) {
            this.socket.off(event, callback);
        }
    }
}

window.SocketManager = SocketManager;

/**
 * Deduplication Utility
 * Removes duplicate items from arrays
 */
class DeduplicationUtil {
    /**
     * Remove duplicate menu items by _id
     * @param {Array} items - Array of menu items
     * @returns {Array} - Deduplicated array
     */
    static dedupeMenuItems(items) {
        if (!Array.isArray(items)) return [];
        
        const seen = new Map();
        const result = [];

        for (const item of items) {
            if (!item || !item._id) continue;
            
            const id = item._id.toString();
            if (!seen.has(id)) {
                seen.set(id, true);
                result.push(item);
            }
        }

        return result;
    }

    /**
     * Remove duplicate orders by _id
     * @param {Array} orders - Array of orders
     * @returns {Array} - Deduplicated array
     */
    static dedupeOrders(orders) {
        if (!Array.isArray(orders)) return [];
        
        const seen = new Map();
        const result = [];

        for (const order of orders) {
            if (!order || !order._id) continue;
            
            const id = order._id.toString();
            if (!seen.has(id)) {
                seen.set(id, true);
                result.push(order);
            }
        }

        return result;
    }
}

window.DeduplicationUtil = DeduplicationUtil;

/**
 * Notification System
 * Provides consistent toast notifications across the app
 */
class NotificationSystem {
    constructor() {
        this.notifications = [];
        this.container = null;
        this.init();
    }

    init() {
        // Create notification container if it doesn't exist
        if (!document.getElementById('notification-container')) {
            this.container = document.createElement('div');
            this.container.id = 'notification-container';
            this.container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 10px;
                pointer-events: none;
            `;
            document.body.appendChild(this.container);
        } else {
            this.container = document.getElementById('notification-container');
        }
    }

    /**
     * Show notification
     * @param {string} message - Notification message
     * @param {string} type - Notification type (success, error, warning, info)
     * @param {number} duration - Duration in milliseconds
     */
    show(message, type = 'info', duration = 4000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const colors = {
            success: '#4CAF50',
            error: '#F44336',
            warning: '#FF9800',
            info: '#2196F3'
        };

        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        notification.style.cssText = `
            background: ${colors[type] || colors.info};
            color: white;
            padding: 16px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            max-width: 350px;
            font-size: 14px;
            font-family: var(--fontFamily-dm_sans, sans-serif);
            transform: translateX(400px);
            transition: transform 0.3s ease, opacity 0.3s ease;
            opacity: 0;
            pointer-events: auto;
            display: flex;
            align-items: center;
            gap: 10px;
        `;

        notification.innerHTML = `
            <span style="font-size: 18px; font-weight: bold;">${icons[type] || icons.info}</span>
            <span>${message}</span>
        `;

        this.container.appendChild(notification);
        this.notifications.push(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
            notification.style.opacity = '1';
        }, 100);

        // Auto remove
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
                const index = this.notifications.indexOf(notification);
                if (index > -1) {
                    this.notifications.splice(index, 1);
                }
            }, 300);
        }, duration);
    }
}

// Initialize notification system
window.notificationSystem = new NotificationSystem();

// Global function for backward compatibility
window.showNotification = function(message, type = 'info') {
    if (window.notificationSystem) {
        window.notificationSystem.show(message, type);
    }
};

