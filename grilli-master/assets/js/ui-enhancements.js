// UI Enhancements for Grilli Restaurant App
class UIEnhancements {
    constructor() {
        this.init();
    }

    init() {
        this.enhanceButtons();
        this.enhanceMenuCards();
        this.enhanceFormInputs();
        this.addSmoothScroll();
        this.improveModals();
        this.addLoadingStates();
        this.setupTouchGestures();
        this.enhanceNotifications();
    }

    enhanceButtons() {
        // Add enhanced class to all primary buttons
        const primaryButtons = document.querySelectorAll('.btn-primary, .btn, button[type="submit"]');
        primaryButtons.forEach(btn => {
            if (!btn.classList.contains('btn-enhanced')) {
                btn.classList.add('btn-enhanced');
            }
        });

        // Add to cart button animations
        const addToCartButtons = document.querySelectorAll('.add-to-cart, [data-add-to-cart]');
        addToCartButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                btn.classList.add('added');
                setTimeout(() => {
                    btn.classList.remove('added');
                }, 2000);
            });
        });
    }

    enhanceMenuCards() {
        const menuCards = document.querySelectorAll('.menu-card, .food-menu-card');
        menuCards.forEach(card => {
            if (!card.classList.contains('menu-card-enhanced')) {
                card.classList.add('menu-card-enhanced');
            }

            // Add price reveal on hover
            const priceElement = card.querySelector('.price, .menu-price, [data-price]');
            if (priceElement && !priceElement.classList.contains('price-reveal')) {
                priceElement.classList.add('price-reveal');
            }

            // Add stagger animation
            const index = Array.from(menuCards).indexOf(card);
            card.style.animationDelay = `${index * 0.1}s`;
            if (!card.classList.contains('fade-in')) {
                card.classList.add('fade-in');
            }
        });
    }

    enhanceFormInputs() {
        const inputs = document.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            const wrapper = document.createElement('div');
            wrapper.className = 'form-input-enhanced';
            
            // Skip if already wrapped
            if (input.parentElement.classList.contains('form-input-enhanced')) {
                return;
            }

            // Wrap input
            input.parentNode.insertBefore(wrapper, input);
            wrapper.appendChild(input);

            // Add label if placeholder exists
            if (input.placeholder && !input.nextElementSibling?.classList.contains('form-label')) {
                const label = document.createElement('label');
                label.textContent = input.placeholder;
                label.className = 'form-label';
                input.placeholder = '';
                wrapper.appendChild(label);
            }
        });
    }

    addSmoothScroll() {
        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const href = this.getAttribute('href');
                if (href === '#') return;
                
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // Add scroll reveal animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Observe elements with data-animate attribute
        document.querySelectorAll('[data-animate]').forEach(el => {
            observer.observe(el);
        });
    }

    improveModals() {
        const modals = document.querySelectorAll('.modal, .order-modal, [data-modal]');
        modals.forEach(modal => {
            // Add backdrop blur
            if (!modal.classList.contains('glass-card')) {
                modal.classList.add('glass-card');
            }

            // Add close on outside click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal);
                }
            });

            // Add escape key to close
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modal.classList.contains('active')) {
                    this.closeModal(modal);
                }
            });
        });
    }

    closeModal(modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    addLoadingStates() {
        // Create loading skeleton function
        window.showLoadingSkeleton = (container, count = 3) => {
            if (!container) return;
            
            container.innerHTML = '';
            for (let i = 0; i < count; i++) {
                const skeleton = document.createElement('div');
                skeleton.className = 'skeleton';
                skeleton.innerHTML = `
                    <div class="skeleton-image"></div>
                    <div class="skeleton-title"></div>
                    <div class="skeleton-text"></div>
                    <div class="skeleton-text" style="width: 80%;"></div>
                `;
                container.appendChild(skeleton);
            }
        };

        // Enhanced loading spinner
        window.showLoadingSpinner = (container) => {
            if (!container) return;
            const spinner = document.createElement('div');
            spinner.className = 'loading-spinner';
            spinner.style.cssText = 'margin: 40px auto;';
            container.innerHTML = '';
            container.appendChild(spinner);
        };
    }

    setupTouchGestures() {
        // Add swipeable class to scrollable containers
        const scrollableContainers = document.querySelectorAll('.menu-grid, .scroll-container, [data-scrollable]');
        scrollableContainers.forEach(container => {
            container.classList.add('swipeable');
        });

        // Bottom sheet for mobile
        if (window.innerWidth <= 768) {
            const modals = document.querySelectorAll('.modal, .order-modal');
            modals.forEach(modal => {
                if (!modal.classList.contains('bottom-sheet')) {
                    modal.classList.add('bottom-sheet');
                    
                    // Add handle
                    const handle = document.createElement('div');
                    handle.className = 'bottom-sheet-handle';
                    modal.insertBefore(handle, modal.firstChild);
                }
            });
        }
    }

    enhanceNotifications() {
        // Enhanced notification system
        window.showEnhancedNotification = (message, type = 'info', duration = 4000) => {
            const notification = document.createElement('div');
            notification.className = `notification-enhanced ${type}`;
            
            const icons = {
                success: '✓',
                error: '✕',
                warning: '⚠',
                info: 'ℹ'
            };

            const titles = {
                success: 'Success',
                error: 'Error',
                warning: 'Warning',
                info: 'Info'
            };

            notification.innerHTML = `
                <div class="notification-enhanced-icon">${icons[type] || icons.info}</div>
                <div class="notification-enhanced-content">
                    <div class="notification-enhanced-title">${titles[type] || 'Notification'}</div>
                    <div class="notification-enhanced-message">${this.escapeHtml(message)}</div>
                </div>
                <button class="notification-enhanced-close" aria-label="Close notification">×</button>
            `;

            document.body.appendChild(notification);

            // Show animation
            setTimeout(() => {
                notification.classList.add('show');
            }, 10);

            // Close button
            const closeBtn = notification.querySelector('.notification-enhanced-close');
            closeBtn.addEventListener('click', () => {
                this.removeNotification(notification);
            });

            // Auto remove
            setTimeout(() => {
                this.removeNotification(notification);
            }, duration);

            return notification;
        };

        // Override existing showNotification if available
        if (window.showNotification) {
            const originalShowNotification = window.showNotification;
            window.showNotification = (message, type) => {
                return window.showEnhancedNotification(message, type);
            };
        }
    }

    removeNotification(notification) {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    // Add glassmorphism to cards
    addGlassmorphism() {
        const cards = document.querySelectorAll('.card, .menu-card, .food-menu-card');
        cards.forEach(card => {
            if (!card.classList.contains('glass-card')) {
                card.classList.add('glass-card');
            }
        });
    }

    // Add hover glow to interactive elements
    addHoverGlow() {
        const elements = document.querySelectorAll('.btn, .menu-card, .navbar-link');
        elements.forEach(el => {
            if (!el.classList.contains('hover-glow')) {
                el.classList.add('hover-glow');
            }
        });
    }

    // Add pulse animation to important elements
    addPulseAnimation(element) {
        if (element && !element.classList.contains('pulse-animation')) {
            element.classList.add('pulse-animation');
        }
    }

    // Remove pulse animation
    removePulseAnimation(element) {
        if (element) {
            element.classList.remove('pulse-animation');
        }
    }

    // Escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Add success animation
    showSuccessAnimation(element) {
        if (!element) return;
        
        const check = document.createElement('div');
        check.className = 'success-check';
        check.innerHTML = '✓';
        check.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 1000;';
        
        element.style.position = 'relative';
        element.appendChild(check);
        
        setTimeout(() => {
            check.remove();
        }, 2000);
    }

    // Progress bar
    createProgressBar(container, progress = 0) {
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        progressBar.innerHTML = `<div class="progress-bar-fill" style="width: ${progress}%"></div>`;
        container.appendChild(progressBar);
        
        return {
            update: (newProgress) => {
                const fill = progressBar.querySelector('.progress-bar-fill');
                if (fill) {
                    fill.style.width = `${newProgress}%`;
                }
            },
            remove: () => {
                progressBar.remove();
            }
        };
    }
}

// Initialize UI enhancements when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.uiEnhancements = new UIEnhancements();
    });
} else {
    window.uiEnhancements = new UIEnhancements();
}

// Add page transition
window.addEventListener('beforeunload', () => {
    document.body.classList.add('page-transition-enter');
});




