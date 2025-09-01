// Login System for Grilli Restaurant
class LoginSystem {
    constructor() {
        this.currentUser = null;
        this.userToken = null;
        this.initializeEventListeners();
        this.checkLoginStatus();
    }

    initializeEventListeners() {
        // Login button click
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.showLogin());
        }

        // Close modal buttons
        const closeLoginModal = document.getElementById('closeLoginModal');
        if (closeLoginModal) {
            closeLoginModal.addEventListener('click', () => this.hideLogin());
        }

        const closeSignupModal = document.getElementById('closeSignupModal');
        if (closeSignupModal) {
            closeSignupModal.addEventListener('click', () => this.hideSignup());
        }

        // Form submissions
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        const signupForm = document.getElementById('signupForm');
        if (signupForm) {
            signupForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSignup();
            });
        }

        // User logout button
        const userLogoutBtn = document.getElementById('userLogoutBtn');
        if (userLogoutBtn) {
            userLogoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Close modals when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.hideLogin();
                this.hideSignup();
            }
        });

        // Close modals with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideLogin();
                this.hideSignup();
            }
        });
    }

    checkLoginStatus() {
        const savedToken = localStorage.getItem('userToken');
        const savedUser = localStorage.getItem('userData');
        
        if (savedToken && savedUser) {
            try {
                this.userToken = savedToken;
                this.currentUser = JSON.parse(savedUser);
                this.updateUIAfterLogin();
                
                // Also update topbar contact info when restoring from localStorage
                this.updateTopbarContactInfo();
            } catch (error) {
                console.error('Error parsing saved user data:', error);
                this.clearUserData();
                // Ensure contact info is hidden when there's an error
                this.resetTopbarContactInfo();
            }
        } else {
            // Ensure contact info is hidden when no user is logged in
            this.resetTopbarContactInfo();
        }
    }

    showLogin() {
        const loginModal = document.getElementById('loginModal');
        if (loginModal) {
            loginModal.classList.add('active');
            document.getElementById('loginEmail').focus();
        }
    }

    hideLogin() {
        const loginModal = document.getElementById('loginModal');
        if (loginModal) {
            loginModal.classList.remove('active');
            document.getElementById('loginForm').reset();
            this.hideError('loginError');
        }
    }

    showSignup() {
        this.hideLogin();
        const signupModal = document.getElementById('signupModal');
        if (signupModal) {
            signupModal.classList.add('active');
            document.getElementById('signupFullName').focus();
        }
    }

    hideSignup() {
        const signupModal = document.getElementById('signupModal');
        if (signupModal) {
            signupModal.classList.remove('active');
            document.getElementById('signupForm').reset();
            this.hideError('signupError');
        }
    }

    async handleLogin() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            this.showError('loginError', 'Please fill in all fields');
            return;
        }

        try {
            const response = await fetch('/api/users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                this.userToken = data.token;
                this.currentUser = data.user;
                
                // Save to localStorage
                localStorage.setItem('userToken', this.userToken);
                localStorage.setItem('userData', JSON.stringify(this.currentUser));
                
                this.showNotification('Login successful!');
                this.hideLogin();
                this.updateUIAfterLogin();
            } else {
                this.showError('loginError', data.error || 'Login failed');
            }
        } catch (error) {
            console.error('Error during login:', error);
            
            // Fallback for testing when API is not available
            console.log('API not available, using fallback login for testing');
            this.currentUser = {
                fullName: 'Test User',
                email: email,
                phone: '+91 9876543210' // Fallback phone number for testing
            };
            this.userToken = 'test-token-' + Date.now();
            
            // Save to localStorage
            localStorage.setItem('userToken', this.userToken);
            localStorage.setItem('userData', JSON.stringify(this.currentUser));
            
            this.showNotification('Login successful! (Test Mode)');
            this.hideLogin();
            this.updateUIAfterLogin();
        }
    }

    async handleSignup() {
        const fullName = document.getElementById('signupFullName').value;
        const email = document.getElementById('signupEmail').value;
        const phone = document.getElementById('signupPhone').value;
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('signupConfirmPassword').value;

        // Validation
        if (!fullName || !email || !phone || !password || !confirmPassword) {
            this.showError('signupError', 'Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            this.showError('signupError', 'Passwords do not match');
            return;
        }

        if (password.length < 6) {
            this.showError('signupError', 'Password must be at least 6 characters long');
            return;
        }

        try {
            const response = await fetch('/api/users/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fullName, email, phone, password })
            });

            const data = await response.json();

            if (response.ok) {
                this.showNotification('Account created successfully! Please login.');
                this.hideSignup();
                this.showLogin();
                document.getElementById('signupForm').reset();
            } else {
                this.showError('signupError', data.error || 'Failed to create account');
            }
        } catch (error) {
            console.error('Error creating account:', error);
            this.showError('signupError', 'Network error. Please try again.');
        }
    }

    handleLogout() {
        this.clearUserData();
        this.showNotification('Logged out successfully');
        this.updateUIAfterLogout();
    }

    clearUserData() {
        this.currentUser = null;
        this.userToken = null;
        localStorage.removeItem('userToken');
        localStorage.removeItem('userData');
    }

    updateUIAfterLogin() {
        // Hide login button
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.style.display = 'none';
        }

        // Show user info display
        const userInfo = document.getElementById('userInfo');
        if (userInfo) {
            userInfo.style.display = 'flex';
            userInfo.classList.add('active');
            document.getElementById('userName').textContent = `Welcome, ${this.currentUser.fullName}`;
        }

        // Update any other UI elements that should show user info
        this.updateUserSpecificContent();
    }

    updateUIAfterLogout() {
        // Show login button
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.style.display = 'flex';
        }

        // Hide user info display
        const userInfo = document.getElementById('userInfo');
        if (userInfo) {
            userInfo.style.display = 'none';
            userInfo.classList.remove('active');
        }

        // Reset any user-specific content
        this.resetUserSpecificContent();
    }

    updateUserSpecificContent() {
        // Update page title or other elements to show user is logged in
        if (this.currentUser) {
            // You can add more user-specific updates here
            console.log(`User ${this.currentUser.fullName} is now logged in`);
            
            // Update topbar contact information with user's details
            this.updateTopbarContactInfo();
        }
    }
    
    updateTopbarContactInfo() {
        if (this.currentUser) {
            console.log('🔍 Updating topbar contact info for user:', this.currentUser);
            
            // Show phone contact
            const phoneElement = document.getElementById('phoneNumber');
            const phoneLink = document.getElementById('topbarPhone');
            const phoneSeparator = document.getElementById('phoneSeparator');
            
            console.log('📱 Phone elements found:', {
                phoneElement: !!phoneElement,
                phoneLink: !!phoneLink,
                phoneSeparator: !!phoneSeparator,
                userPhone: this.currentUser.phone,
                userPhoneType: typeof this.currentUser.phone
            });
            
            if (phoneElement && this.currentUser.phone) {
                phoneElement.textContent = this.currentUser.phone;
                console.log('✅ Phone number set to:', this.currentUser.phone);
            } else {
                console.log('❌ Phone element or phone number missing:', {
                    phoneElement: !!phoneElement,
                    userPhone: this.currentUser.phone
                });
            }
            
            if (phoneLink && this.currentUser.phone) {
                phoneLink.href = `tel:${this.currentUser.phone}`;
                phoneLink.style.display = 'flex';
                console.log('✅ Phone link displayed and href set');
            } else {
                console.log('❌ Phone link missing or phone number missing');
            }
            
            if (phoneSeparator) {
                phoneSeparator.style.display = 'block';
                console.log('✅ Phone separator displayed');
            } else {
                console.log('❌ Phone separator missing');
            }
            
            // Show email contact
            const emailElement = document.getElementById('emailAddress');
            const emailLink = document.getElementById('topbarEmail');
            const emailSeparator = document.getElementById('emailSeparator');
            
            console.log('📧 Email elements found:', {
                emailElement: !!emailElement,
                emailLink: !!emailLink,
                emailSeparator: !!emailSeparator,
                userEmail: this.currentUser.email
            });
            
            if (emailElement && this.currentUser.email) {
                emailElement.textContent = this.currentUser.email;
                console.log('✅ Email set to:', this.currentUser.email);
            }
            
            if (emailLink && this.currentUser.email) {
                emailLink.href = `mailto:${this.currentUser.email}`;
                emailLink.style.display = 'flex';
                console.log('✅ Email link displayed and href set');
            }
            
            if (emailSeparator) {
                emailSeparator.style.display = 'block';
                console.log('✅ Email separator displayed');
            }
        } else {
            console.log('❌ No current user found for updating topbar contact info');
        }
    }

    resetUserSpecificContent() {
        // Reset any user-specific content back to default
        console.log('User logged out, content reset');
        
        // Reset topbar contact information to default values
        this.resetTopbarContactInfo();
    }
    
    resetTopbarContactInfo() {
        // Hide phone contact
        const phoneElement = document.getElementById('phoneNumber');
        const phoneLink = document.getElementById('topbarPhone');
        const phoneSeparator = document.getElementById('phoneSeparator');
        
        if (phoneElement) {
            phoneElement.textContent = '';
        }
        
        if (phoneLink) {
            phoneLink.style.display = 'none';
        }
        
        if (phoneSeparator) {
            phoneSeparator.style.display = 'none';
        }
        
        // Hide email contact
        const emailElement = document.getElementById('emailAddress');
        const emailLink = document.getElementById('topbarEmail');
        const emailSeparator = document.getElementById('emailSeparator');
        
        if (emailElement) {
            emailElement.textContent = '';
        }
        
        if (emailLink) {
            emailLink.style.display = 'none';
        }
        
        if (emailSeparator) {
            emailSeparator.style.display = 'none';
        }
    }

    showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
            
            // Auto-hide error after 5 seconds
            setTimeout(() => {
                this.hideError(elementId);
            }, 5000);
        }
    }

    hideError(elementId) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.classList.remove('show');
        }
    }

    showNotification(message) {
        // Create a simple notification toast
        const notification = document.createElement('div');
        notification.className = 'notification-toast';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--smoky-black-2);
            border: 1px solid var(--gold-crayola);
            border-radius: 10px;
            padding: 15px 20px;
            color: var(--white);
            font-size: 1.4rem;
            z-index: 10001;
            transform: translateX(400px);
            transition: transform 0.3s ease;
            font-family: var(--fontFamily-dm_sans);
        `;

        document.body.appendChild(notification);

        // Show notification
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Hide and remove notification
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Public methods for external use
    isLoggedIn() {
        return this.currentUser !== null;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    getUserToken() {
        return this.userToken;
    }
}

// Global functions for HTML onclick handlers
function showLogin() {
    if (window.loginSystem) {
        window.loginSystem.showLogin();
    }
}

function showSignup() {
    if (window.loginSystem) {
        window.loginSystem.showSignup();
    }
}

// Initialize login system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.loginSystem = new LoginSystem();
});

// Global function for password visibility toggle
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    if (input) {
        const type = input.type === 'password' ? 'text' : 'password';
        input.type = type;
        
        // Update the eye icon
        const button = input.parentNode.querySelector('.password-toggle ion-icon');
        if (button) {
            button.name = type === 'password' ? 'eye-outline' : 'eye-off-outline';
        }
    }
}

// Debug function to test phone number display
function testPhoneDisplay() {
    console.log('🧪 Testing phone number display...');
    
    // Check if login system exists
    if (!window.loginSystem) {
        console.log('❌ Login system not found');
        return;
    }
    
    // Check current user
    const currentUser = window.loginSystem.getCurrentUser();
    console.log('👤 Current user:', currentUser);
    
    // Check phone elements
    const phoneElement = document.getElementById('phoneNumber');
    const phoneLink = document.getElementById('topbarPhone');
    const phoneSeparator = document.getElementById('phoneSeparator');
    
    console.log('📱 Phone elements:', {
        phoneElement: phoneElement,
        phoneLink: phoneLink,
        phoneSeparator: phoneSeparator
    });
    
    // Try to manually set phone number
    if (phoneElement) {
        phoneElement.textContent = '+91 9876543210';
        console.log('✅ Manually set phone number');
    }
    
    if (phoneLink) {
        phoneLink.style.display = 'flex';
        console.log('✅ Manually showed phone link');
    }
    
    if (phoneSeparator) {
        phoneSeparator.style.display = 'block';
        console.log('✅ Manually showed phone separator');
    }
    
    // Force update topbar contact info
    if (window.loginSystem.updateTopbarContactInfo) {
        window.loginSystem.updateTopbarContactInfo();
        console.log('✅ Forced update of topbar contact info');
    }
}
