/**
 * Accessibility Enhancements
 * Provides ARIA labels, keyboard navigation, and screen reader support
 */

class AccessibilityManager {
    constructor() {
        this.init();
    }

    init() {
        this.addSkipNavigation();
        this.enhanceModals();
        this.enhanceForms();
        this.enhanceButtons();
        this.addFocusIndicators();
        this.setupKeyboardNavigation();
        this.addLiveRegions();
    }

    /**
     * Add skip navigation link
     */
    addSkipNavigation() {
        if (document.getElementById('skip-nav')) return;

        const skipNav = document.createElement('a');
        skipNav.id = 'skip-nav';
        skipNav.href = '#main-content';
        skipNav.className = 'skip-nav-link';
        skipNav.textContent = 'Skip to main content';
        skipNav.style.cssText = `
            position: absolute;
            top: -40px;
            left: 0;
            background: var(--gold-crayola, #ffd700);
            color: var(--smoky-black-1, #000);
            padding: 8px 16px;
            text-decoration: none;
            z-index: 10000;
            font-weight: bold;
        `;
        
        skipNav.addEventListener('focus', () => {
            skipNav.style.top = '0';
        });
        
        skipNav.addEventListener('blur', () => {
            skipNav.style.top = '-40px';
        });

        document.body.insertBefore(skipNav, document.body.firstChild);
    }

