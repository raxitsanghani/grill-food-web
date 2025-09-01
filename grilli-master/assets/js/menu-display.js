// Simple Menu Display System
class MenuDisplay {
    constructor() {
        this.apiBaseUrl = 'http://localhost:4000/api';
        this.socket = null;
        this.init();
    }

    init() {
        this.loadMenuItems();
        this.initializeSocket();
    }

    initializeSocket() {
        // Initialize Socket.IO connection for real-time updates
        if (typeof io !== 'undefined') {
            this.socket = io('http://localhost:4000');
            
            this.socket.on('connect', () => {
                console.log('Connected to main server for menu updates');
            });

            this.socket.on('disconnect', () => {
                console.log('Disconnected from main server');
            });

            // Listen for menu updates from admin panel
            this.socket.on('menu-updated', (data) => {
                this.handleMenuUpdate(data);
            });
        }
    }

    handleMenuUpdate(data) {
        console.log('Menu update received:', data);
        
        if (data.action === 'item-added' || data.action === 'item-updated' || data.action === 'item-deleted') {
            // Refresh the menu items from server
            this.loadMenuItems();
        }
    }

    async loadMenuItems() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/menu-items`);
            if (response.ok) {
                const items = await response.json();
                this.renderMenuItems(items);
            }
        } catch (error) {
            console.error('Error loading menu items:', error);
        }
    }

    renderMenuItems(items) {
        // Find menu containers
        const menuContainers = document.querySelectorAll('.menu-list, .menu-grid, [data-menu-container]');
        
        menuContainers.forEach(container => {
            if (container) {
                container.innerHTML = '';
                items.forEach(item => {
                    const menuCard = this.createMenuCard(item);
                    container.appendChild(menuCard);
                });
            }
        });
    } 

    createMenuCard(item) {
        const menuCard = document.createElement('div');
        menuCard.className = 'menu-card';
        menuCard.dataset.itemId = item._id;
        
        // Handle image path - could be base64, URL, or relative path
        let imagePath = item.image;
        if (imagePath) {
            if (imagePath.startsWith('data:image/')) {
                // Base64 image - use as is
                imagePath = imagePath;
            } else if (imagePath.startsWith('http')) {
                // Full URL - use as is
                imagePath = imagePath;
            } else if (!imagePath.startsWith('./assets/images/')) {
                // Relative path - add proper prefix
                if (imagePath.includes('assets/images/')) {
                    const filename = imagePath.split('assets/images/').pop();
                    imagePath = `./assets/images/${filename}`;
                } else {
                    imagePath = `./assets/images/${imagePath}`;
                }
            }
        }
        
        menuCard.innerHTML = `
            <div class="card-banner">
                <img src="${imagePath}" alt="${item.name}" onerror="this.src='./assets/images/menu-1.png'">
                ${item.badge ? `<div class="badge">${item.badge}</div>` : ''}
            </div>
            <div class="card-content">
                <h3 class="h3 card-title">${item.name}</h3>
                <p class="card-text">${item.description}</p>
                <div class="card-meta">
                    <span class="meta-item">
                        <ion-icon name="time-outline"></ion-icon>
                        <span>${item.deliveryTime || '25-35 minutes'}</span>
                    </span>
                    <span class="meta-item">
                        <ion-icon name="restaurant-outline"></ion-icon>
                        <span>${item.type === 'veg' ? 'Vegetarian' : 'Non-Vegetarian'}</span>
                    </span>
                </div>
                <div class="card-price">₹${item.price.toFixed(2)}</div>
            </div>
        `;
        
        return menuCard;
    }
}

// Initialize menu display when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.menuDisplay = new MenuDisplay();
});
