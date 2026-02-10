// Dynamic Menu System for Grilli Restaurant

class DynamicMenu {
    constructor() {
        this.menuItems = [];
        this.apiBaseUrl = '/api';
        this.currentUser = null;
        this.authToken = null;
        this.socket = null;
        this.maxDisplayItems = 6; // Limit to 6 items on main page
    }

    async init() {
        await this.loadMenuItems();
        this.updateMainMenu();
        this.setupEventListeners();
        this.initializeSocket();
        
        // Listen for login/logout events
        window.addEventListener('userLoggedIn', (e) => this.handleUserLogin(e.detail));
        window.addEventListener('userLoggedOut', () => this.handleUserLogout());
    }

    handleUserLogin(userData) {
        this.currentUser = userData;
        this.authToken = userData.token;
    }

    handleUserLogout() {
        this.currentUser = null;
        this.authToken = null;
    }

    async loadMenuItems() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/menu-items`);
            if (response.ok) {
                const items = await response.json();
                // Use deduplication utility if available
                if (window.DeduplicationUtil) {
                    this.menuItems = window.DeduplicationUtil.dedupeMenuItems(items);
                } else {
                    // Fallback deduplication
                    const seen = new Map();
                    this.menuItems = items.filter(item => {
                        if (!item || !item._id) return false;
                        const id = item._id.toString();
                        if (seen.has(id)) return false;
                        seen.set(id, true);
                        return true;
                    });
                }
            } else {
                this.menuItems = [];
            }
        } catch (error) {
            const errorMessage = window.ErrorHandler ? 
                window.ErrorHandler.handleError(error, 'Menu Loading') :
                'Failed to load menu items';
            if (window.showNotification) {
                window.showNotification(errorMessage, 'error');
            }
            this.menuItems = [];
        }
    }

    async saveMenuItems() {
        // This method is no longer needed as we're using MongoDB API
        // But keeping it for backward compatibility
    }

    updateMainMenu() {
        // Find the menu grid in the main page (grid-list)
        const menuGrid = document.querySelector('.grid-list');
        if (!menuGrid) {
            console.log('DynamicMenu: Menu grid not found, skipping update');
            return;
        }

        console.log('DynamicMenu: Updating main menu with', this.menuItems.length, 'items');

        // Clear existing menu items (only the ones we added)
        const existingItems = menuGrid.querySelectorAll('.menu-card[data-dynamic="true"]');
        existingItems.forEach(item => item.remove());

        // Add new menu items (limited to maxDisplayItems)
        const itemsToDisplay = this.menuItems.slice(0, this.maxDisplayItems);
        itemsToDisplay.forEach(item => {
            const menuItemHTML = this.createMenuItemHTML(item);
            menuGrid.insertAdjacentHTML('beforeend', menuItemHTML);
        });

        // Setup event listeners for new items
        this.setupMenuItemEventListeners();
        
        // Dispatch custom event to notify other systems
        window.dispatchEvent(new CustomEvent('menuUpdated', {
            detail: { menuItems: this.menuItems }
        }));
        
        console.log('DynamicMenu: Main menu updated successfully');
    }

    createMenuItemHTML(item) {
        const badgeHTML = item.badge ? `<span class="badge label-1">${item.badge}</span>` : '';
        const typeIndicator = item.type === 'veg' ? '🌱' : '🍖';
        
        return `
            <li data-dynamic="true">
              <div class="menu-card hover:card" data-item-id="${item._id}" style="cursor: pointer;">

                <figure class="card-banner img-holder" style="--width: 100; --height: 100;">
                  <img src="${item.image}" width="100" height="100" loading="lazy" alt="${item.name}"
                    class="img-cover">
                </figure>

                <div>

                  <div class="title-wrapper">
                    <h3 class="title-3">
                      <span class="card-title">${item.name}</span>
                    </h3>

                    ${badgeHTML}

                    <span class="span title-2">₹${item.price.toFixed(2)}</span>
                  </div>

                  <p class="card-text label-1">
                    ${item.description}
                  </p>

                  <div class="card-type">
                    <span class="type-indicator">${typeIndicator}</span>
                    <span class="type-text">${item.type === 'veg' ? 'Vegetarian' : 'Non-Vegetarian'}</span>
                  </div>

                  <button class="btn btn-primary" style="margin-top: 15px; width: 100%;">
                    <span class="text text-1">Order Now</span>
                    <span class="text text-2" aria-hidden="true">Order Now</span>
                  </button>

                </div>

