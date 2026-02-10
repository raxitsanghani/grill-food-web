// Search Functionality for Grilli Restaurant

class MenuSearch {
    constructor() {
        this.searchTerm = '';
        this.menuItems = [];
        this.filteredItems = [];
        this.init();
    }

    async init() {
        await this.loadMenuItems();
        this.setupSearchInput();
    }

    /**
     * Load menu items from API
     */
    async loadMenuItems() {
        try {
            const response = await fetch('/api/menu-items');
            if (response.ok) {
                const items = await response.json();
                // Use deduplication if available
                if (window.DeduplicationUtil) {
                    this.menuItems = window.DeduplicationUtil.dedupeMenuItems(items);
                } else {
                    this.menuItems = items;
                }
            }
        } catch (error) {
            const errorMessage = window.ErrorHandler ? 
                window.ErrorHandler.handleError(error, 'Menu Search') :
                'Failed to load menu items';
            if (window.showNotification) {
                window.showNotification(errorMessage, 'error');
            }
            this.menuItems = [];
        }
    }

    /**
     * Setup search input
     */
    setupSearchInput() {
        // Create search input if it doesn't exist
        let searchInput = document.getElementById('menuSearchInput');
        
        if (!searchInput) {
            // Try to find existing search elements
            const header = document.querySelector('.header');
            if (header) {
                const searchContainer = document.createElement('div');
                searchContainer.className = 'menu-search-container';
                searchContainer.style.cssText = `
                    position: relative;
                    margin-left: 20px;
                    display: flex;
                    align-items: center;
                `;
                
                searchInput = document.createElement('input');
                searchInput.type = 'text';
                searchInput.id = 'menuSearchInput';
                searchInput.placeholder = 'Search menu items...';
                searchInput.className = 'menu-search-input';
                searchInput.style.cssText = `
                    padding: 10px 40px 10px 15px;
                    background: var(--color-bg-card, #1a1a1a);
                    border: 2px solid var(--color-primary, #FFD700);
                    border-radius: 25px;
                    color: var(--color-text-primary, #FFFFFF);
                    font-size: 1.4rem;
                    font-family: var(--fontFamily-dm_sans, sans-serif);
                    width: 300px;
                    transition: all 0.3s ease;
                `;
                
                const searchIcon = document.createElement('ion-icon');
                searchIcon.name = 'search-outline';
                searchIcon.style.cssText = `
                    position: absolute;
                    right: 15px;
                    color: var(--color-primary, #FFD700);
                    font-size: 20px;
                    pointer-events: none;
                `;
                
                searchContainer.appendChild(searchInput);
                searchContainer.appendChild(searchIcon);
                
                // Insert after logo
                const logo = header.querySelector('.logo');
                if (logo && logo.parentElement) {
                    logo.parentElement.insertBefore(searchContainer, logo.nextSibling);
                }
            }
        }

        if (searchInput) {
            // Real-time search
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value.trim().toLowerCase();
                this.performSearch();
            });

