/**
 * Enhanced Error Handling UI
 * Provides retry mechanisms, offline detection, and network status
 */

class ErrorHandlerUI {
    constructor() {
        this.networkStatus = 'online';
        this.init();
    }

    init() {
        this.setupNetworkDetection();
        this.createNetworkIndicator();
        this.enhanceErrorMessages();
    }

    /**
     * Setup network detection
     */
    setupNetworkDetection() {
        // Listen for online/offline events
        window.addEventListener('online', () => {
            this.networkStatus = 'online';
            this.updateNetworkIndicator();
            this.hideOfflineMessage();
            if (window.AccessibilityManager) {
                AccessibilityManager.announce('Internet connection restored', 'polite');
            }
        });

        window.addEventListener('offline', () => {
            this.networkStatus = 'offline';
            this.updateNetworkIndicator();
            this.showOfflineMessage();
            if (window.AccessibilityManager) {
                AccessibilityManager.announce('Internet connection lost', 'assertive');
            }
        });

        // Initial check
        this.networkStatus = navigator.onLine ? 'online' : 'offline';
        this.updateNetworkIndicator();
    }

    /**
     * Create network status indicator
     */
    createNetworkIndicator() {
        if (document.getElementById('network-indicator')) return;

        const indicator = document.createElement('div');
        indicator.id = 'network-indicator';
        indicator.className = 'network-indicator';
        indicator.setAttribute('role', 'status');
        indicator.setAttribute('aria-live', 'polite');
        indicator.innerHTML = `
            <div class="network-indicator-content">
                <ion-icon name="wifi-outline" class="network-icon"></ion-icon>
                <span class="network-text">Online</span>
            </div>
        `;
        
        document.body.appendChild(indicator);
    }

    /**
     * Update network indicator
     */
    updateNetworkIndicator() {
        const indicator = document.getElementById('network-indicator');
        if (!indicator) return;

        const icon = indicator.querySelector('.network-icon');
        const text = indicator.querySelector('.network-text');
        
        if (this.networkStatus === 'online') {
            indicator.className = 'network-indicator network-indicator-online';
            icon.setAttribute('name', 'wifi-outline');
            text.textContent = 'Online';
            indicator.setAttribute('aria-label', 'Internet connection: Online');
        } else {
            indicator.className = 'network-indicator network-indicator-offline';
            icon.setAttribute('name', 'wifi-outline');
            text.textContent = 'Offline';
            indicator.setAttribute('aria-label', 'Internet connection: Offline');
        }
    }

