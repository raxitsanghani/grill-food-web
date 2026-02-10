/**
 * Progress Indicator Component
 * Provides step-by-step progress visualization for multi-step forms
 */

class ProgressIndicator {
    constructor(containerId, steps = []) {
        this.containerId = containerId;
        this.steps = steps;
        this.currentStep = 0;
        this.container = null;
        this.init();
    }

    init() {
        this.container = document.getElementById(this.containerId);
        if (!this.container) {
            console.warn(`Container with ID "${this.containerId}" not found`);
            return;
        }
        this.render();
    }

    /**
     * Render progress indicator
     */
    render() {
        if (!this.container) return;

        const progressHTML = `
            <div class="progress-indicator" role="progressbar" aria-valuenow="${this.currentStep + 1}" aria-valuemin="1" aria-valuemax="${this.steps.length}">
                <div class="progress-steps">
                    ${this.steps.map((step, index) => `
                        <div class="progress-step ${index <= this.currentStep ? 'completed' : ''} ${index === this.currentStep ? 'active' : ''}" 
                             data-step="${index}">
                            <div class="progress-step-circle">
                                ${index < this.currentStep ? '✓' : index + 1}
                            </div>
                            <div class="progress-step-label">${step}</div>
                            ${index < this.steps.length - 1 ? '<div class="progress-step-line"></div>' : ''}
                        </div>
                    `).join('')}
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar-fill" style="width: ${((this.currentStep + 1) / this.steps.length) * 100}%"></div>
                </div>
            </div>
        `;

        this.container.innerHTML = progressHTML;
        this.updateAriaLabels();
    }

    /**
     * Go to next step
     */
    next() {
        if (this.currentStep < this.steps.length - 1) {
            this.currentStep++;
            this.render();
            AccessibilityManager.announce(`Step ${this.currentStep + 1} of ${this.steps.length}: ${this.steps[this.currentStep]}`, 'polite');
        }
    }

    /**
     * Go to previous step
     */
    previous() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.render();
            AccessibilityManager.announce(`Step ${this.currentStep + 1} of ${this.steps.length}: ${this.steps[this.currentStep]}`, 'polite');
        }
    }

    /**
     * Go to specific step
     */
    goToStep(stepIndex) {
        if (stepIndex >= 0 && stepIndex < this.steps.length) {
            this.currentStep = stepIndex;
            this.render();
            AccessibilityManager.announce(`Step ${this.currentStep + 1} of ${this.steps.length}: ${this.steps[this.currentStep]}`, 'polite');
        }
    }

    /**
     * Get current step
     */
    getCurrentStep() {
        return this.currentStep;
    }

    /**
     * Check if step is completed
     */
    isStepCompleted(stepIndex) {
        return stepIndex < this.currentStep;
    }

    /**
     * Update ARIA labels
     */
    updateAriaLabels() {
        const progressbar = this.container.querySelector('.progress-indicator');
        if (progressbar) {
            progressbar.setAttribute('aria-valuenow', this.currentStep + 1);
            progressbar.setAttribute('aria-label', `Progress: Step ${this.currentStep + 1} of ${this.steps.length}`);
        }
    }

    /**
     * Reset progress
     */
    reset() {
        this.currentStep = 0;
        this.render();
    }
}

// CSS for progress indicator
const progressIndicatorStyles = `
.progress-indicator {
    margin-bottom: 30px;
}

.progress-steps {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;
    position: relative;
}

.progress-step {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
    position: relative;
}

.progress-step-circle {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--eerie-black-2, #1d1d1d);
    border: 2px solid var(--eerie-black-3, #141414);
    color: var(--quick-silver, #a6a6a6);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: var(--weight-bold, 700);
    font-size: 1.6rem;
    transition: all 0.3s ease;
    z-index: 2;
}

.progress-step.active .progress-step-circle {
    background: var(--gold-crayola, #ffd700);
    border-color: var(--gold-crayola, #ffd700);
    color: var(--smoky-black-1, #000);
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.4);
    transform: scale(1.1);
}

.progress-step.completed .progress-step-circle {
    background: #4caf50;
    border-color: #4caf50;
    color: white;
}

.progress-step-label {
    margin-top: 8px;
    font-size: 1.2rem;
    color: var(--quick-silver, #a6a6a6);
    text-align: center;
    transition: color 0.3s ease;
}

.progress-step.active .progress-step-label {
    color: var(--gold-crayola, #ffd700);
    font-weight: var(--weight-bold, 700);
}

.progress-step.completed .progress-step-label {
    color: #4caf50;
}

.progress-step-line {
    position: absolute;
    top: 20px;
    left: calc(50% + 20px);
    right: calc(-50% + 20px);
    height: 2px;
    background: var(--eerie-black-3, #141414);
    z-index: 1;
}

.progress-step.completed + .progress-step .progress-step-line,
.progress-step.active ~ .progress-step .progress-step-line {
    background: var(--eerie-black-3, #141414);
}

.progress-step.completed .progress-step-line {
    background: #4caf50;
}

.progress-bar-container {
    width: 100%;
    height: 4px;
    background: var(--eerie-black-3, #141414);
    border-radius: 2px;
    overflow: hidden;
    margin-top: 10px;
}

.progress-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--gold-crayola, #ffd700), #ffed4e);
    border-radius: 2px;
    transition: width 0.3s ease;
    position: relative;
    overflow: hidden;
}

.progress-bar-fill::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.3),
        transparent
    );
    animation: progress-shimmer 1.5s infinite;
}

@keyframes progress-shimmer {
    0% {
        transform: translateX(-100%);
    }
    100% {
        transform: translateX(100%);
    }
}

/* Responsive */
@media (max-width: 768px) {
    .progress-step-circle {
        width: 32px;
        height: 32px;
        font-size: 1.4rem;
    }
    
    .progress-step-label {
        font-size: 1rem;
    }
    
    .progress-steps {
        margin-bottom: 15px;
    }
}
`;

// Inject styles
if (!document.getElementById('progress-indicator-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'progress-indicator-styles';
    styleSheet.textContent = progressIndicatorStyles;
    document.head.appendChild(styleSheet);
}

// Export
window.ProgressIndicator = ProgressIndicator;

