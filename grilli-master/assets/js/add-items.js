// Add Items Page JavaScript

class AddItemsPage {
    constructor() {
        this.menuItems = [];
        this.apiBaseUrl = '/api';
        this.currentUser = null;
        this.authToken = null;
    }

    async init() {
        await this.checkLoginStatus();
        await this.loadMenuItems();
        this.setupEventListeners();
        this.setupImagePreview();
        
        // Listen for login/logout events
        window.addEventListener('userLoggedIn', (e) => this.handleUserLogin(e.detail));
        window.addEventListener('userLoggedOut', () => this.handleUserLogout());
    }

    async checkLoginStatus() {
        // Wait for login system to be available
        if (window.loginSystem) {
            this.currentUser = window.loginSystem.getCurrentUser();
            this.authToken = window.loginSystem.getAuthToken();
        } else {
            // Fallback to localStorage
            this.currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
            this.authToken = localStorage.getItem('authToken');
        }

        const isLoggedIn = !!this.currentUser && !!this.authToken;
        const loginBtn = document.getElementById('loginBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const addItemForm = document.getElementById('addItemForm');

        if (isLoggedIn) {
            if (loginBtn) loginBtn.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'block';
            if (addItemForm) addItemForm.style.display = 'block';
        } else {
            if (loginBtn) loginBtn.style.display = 'block';
            if (logoutBtn) logoutBtn.style.display = 'none';
            if (addItemForm) addItemForm.style.display = 'none';
        }
    }

    handleUserLogin(userData) {
        this.currentUser = userData;
        this.authToken = userData.token;
        this.checkLoginStatus();
    }

    handleUserLogout() {
        this.currentUser = null;
        this.authToken = null;
        this.checkLoginStatus();
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
        this.displayMenuItems();
    }

    setupEventListeners() {
        const form = document.getElementById('addItemForm');
        const resetBtn = document.getElementById('resetBtn');
        const loginBtn = document.getElementById('loginBtn');
        const logoutBtn = document.getElementById('logoutBtn');

        if (form) {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetForm());
        }

        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.showLoginModal());
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
    }

    setupImagePreview() {
        const imageInput = document.getElementById('itemImage');
        const previewContainer = document.querySelector('.image-preview');

        if (imageInput && previewContainer) {
            imageInput.addEventListener('change', (e) => {
                this.handleImageChange(e, previewContainer);
            });
        }
    }

    handleImageChange(event, previewElement) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                previewElement.innerHTML = `
                    <img src="${e.target.result}" alt="Preview" style="max-width: 100%; max-height: 200px; border-radius: 8px;">
                `;
            };
            reader.readAsDataURL(file);
        }
    }

    async handleFormSubmit(event) {
        event.preventDefault();
        
        if (!this.authToken) {
            this.showMessage('Please log in to add menu items', 'error');
            return;
        }
        
        try {
            const formData = await this.extractFormData(new FormData(event.target));
            
            if (this.validateItemData(formData)) {
                await this.addMenuItem(formData);
                this.resetForm();
                this.showMessage('Menu item added successfully!', 'success');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            this.showMessage('Error adding menu item. Please try again.', 'error');
        }
    }

    async extractFormData(formData) {
        const itemData = {};
        
        // Extract text fields
        itemData.name = formData.get('itemName').trim();
        itemData.type = formData.get('itemType');
        itemData.price = parseFloat(formData.get('itemPrice'));
        itemData.badge = formData.get('itemBadge').trim();
        itemData.description = formData.get('itemDescription').trim();
        itemData.deliveryTime = formData.get('itemDeliveryTime').trim();
        itemData.prepTime = parseInt(formData.get('itemPrepTime'));

        // Get image data
        itemData.image = await this.getImageData();
        
        return itemData;
    }

    async getImageData() {
        const imageInput = document.getElementById('itemImage');
        const file = imageInput.files[0];
        
        if (!file) {
            throw new Error('Please select an image');
        }

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const resizedImage = await this.resizeImage(e.target.result, 100, 100);
                    resolve(resizedImage);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('Failed to read image'));
            reader.readAsDataURL(file);
        });
    }

    resizeImage(dataUrl, maxWidth, maxHeight, callback) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                canvas.width = maxWidth;
                canvas.height = maxHeight;
                
                ctx.drawImage(img, 0, 0, maxWidth, maxHeight);
                
                const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
                resolve(resizedDataUrl);
            };
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = dataUrl;
        });
    }

    validateItemData(itemData) {
        if (!itemData.name || itemData.name.length < 2) {
            this.showMessage('Product name must be at least 2 characters long', 'error');
            return false;
        }

        if (!itemData.type || !['veg', 'non-veg'].includes(itemData.type)) {
            this.showMessage('Please select a valid type (Veg or Non-Veg)', 'error');
            return false;
        }

        if (!itemData.price || itemData.price <= 0) {
            this.showMessage('Please enter a valid price', 'error');
            return false;
        }

        if (!itemData.description || itemData.description.length < 10) {
            this.showMessage('Description must be at least 10 characters long', 'error');
            return false;
        }

        if (!itemData.image) {
            this.showMessage('Please select an image', 'error');
            return false;
        }

        return true;
    }

    async addMenuItem(itemData) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/menu-items`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify(itemData)
            });

            if (response.ok) {
                const newItem = await response.json();
                this.menuItems.unshift(newItem);
                this.displayMenuItems();
                this.updateMainMenu();
                return newItem;
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to add menu item');
            }
        } catch (error) {
            console.error('Error adding menu item:', error);
            throw error;
        }
    }

    async removeMenuItem(itemId) {
        if (!this.authToken) {
            this.showMessage('Please log in to remove menu items', 'error');
            return;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/menu-items/${itemId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            if (response.ok) {
                this.menuItems = this.menuItems.filter(item => item._id !== itemId);
                this.displayMenuItems();
                this.updateMainMenu();
                this.showMessage('Menu item removed successfully!', 'success');
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to remove menu item');
            }
        } catch (error) {
            console.error('Error removing menu item:', error);
            this.showMessage('Error removing menu item. Please try again.', 'error');
        }
    }

    displayMenuItems() {
        const menuItemsList = document.getElementById('menuItemsList');
        if (!menuItemsList) return;

        if (this.menuItems.length === 0) {
            menuItemsList.innerHTML = this.getEmptyMenuHTML();
            return;
        }

        const menuItemsHTML = this.menuItems.map(item => this.createMenuItemHTML(item)).join('');
        menuItemsList.innerHTML = menuItemsHTML;

        // Add event listeners to remove buttons
        this.menuItems.forEach(item => {
            const removeBtn = document.getElementById(`remove-${item._id}`);
            if (removeBtn) {
                removeBtn.addEventListener('click', () => this.removeMenuItem(item._id));
            }
        });
    }

    createMenuItemHTML(item) {
        const typeClass = item.type === 'veg' ? 'veg' : 'non-veg';
        const typeText = item.type === 'veg' ? '🌱 Veg' : '🍖 Non-Veg';
        
        return `
            <div class="menu-item-card">
                <div class="menu-item-image">
                    <img src="${item.image}" alt="${item.name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;">
                </div>
                <div class="menu-item-details">
                    <h3>${item.name}</h3>
                    <div class="menu-item-meta">
                        <span class="menu-item-type ${typeClass}">${typeText}</span>
                        <span class="menu-item-price">₹${item.price.toFixed(2)}</span>
                        ${item.badge ? `<span class="menu-item-badge">${item.badge}</span>` : ''}
                    </div>
                    <p>${item.description}</p>
                    <div class="menu-item-times">
                        <span>🕒 Prep: ${item.prepTime} min</span>
                        <span>🚚 Delivery: ${item.deliveryTime}</span>
                    </div>
                </div>
                <button id="remove-${item._id}" class="remove-btn">Remove</button>
            </div>
        `;
    }

    getEmptyMenuHTML() {
        return `
            <div class="empty-menu">
                <p>No menu items yet. Add your first item using the form above!</p>
            </div>
        `;
    }

    updateMainMenu() {
        // Dispatch event to notify main menu to refresh
        window.dispatchEvent(new CustomEvent('menuUpdated'));
    }

    resetForm() {
        const form = document.getElementById('addItemForm');
        const imagePreview = document.querySelector('.image-preview');
        
        if (form) form.reset();
        if (imagePreview) imagePreview.innerHTML = '';
    }

    showMessage(message, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        
        const container = document.querySelector('.add-items-container');
        if (container) {
            container.insertBefore(messageDiv, container.firstChild);
            
            setTimeout(() => {
                messageDiv.remove();
            }, 5000);
        }
    }

    showLoginModal() {
        // Redirect to main page for login
        window.location.href = './index.html';
    }

    logout() {
        if (window.loginSystem) {
            window.loginSystem.logout();
        } else {
            // Fallback logout
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('currentUser');
            localStorage.removeItem('authToken');
            this.checkLoginStatus();
            this.showMessage('Logged out successfully!', 'success');
        }
    }
}

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const addItemsPage = new AddItemsPage();
    addItemsPage.init();
});
