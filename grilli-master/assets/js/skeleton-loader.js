/**
 * Skeleton Loader Component
 * Provides loading placeholders for better UX
 */

class SkeletonLoader {
    constructor() {
        this.skeletons = {
            menuCard: this.createMenuCardSkeleton(),
            orderCard: this.createOrderCardSkeleton(),
            listItem: this.createListItemSkeleton(),
            form: this.createFormSkeleton()
        };
    }

    /**
     * Create menu card skeleton
     */
    createMenuCardSkeleton() {
        return `
            <div class="skeleton-card skeleton-menu-card">
                <div class="skeleton skeleton-image"></div>
                <div class="skeleton-content">
                    <div class="skeleton skeleton-title"></div>
                    <div class="skeleton skeleton-text"></div>
                    <div class="skeleton skeleton-text" style="width: 60%;"></div>
                    <div class="skeleton skeleton-price"></div>
                </div>
            </div>
        `;
    }

    /**
     * Create order card skeleton
     */
    createOrderCardSkeleton() {
        return `
            <div class="skeleton-card skeleton-order-card">
                <div class="skeleton-header">
                    <div class="skeleton skeleton-title" style="width: 40%;"></div>
                    <div class="skeleton skeleton-badge" style="width: 30%;"></div>
                </div>
                <div class="skeleton skeleton-image" style="height: 150px; margin: 15px 0;"></div>
                <div class="skeleton-content">
                    <div class="skeleton skeleton-text"></div>
                    <div class="skeleton skeleton-text" style="width: 70%;"></div>
                    <div class="skeleton skeleton-price" style="width: 50%;"></div>
                </div>
            </div>
        `;
    }

    /**
     * Create list item skeleton
     */
    createListItemSkeleton() {
        return `
            <div class="skeleton-list-item">
                <div class="skeleton skeleton-circle"></div>
                <div class="skeleton-content">
                    <div class="skeleton skeleton-text"></div>
                    <div class="skeleton skeleton-text" style="width: 60%;"></div>
                </div>
            </div>
        `;
    }

    /**
     * Create form skeleton
     */
    createFormSkeleton() {
        return `
            <div class="skeleton-form">
                <div class="skeleton skeleton-title" style="width: 50%; margin-bottom: 20px;"></div>
                <div class="skeleton skeleton-input"></div>
                <div class="skeleton skeleton-input"></div>
                <div class="skeleton skeleton-textarea" style="height: 100px;"></div>
                <div class="skeleton skeleton-button" style="width: 40%; margin-top: 20px;"></div>
            </div>
        `;
    }

    /**
     * Show skeleton in container
     */
    show(containerId, type = 'menuCard', count = 1) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`Container with ID "${containerId}" not found`);
            return;
        }

        const skeleton = this.skeletons[type];
        if (!skeleton) {
            console.warn(`Skeleton type "${type}" not found`);
            return;
        }

        container.innerHTML = skeleton.repeat(count);
        container.setAttribute('aria-busy', 'true');
        container.setAttribute('aria-label', 'Loading content');
    }

    /**
     * Hide skeleton
     */
    hide(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.removeAttribute('aria-busy');
        container.removeAttribute('aria-label');
    }

    /**
     * Show while loading
     */
    async showWhileLoading(containerId, type, loadingFunction) {
        this.show(containerId, type);
        try {
            await loadingFunction();
        } finally {
            this.hide(containerId);
        }
    }
}

// CSS for skeleton loaders
const skeletonLoaderStyles = `
.skeleton {
    background: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0.05) 25%,
        rgba(255, 255, 255, 0.1) 50%,
        rgba(255, 255, 255, 0.05) 75%
    );
    background-size: 200% 100%;
    animation: skeleton-loading 1.5s ease-in-out infinite;
    border-radius: 8px;
}

@keyframes skeleton-loading {
    0% {
        background-position: 200% 0;
    }
    100% {
        background-position: -200% 0;
    }
}

.skeleton-card {
    background: var(--eerie-black-2, #1d1d1d);
    border: 1px solid var(--eerie-black-3, #141414);
    border-radius: 16px;
    overflow: hidden;
    transition: all 0.3s ease;
}

.skeleton-menu-card {
    padding: 20px;
}

.skeleton-image {
    height: 200px;
    width: 100%;
    border-radius: 12px;
    margin-bottom: 15px;
}

.skeleton-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.skeleton-title {
    height: 24px;
    width: 70%;
    margin-bottom: 8px;
}

.skeleton-text {
    height: 16px;
    margin-bottom: 4px;
}

.skeleton-price {
    height: 28px;
    width: 40%;
    margin-top: 8px;
}

.skeleton-order-card {
    padding: 20px;
    margin-bottom: 20px;
}

.skeleton-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
}

.skeleton-badge {
    height: 24px;
    width: 80px;
    border-radius: 12px;
}

.skeleton-list-item {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 15px;
    margin-bottom: 10px;
}

.skeleton-circle {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    flex-shrink: 0;
}

.skeleton-form {
    padding: 20px;
}

.skeleton-input {
    height: 48px;
    width: 100%;
    margin-bottom: 15px;
    border-radius: 8px;
}

.skeleton-textarea {
    height: 100px;
    width: 100%;
    margin-bottom: 15px;
    border-radius: 8px;
}

.skeleton-button {
    height: 48px;
    width: 150px;
    border-radius: 8px;
}

/* Grid layout for multiple skeletons */
.skeleton-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
}

@media (max-width: 768px) {
    .skeleton-grid {
        grid-template-columns: 1fr;
    }
    
    .skeleton-image {
        height: 150px;
    }
}
`;

// Inject styles
if (!document.getElementById('skeleton-loader-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'skeleton-loader-styles';
    styleSheet.textContent = skeletonLoaderStyles;
    document.head.appendChild(styleSheet);
}

// Initialize
window.skeletonLoader = new SkeletonLoader();

// Export
window.SkeletonLoader = SkeletonLoader;