    /**
     * Enhance modals with ARIA attributes and keyboard navigation
     */
    enhanceModals() {
        const modals = document.querySelectorAll('.modal, .order-modal');
        
        modals.forEach(modal => {
            // Add ARIA attributes
            const modalContent = modal.querySelector('.modal-content, .order-modal-content');
            if (modalContent && !modalContent.getAttribute('role')) {
                modalContent.setAttribute('role', 'dialog');
                modalContent.setAttribute('aria-modal', 'true');
            }

            // Get modal title
            const title = modal.querySelector('h2, h3, .modal-header h2');
            if (title && modalContent) {
                const titleId = title.id || `modal-title-${Math.random().toString(36).substr(2, 9)}`;
                title.id = titleId;
                modalContent.setAttribute('aria-labelledby', titleId);
            }

            // Enhance close buttons
            const closeBtns = modal.querySelectorAll('.close-btn, .close-modal-btn, [id*="close"]');
            closeBtns.forEach(btn => {
                if (!btn.getAttribute('aria-label')) {
                    btn.setAttribute('aria-label', 'Close modal');
                }
            });

            // Keyboard navigation
            modal.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    const closeBtn = modal.querySelector('.close-btn, .close-modal-btn, [id*="close"]');
                    if (closeBtn) closeBtn.click();
                }

                // Trap focus within modal
                if (e.key === 'Tab') {
                    const focusableElements = modal.querySelectorAll(
                        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                    );
                    const firstElement = focusableElements[0];
                    const lastElement = focusableElements[focusableElements.length - 1];

                    if (e.shiftKey && document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    } else if (!e.shiftKey && document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            });
        });
    }

    /**
     * Enhance forms with ARIA attributes
     */
    enhanceForms() {
        const forms = document.querySelectorAll('form');
        
        forms.forEach(form => {
            const inputs = form.querySelectorAll('input, select, textarea');
            
            inputs.forEach(input => {
                // Link labels
                const id = input.id;
                if (id) {
                    const label = form.querySelector(`label[for="${id}"]`);
                    if (label && !input.getAttribute('aria-labelledby')) {
                        const labelId = label.id || `label-${id}`;
                        label.id = labelId;
                        input.setAttribute('aria-labelledby', labelId);
                    }
                }

                // Add error message association
                const errorId = `error-${id}`;
                if (input.hasAttribute('required') && !input.getAttribute('aria-describedby')) {
                    input.setAttribute('aria-required', 'true');
                }

                // Real-time validation feedback
                input.addEventListener('invalid', (e) => {
                    const errorMsg = input.validationMessage;
                    let errorElement = document.getElementById(errorId);
                    
                    if (!errorElement) {
                        errorElement = document.createElement('div');
                        errorElement.id = errorId;
                        errorElement.className = 'error-message';
                        errorElement.setAttribute('role', 'alert');
                        input.parentNode.appendChild(errorElement);
                    }
                    
                    errorElement.textContent = errorMsg;
                    input.setAttribute('aria-invalid', 'true');
                    input.setAttribute('aria-describedby', errorId);
                });

                input.addEventListener('input', () => {
                    if (input.validity.valid) {
                        input.removeAttribute('aria-invalid');
                        const errorElement = document.getElementById(errorId);
                        if (errorElement) {
                            errorElement.textContent = '';
                        }
                    }
                });
            });
        });
    }

    /**
     * Enhance buttons with ARIA labels
     */
    enhanceButtons() {
        const buttons = document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
        
        buttons.forEach(button => {
            // Get button text
            const text = button.textContent.trim();
            const icon = button.querySelector('ion-icon');
            
            // If button only has icon, add aria-label
            if (icon && !text && !button.getAttribute('aria-label')) {
                const iconName = icon.getAttribute('name') || 'button';
                button.setAttribute('aria-label', this.formatIconName(iconName));
            }
            
            // Add role if needed
            if (!button.getAttribute('role') && button.closest('a')) {
                button.setAttribute('role', 'button');
            }
        });
    }

    /**
     * Format icon name for aria-label
     */
    formatIconName(name) {
        return name
            .replace(/-/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    }

    /**
     * Add focus indicators
     */
    addFocusIndicators() {
        // Enhanced focus styles are in CSS, but we ensure focusable elements are properly marked
        const focusableElements = document.querySelectorAll(
            'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        focusableElements.forEach(element => {
            if (!element.hasAttribute('tabindex') && element.getAttribute('disabled') !== 'disabled') {
                // Ensure all interactive elements are keyboard accessible
                if (element.tagName === 'DIV' && element.onclick) {
                    element.setAttribute('tabindex', '0');
                    element.setAttribute('role', 'button');
                }
            }
        });
    }

    /**
     * Setup keyboard navigation
     */
    setupKeyboardNavigation() {
        // Enter/Space on buttons
        document.addEventListener('keydown', (e) => {
            if ((e.key === 'Enter' || e.key === ' ') && e.target.getAttribute('role') === 'button') {
                e.preventDefault();
                e.target.click();
            }
        });

        // Arrow key navigation for menus
        const menuItems = document.querySelectorAll('.navbar-list li, .menu-card');
        menuItems.forEach((item, index) => {
            item.addEventListener('keydown', (e) => {
                let target = null;
                
                if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                    e.preventDefault();
                    target = menuItems[index + 1] || menuItems[0];
                } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                    e.preventDefault();
                    target = menuItems[index - 1] || menuItems[menuItems.length - 1];
                }
                
                if (target) {
                    const focusable = target.querySelector('a, button, [tabindex="0"]') || target;
                    focusable.focus();
                }
            });
        });
    }

    /**
     * Add live regions for screen reader announcements
     */
    addLiveRegions() {
        if (document.getElementById('aria-live-polite')) return;

        const polite = document.createElement('div');
        polite.id = 'aria-live-polite';
        polite.setAttribute('aria-live', 'polite');
        polite.setAttribute('aria-atomic', 'true');
        polite.className = 'sr-only';
        polite.style.cssText = 'position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden;';

        const assertive = document.createElement('div');
        assertive.id = 'aria-live-assertive';
        assertive.setAttribute('aria-live', 'assertive');
        assertive.setAttribute('aria-atomic', 'true');
        assertive.className = 'sr-only';
        assertive.style.cssText = 'position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden;';

        document.body.appendChild(polite);
        document.body.appendChild(assertive);
    }

    /**
     * Announce to screen readers
     */
    static announce(message, priority = 'polite') {
        const liveRegion = document.getElementById(`aria-live-${priority}`);
        if (liveRegion) {
            liveRegion.textContent = message;
            // Clear after announcement
            setTimeout(() => {
                liveRegion.textContent = '';
            }, 1000);
        }
    }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.accessibilityManager = new AccessibilityManager();
    });
} else {
    window.accessibilityManager = new AccessibilityManager();
}

// Export for use in other scripts
window.AccessibilityManager = AccessibilityManager;