            // Clear search on Escape
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    searchInput.value = '';
                    this.searchTerm = '';
                    this.performSearch();
                    searchInput.blur();
                }
            });
        }
    }

    /**
     * Perform search
     */
    performSearch() {
        if (!this.searchTerm) {
            this.filteredItems = [];
            this.hideSearchResults();
            // Dispatch event to show all items
            window.dispatchEvent(new CustomEvent('menuSearchCleared'));
            return;
        }

        // Filter menu items
        this.filteredItems = this.menuItems.filter(item => {
            const name = (item.name || '').toLowerCase();
            const description = (item.description || '').toLowerCase();
            const category = (item.category || '').toLowerCase();
            const type = (item.type || '').toLowerCase();
            
            return name.includes(this.searchTerm) ||
                   description.includes(this.searchTerm) ||
                   category.includes(this.searchTerm) ||
                   type.includes(this.searchTerm);
        });

        this.displaySearchResults();
        
        // Dispatch search event
        window.dispatchEvent(new CustomEvent('menuSearchPerformed', {
            detail: { 
                searchTerm: this.searchTerm,
                results: this.filteredItems 
            }
        }));
    }

    /**
     * Display search results
     */
    displaySearchResults() {
        // Remove existing results
        this.hideSearchResults();

        if (this.filteredItems.length === 0) {
            this.showNoResults();
            return;
        }

        // Create results container
        const resultsContainer = document.createElement('div');
        resultsContainer.id = 'menuSearchResults';
        resultsContainer.className = 'menu-search-results';
        resultsContainer.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: var(--color-bg-card, #1a1a1a);
            border: 2px solid var(--color-primary, #FFD700);
            border-radius: 12px;
            max-height: 400px;
            overflow-y: auto;
            z-index: 1000;
            margin-top: 10px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        `;

        // Add results
        this.filteredItems.slice(0, 10).forEach(item => {
            const resultItem = document.createElement('div');
            resultItem.className = 'menu-search-result-item';
            resultItem.style.cssText = `
                padding: 15px;
                border-bottom: 1px solid rgba(255, 215, 0, 0.2);
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                gap: 15px;
            `;
            
            resultItem.innerHTML = `
                <img src="${item.image}" alt="${item.name}" 
                     style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;"
                     onerror="this.src='./assets/images/menu-1.png'">
                <div style="flex: 1;">
                    <h4 style="color: var(--color-primary, #FFD700); margin: 0 0 5px 0; font-size: 1.6rem;">
                        ${item.name}
                    </h4>
                    <p style="color: var(--color-text-secondary, #CCCCCC); margin: 0; font-size: 1.2rem;">
                        ${item.description ? item.description.substring(0, 60) + '...' : ''}
                    </p>
                    <span style="color: var(--color-success, #4CAF50); font-weight: bold; font-size: 1.4rem;">
                        ₹${item.price.toFixed(2)}
                    </span>
                </div>
            `;

            resultItem.addEventListener('click', () => {
                this.selectSearchResult(item);
            });

            resultItem.addEventListener('mouseenter', () => {
                resultItem.style.background = 'rgba(255, 215, 0, 0.1)';
            });

            resultItem.addEventListener('mouseleave', () => {
                resultItem.style.background = 'transparent';
            });

            resultsContainer.appendChild(resultItem);
        });

        // Append to search input container
        const searchContainer = document.querySelector('.menu-search-container');
        if (searchContainer) {
            searchContainer.style.position = 'relative';
            searchContainer.appendChild(resultsContainer);
        }
    }

    /**
     * Show no results message
     */
    showNoResults() {
        const noResults = document.createElement('div');
        noResults.id = 'menuSearchResults';
        noResults.className = 'menu-search-results';
        noResults.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: var(--color-bg-card, #1a1a1a);
            border: 2px solid var(--color-primary, #FFD700);
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            color: var(--color-text-secondary, #CCCCCC);
            z-index: 1000;
            margin-top: 10px;
        `;
        noResults.textContent = 'No items found';

        const searchContainer = document.querySelector('.menu-search-container');
        if (searchContainer) {
            searchContainer.appendChild(noResults);
        }
    }

    /**
     * Hide search results
     */
    hideSearchResults() {
        const results = document.getElementById('menuSearchResults');
        if (results) {
            results.remove();
        }
    }

    /**
     * Handle search result selection
     * @param {Object} item - Selected menu item
     */
    selectSearchResult(item) {
        // Clear search
        const searchInput = document.getElementById('menuSearchInput');
        if (searchInput) {
            searchInput.value = '';
            this.searchTerm = '';
            this.hideSearchResults();
        }

        // Navigate to item or show order modal
        if (window.orderingSystem) {
            window.orderingSystem.showOrderModal(item._id);
        } else {
            // Fallback: navigate to all-menu page
            window.location.href = `all-menu.html#item-${item._id}`;
        }
    }
}

// Initialize search when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.menuSearch = new MenuSearch();
});