    /**
     * Show offline message
     */
    showOfflineMessage() {
        if (document.getElementById('offline-message')) return;

        const message = document.createElement('div');
        message.id = 'offline-message';
        message.className = 'offline-message';
        message.setAttribute('role', 'alert');
        message.innerHTML = `
            <div class="offline-message-content">
                <ion-icon name="cloud-offline-outline" aria-hidden="true"></ion-icon>
                <div class="offline-message-text">
                    <strong>You're offline</strong>
                    <p>Please check your internet connection. Some features may not be available.</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(message);
        
        // Auto-hide after 5 seconds if back online
        setTimeout(() => {
            if (this.networkStatus === 'online') {
                this.hideOfflineMessage();
            }
        }, 5000);
    }

    /**
     * Hide offline message
     */
    hideOfflineMessage() {
        const message = document.getElementById('offline-message');
        if (message) {
            message.remove();
        }
    }

    /**
     * Enhance error messages with retry
     */
    enhanceErrorMessages() {
        // Override ErrorHandler.showError to add retry
        const originalShowError = window.ErrorHandler?.showError;
        
        if (window.ErrorHandler) {
            window.ErrorHandler.showError = (message, type = 'error', options = {}) => {
                const errorContainer = document.createElement('div');
                errorContainer.className = `error-container error-${type}`;
                errorContainer.setAttribute('role', 'alert');
                errorContainer.innerHTML = `
                    <div class="error-content">
                        <ion-icon name="alert-circle-outline" aria-hidden="true"></ion-icon>
                        <div class="error-message-text">
                            <strong>${type === 'error' ? 'Error' : type === 'warning' ? 'Warning' : 'Info'}</strong>
                            <p>${message}</p>
                        </div>
                        ${options.retry ? `
                            <button class="btn-retry" aria-label="Retry operation">
                                <ion-icon name="refresh-outline" aria-hidden="true"></ion-icon>
                                Retry
                            </button>
                        ` : ''}
                        <button class="btn-close-error" aria-label="Close error message">
                            <ion-icon name="close-outline" aria-hidden="true"></ion-icon>
                        </button>
                    </div>
                `;

                // Add retry handler
                if (options.retry) {
                    const retryBtn = errorContainer.querySelector('.btn-retry');
                    retryBtn.addEventListener('click', () => {
                        errorContainer.remove();
                        if (typeof options.retry === 'function') {
                            options.retry();
                        }
                    });
                }

                // Add close handler
                const closeBtn = errorContainer.querySelector('.btn-close-error');
                closeBtn.addEventListener('click', () => {
                    errorContainer.remove();
                });

                // Auto-remove after duration
                const duration = options.duration || 5000;
                setTimeout(() => {
                    if (errorContainer.parentNode) {
                        errorContainer.remove();
                    }
                }, duration);

                // Show in notification container or create one
                let container = document.getElementById('error-notification-container');
                if (!container) {
                    container = document.createElement('div');
                    container.id = 'error-notification-container';
                    container.style.cssText = `
                        position: fixed;
                        top: 80px;
                        right: 20px;
                        z-index: 10001;
                        display: flex;
                        flex-direction: column;
                        gap: 10px;
                        max-width: 400px;
                    `;
                    document.body.appendChild(container);
                }

                container.appendChild(errorContainer);

                // Animate in
                setTimeout(() => {
                    errorContainer.style.opacity = '1';
                    errorContainer.style.transform = 'translateX(0)';
                }, 100);

                // Announce to screen readers
                if (window.AccessibilityManager) {
                    AccessibilityManager.announce(message, 'assertive');
                }
            };
        }
    }

    /**
     * Show error with retry
     */
    static showErrorWithRetry(message, retryFunction, type = 'error') {
        if (window.ErrorHandler) {
            window.ErrorHandler.showError(message, type, {
                retry: retryFunction,
                duration: 10000
            });
        }
    }

    /**
     * Check network status
     */
    static isOnline() {
        return navigator.onLine;
    }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.errorHandlerUI = new ErrorHandlerUI();
    });
} else {
    window.errorHandlerUI = new ErrorHandlerUI();
}

// Export
window.ErrorHandlerUI = ErrorHandlerUI;

// CSS for error handler
const errorHandlerStyles = `
.network-indicator {
    position: fixed;
    top: 20px;
    left: 20px;
    z-index: 9999;
    padding: 8px 12px;
    border-radius: 20px;
    font-size: 1.2rem;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
}

.network-indicator-online {
    background: rgba(76, 175, 80, 0.2);
    color: #4caf50;
    border: 1px solid rgba(76, 175, 80, 0.3);
}

.network-indicator-offline {
    background: rgba(244, 67, 54, 0.2);
    color: #f44336;
    border: 1px solid rgba(244, 67, 54, 0.3);
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0%, 100% {
        opacity: 1;
    }
    50% {
        opacity: 0.7;
    }
}

.offline-message {
    position: fixed;
    top: 80px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10002;
    background: rgba(244, 67, 54, 0.95);
    color: white;
    padding: 16px 20px;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    max-width: 500px;
    animation: slideDown 0.3s ease;
}

@keyframes slideDown {
    from {
        transform: translateX(-50%) translateY(-20px);
        opacity: 0;
    }
    to {
        transform: translateX(-50%) translateY(0);
        opacity: 1;
    }
}

.offline-message-content {
    display: flex;
    align-items: center;
    gap: 12px;
}

.offline-message-text strong {
    display: block;
    font-size: 1.6rem;
    margin-bottom: 4px;
}

.offline-message-text p {
    font-size: 1.4rem;
    opacity: 0.9;
    margin: 0;
}

.error-container {
    background: rgba(244, 67, 54, 0.95);
    color: white;
    padding: 16px 20px;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    margin-bottom: 10px;
    opacity: 0;
    transform: translateX(400px);
    transition: all 0.3s ease;
}

.error-content {
    display: flex;
    align-items: flex-start;
    gap: 12px;
}

.error-message-text {
    flex: 1;
}

.error-message-text strong {
    display: block;
    font-size: 1.6rem;
    margin-bottom: 4px;
}

.error-message-text p {
    font-size: 1.4rem;
    opacity: 0.9;
    margin: 0;
}

.btn-retry,
.btn-close-error {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    padding: 8px 12px;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 1.4rem;
    transition: background 0.2s ease;
}

.btn-retry:hover,
.btn-close-error:hover {
    background: rgba(255, 255, 255, 0.3);
}

@media (max-width: 768px) {
    .network-indicator {
        top: 10px;
        left: 10px;
        font-size: 1rem;
        padding: 6px 10px;
    }
    
    .offline-message {
        left: 10px;
        right: 10px;
        max-width: none;
        transform: none;
    }
    
    .error-container {
        max-width: calc(100vw - 40px);
    }
}
`;

// Inject styles
if (!document.getElementById('error-handler-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'error-handler-styles';
    styleSheet.textContent = errorHandlerStyles;
    document.head.appendChild(styleSheet);
}