              </div>
            </li>
        `;
    }

    setupMenuItemEventListeners() {
        const menuCards = document.querySelectorAll('.menu-card[data-dynamic="true"]');
        menuCards.forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                const itemId = card.dataset.itemId;
                console.log('DynamicMenu: Menu item clicked:', itemId);
                
                // Trigger order modal if ordering system is available
                if (window.orderingSystem) {
                    window.orderingSystem.showOrderModal(itemId);
                }
            });
        });
    }

    setupEventListeners() {
        // Listen for storage changes (for cross-tab synchronization)
        window.addEventListener('storage', (e) => {
            if (e.key === 'grilliMenuItems') {
                this.refreshMenu();
            }
        });

        // Listen for custom menu update events
        window.addEventListener('menuUpdated', () => {
            this.refreshMenu();
        });

        // Listen for focus events to refresh menu when tab becomes active
        window.addEventListener('focus', () => {
            this.refreshMenu();
        });
    }

    async refreshMenu() {
        console.log('DynamicMenu: Refreshing menu...');
        await this.loadMenuItems();
        this.updateMainMenu();
    }

    // Note: Menu item management (add/edit/delete) has been moved to the admin panel
    // Users can only view menu items, not modify them
    
    initializeSocket() {
        console.log('DynamicMenu: Initializing socket connection...');
        
        // Connect to the user server for real-time menu updates
        this.socket = io();
        
        this.socket.on('connect', () => {
            console.log('DynamicMenu: Connected to user server for real-time menu updates');
        });

        this.socket.on('disconnect', () => {
            console.log('DynamicMenu: Disconnected from user server');
        });

        this.socket.on('connect_error', (error) => {
            console.error('DynamicMenu: Socket connection error:', error);
        });

        // Listen for menu updates from admin
        this.socket.on('menu-updated', (data) => {
            console.log('DynamicMenu: Received menu update:', data);
            this.handleMenuUpdate(data);
        });
    }

    handleMenuUpdate(data) {
        const { action, item, itemId } = data;
        console.log('DynamicMenu: Handling menu update:', action, item ? item.name : itemId);
        
        switch (action) {
            case 'item-added':
                console.log('DynamicMenu: Adding new item:', item.name);
                this.menuItems.unshift(item);
                this.updateMainMenu();
                this.showNotification('New menu item added!', 'success');
                break;
                
            case 'item-updated':
                console.log('DynamicMenu: Updating item:', item.name);
                const updateIndex = this.menuItems.findIndex(m => m._id === item._id);
                if (updateIndex !== -1) {
                    this.menuItems[updateIndex] = item;
                    this.updateMainMenu();
                    this.showNotification('Menu item updated!', 'success');
                } else {
                    console.log('DynamicMenu: Item not found for update, refreshing entire menu');
                    this.refreshMenu();
                }
                break;
                
            case 'item-deleted':
                console.log('DynamicMenu: Deleting item:', itemId);
                this.menuItems = this.menuItems.filter(m => m._id !== itemId);
                this.updateMainMenu();
                this.showNotification('Menu item removed!', 'info');
                break;
                
            default:
                console.log('DynamicMenu: Unknown menu update action:', action);
                // For any unknown action, refresh the entire menu
                this.refreshMenu();
                break;
        }
    }

    showNotification(message, type = 'info') {
        console.log('DynamicMenu: Showing notification:', message, type);
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `menu-notification menu-notification-${type}`;
        notification.textContent = message;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : type === 'warning' ? '#ff9800' : '#2196f3'};
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
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
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }

    getMenuItem(itemId) {
        return this.menuItems.find(item => item._id === itemId);
    }

    getAllMenuItems() {
        return [...this.menuItems];
    }

    generateItemId(name) {
        const baseId = name.toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
        
        let id = baseId;
        let counter = 1;
        
        while (this.menuItems.find(item => item._id === id)) {
            id = `${baseId}-${counter}`;
            counter++;
        }
        
        return id;
    }

    // Force refresh method for debugging
    forceRefresh() {
        console.log('DynamicMenu: Force refreshing menu...');
        this.refreshMenu();
    }
}

// Initialize the dynamic menu when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DynamicMenu: DOM loaded, initializing...');
    const dynamicMenu = new DynamicMenu();
    dynamicMenu.init();
    
    // Make it globally available
    window.dynamicMenu = dynamicMenu;
    
    // Also make a global function for manual refresh
    window.refreshMenu = () => {
        if (window.dynamicMenu) {
            window.dynamicMenu.forceRefresh();
        }
    };
});
