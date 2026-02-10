/**
 * Empty States Component
 * Provides reusable empty state designs for various scenarios
 */

class EmptyStateManager {
    constructor() {
        this.states = {
            cart: {
                icon: '🛒',
                title: 'Your cart is empty',
                description: 'Looks like you haven\'t added anything to your cart yet. Start exploring our delicious menu!',
                action: {
                    text: 'Browse Menu',
                    href: './index.html#menu',
                    ariaLabel: 'Browse menu to add items to cart'
                }
            },
            orders: {
                icon: '📋',
                title: 'No Orders Yet',
                description: 'You haven\'t placed any orders yet. Start by exploring our delicious menu!',
                action: {
                    text: 'View Menu',
                    href: './index.html#menu',
                    ariaLabel: 'View menu to place an order'
                }
            },
            menu: {
                icon: '🍽️',
                title: 'No Menu Items Available',
                description: 'We\'re currently updating our menu. Please check back soon!',
                action: {
                    text: 'Go Home',
                    href: './index.html',
                    ariaLabel: 'Go to home page'
                }
            },
            search: {
                icon: '🔍',
                title: 'No Results Found',
                description: 'We couldn\'t find any items matching your search. Try different keywords or browse our menu.',
                action: {
                    text: 'View All Menu',
                    href: './all-menu.html',
                    ariaLabel: 'View all menu items'
                }
            },
            favorites: {
                icon: '❤️',
                title: 'No Favorites Yet',
                description: 'You haven\'t saved any favorite items yet. Start adding items you love!',
                action: {
                    text: 'Browse Menu',
                    href: './index.html#menu',
                    ariaLabel: 'Browse menu to find favorites'
                }
            },
            network: {
                icon: '📡',
                title: 'No Internet Connection',
                description: 'It looks like you\'re offline. Please check your internet connection and try again.',
                action: {
                    text: 'Retry',
                    href: '#',
                    ariaLabel: 'Retry connection',
                    onClick: () => window.location.reload()
                }
            }
        };
    }

    /**
     * Create empty state HTML
     * @param {string} type - Type of empty state
     * @param {Object} custom - Custom configuration to override defaults
     * @returns {HTMLElement} Empty state element
     */
    create(type, custom = {}) {
        const config = { ...this.states[type], ...custom };
        
        if (!config) {
            console.warn(`Empty state type "${type}" not found`);
            return null;
        }

        const emptyState = document.createElement('div');
        emptyState.className = `empty-state empty-state-${type}`;
        emptyState.setAttribute('role', 'status');
        emptyState.setAttribute('aria-live', 'polite');
        
        emptyState.innerHTML = `
            <div class="empty-state-content">
                <div class="empty-state-icon" aria-hidden="true">${config.icon}</div>
                <h3 class="empty-state-title">${config.title}</h3>
                <p class="empty-state-description">${config.description}</p>
                ${config.action ? `
                    <a href="${config.action.href || '#'}" 
                       class="btn btn-primary empty-state-action"
                       aria-label="${config.action.ariaLabel || config.action.text}">
                        ${config.action.text}
                    </a>
                ` : ''}
            </div>
        `;

        // Add click handler if provided
        if (config.action && config.action.onClick) {
            const actionBtn = emptyState.querySelector('.empty-state-action');
            if (actionBtn) {
                actionBtn.addEventListener('click', (e) => {
                    if (config.action.href === '#') {
                        e.preventDefault();
                    }
                    config.action.onClick(e);
                });
            }
        }

        return emptyState;
    }

    /**
     * Show empty state in container
     * @param {string} containerId - ID of container element
     * @param {string} type - Type of empty state
     * @param {Object} custom - Custom configuration
     */
    show(containerId, type, custom = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`Container with ID "${containerId}" not found`);
            return;
        }

        // Remove existing empty state
        const existing = container.querySelector('.empty-state');
        if (existing) {
            existing.remove();
        }

        // Hide other content
        const otherContent = container.querySelectorAll(':not(.empty-state)');
        otherContent.forEach(el => {
            if (el.style) {
                el.style.display = 'none';
            }
        });

        // Add empty state
        const emptyState = this.create(type, custom);
        if (emptyState) {
            container.appendChild(emptyState);
            container.style.display = 'block';
        }
    }

    /**
     * Hide empty state
     * @param {string} containerId - ID of container element
     */
    hide(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const emptyState = container.querySelector('.empty-state');
        if (emptyState) {
            emptyState.remove();
        }

        // Show other content
        const otherContent = container.querySelectorAll(':not(.empty-state)');
        otherContent.forEach(el => {
            if (el.style) {
                el.style.display = '';
            }
        });
    }

    /**
     * Check if container is empty and show appropriate state
     * @param {string} containerId - ID of container element
     * @param {string} type - Type of empty state
     * @param {Function} checkFunction - Function to check if container is empty
     * @param {Object} custom - Custom configuration
     */
    checkAndShow(containerId, type, checkFunction, custom = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (checkFunction(container)) {
            this.show(containerId, type, custom);
        } else {
            this.hide(containerId);
        }
    }
}

// CSS for empty states
const emptyStateStyles = `
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    text-align: center;
    min-height: 400px;
}

.empty-state-content {
    max-width: 500px;
    margin: 0 auto;
}

.empty-state-icon {
    font-size: 80px;
    margin-bottom: 24px;
    opacity: 0.8;
    animation: float 3s ease-in-out infinite;
}

@keyframes float {
    0%, 100% {
        transform: translateY(0);
    }
    50% {
        transform: translateY(-10px);
    }
}

.empty-state-title {
    font-size: var(--fontSize-title-2, 2.2rem);
    font-family: var(--fontFamily-forum, 'Forum', cursive);
    color: var(--gold-crayola, #ffd700);
    margin-bottom: 16px;
    font-weight: var(--weight-bold, 700);
}

.empty-state-description {
    font-size: var(--fontSize-body-2, 1.6rem);
    color: var(--quick-silver, #a6a6a6);
    margin-bottom: 32px;
    line-height: var(--lineHeight-5, 1.85em);
}

.empty-state-action {
    display: inline-block;
    margin-top: 16px;
}

/* Responsive */
@media (max-width: 768px) {
    .empty-state {
        padding: 40px 20px;
        min-height: 300px;
    }
    
    .empty-state-icon {
        font-size: 60px;
        margin-bottom: 20px;
    }
    
    .empty-state-title {
        font-size: var(--fontSize-title-3, 2.1rem);
    }
    
    .empty-state-description {
        font-size: var(--fontSize-body-4, 1.6rem);
    }
}

/* Dark theme support */
.dark-theme .empty-state-title {
    color: var(--gold-crayola, #ffd700);
}

.dark-theme .empty-state-description {
    color: var(--quick-silver, #a6a6a6);
}
`;

// Inject styles
if (!document.getElementById('empty-state-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'empty-state-styles';
    styleSheet.textContent = emptyStateStyles;
    document.head.appendChild(styleSheet);
}

// Initialize manager
window.emptyStateManager = new EmptyStateManager();

// Export
window.EmptyStateManager = EmptyStateManager;

