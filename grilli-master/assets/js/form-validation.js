// Unified Form Validation System for Grilli Restaurant

class FormValidator {
    constructor() {
        this.rules = {
            email: {
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Please enter a valid email address'
            },
            phone: {
                pattern: /^[\d\s\-\+\(\)]{10,15}$/,
                message: 'Please enter a valid phone number (10-15 digits)'
            },
            password: {
                minLength: 6,
                message: 'Password must be at least 6 characters long'
            },
            required: {
                message: 'This field is required'
            },
            name: {
                minLength: 2,
                pattern: /^[a-zA-Z\s]{2,50}$/,
                message: 'Name must be 2-50 characters and contain only letters'
            },
            address: {
                minLength: 10,
                message: 'Address must be at least 10 characters long'
            }
        };
    }

    /**
     * Validate form field
     * @param {HTMLInputElement|HTMLTextAreaElement} field - Form field element
     * @param {string} rule - Validation rule name
     * @returns {Object} - {valid: boolean, message: string}
     */
    validateField(field, rule) {
        const value = field.value.trim();
        const ruleConfig = this.rules[rule];

        if (!ruleConfig) {
            return { valid: true, message: '' };
        }

        // Check required
        if (rule === 'required' || field.hasAttribute('required')) {
            if (!value) {
                return { valid: false, message: ruleConfig.message || this.rules.required.message };
            }
        }

        // Check minimum length
        if (ruleConfig.minLength && value.length < ruleConfig.minLength) {
            return { valid: false, message: ruleConfig.message };
        }

        // Check pattern
        if (ruleConfig.pattern && !ruleConfig.pattern.test(value)) {
            return { valid: false, message: ruleConfig.message };
        }

        return { valid: true, message: '' };
    }

    /**
     * Validate entire form
     * @param {HTMLFormElement} form - Form element
     * @returns {Object} - {valid: boolean, errors: Array}
     */
    validateForm(form) {
        const errors = [];
        const fields = form.querySelectorAll('input[required], textarea[required], select[required]');

        fields.forEach(field => {
            let rule = 'required';

            // Determine validation rule based on field type/name
            if (field.type === 'email') {
                rule = 'email';
            } else if (field.type === 'tel' || field.name.includes('phone')) {
                rule = 'phone';
            } else if (field.type === 'password') {
                rule = 'password';
            } else if (field.name.includes('name') || field.name.includes('Name')) {
                rule = 'name';
            } else if (field.name.includes('address') || field.name.includes('Address')) {
                rule = 'address';
            }

            const validation = this.validateField(field, rule);
            if (!validation.valid) {
                errors.push({
                    field: field,
                    message: validation.message
                });
                this.showFieldError(field, validation.message);
            } else {
                this.clearFieldError(field);
            }
        });

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Show field error
     * @param {HTMLElement} field - Form field element
     * @param {string} message - Error message
     */
    showFieldError(field, message) {
        field.classList.add('error');
        
        // Remove existing error message
        const existingError = field.parentElement.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }

        // Add error message
        const errorElement = document.createElement('span');
        errorElement.className = 'field-error';
        errorElement.textContent = message;
        errorElement.style.cssText = `
            display: block;
            color: #F44336;
            font-size: 1.2rem;
            margin-top: 5px;
            font-family: var(--fontFamily-dm_sans, sans-serif);
        `;

        field.parentElement.appendChild(errorElement);
    }

    /**
     * Clear field error
     * @param {HTMLElement} field - Form field element
     */
    clearFieldError(field) {
        field.classList.remove('error');
        const errorElement = field.parentElement.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
    }

    /**
     * Setup real-time validation for form
     * @param {HTMLFormElement} form - Form element
     */
    setupRealTimeValidation(form) {
        const fields = form.querySelectorAll('input, textarea, select');
        
        fields.forEach(field => {
            // Validate on blur
            field.addEventListener('blur', () => {
                let rule = 'required';
                if (field.type === 'email') rule = 'email';
                else if (field.type === 'tel' || field.name.includes('phone')) rule = 'phone';
                else if (field.type === 'password') rule = 'password';
                else if (field.name.includes('name') || field.name.includes('Name')) rule = 'name';
                else if (field.name.includes('address') || field.name.includes('Address')) rule = 'address';

                const validation = this.validateField(field, rule);
                if (!validation.valid) {
                    this.showFieldError(field, validation.message);
                } else {
                    this.clearFieldError(field);
                }
            });

            // Clear error on input
            field.addEventListener('input', () => {
                if (field.classList.contains('error')) {
                    this.clearFieldError(field);
                }
            });
        });
    }
}

// Export singleton instance
window.FormValidator = new FormValidator();

