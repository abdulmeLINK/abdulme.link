/**
 * Contact Application Component
 * 
 * Features:
 * - Contact form with real-time validation
 * - Auto-save drafts in localStorage
 * - Contact information cards
 * - Social media integration
 * - Success/error animations
 * 
 * @author AbdulmeLink Portfolio
 * @version 1.0.0
 */

import EventBus from '../EventBus.js';

export default class Contact {
    constructor(container) {
        this.container = container;
        this.contactInfo = null;
        this.formData = {
            name: '',
            email: '',
            subject: '',
            message: ''
        };
        this.validationErrors = {};
        this.isSubmitting = false;
        this.autoSaveTimer = null;
        
        this.init();
    }

    /**
     * Initialize contact component
     */
    async init() {
        try {
            this.setupContainer();
            this.loadDraft();
            await this.loadContactInfo();
            this.createLayout();
            this.setupEventListeners();
            this.loadSavedDraft();
            
            EventBus.emit('contact:ready');
            
        } catch (error) {
            console.error('Failed to initialize Contact:', error);
            this.showError('Failed to load contact form. Please try again.');
        }
    }

    /**
     * Setup container with loading state
     */
    setupContainer() {
        this.container.className = 'contact-app';
        this.container.innerHTML = `
            <div class="contact-loading">
                <div class="loading-spinner"></div>
                <p>Loading contact form...</p>
            </div>
        `;
    }

    /**
     * Load contact information from API
     */
    async loadContactInfo() {
        try {
            const response = await fetch('/api/contact');
            const result = await response.json();
            
            if (result.success) {
                this.contactInfo = result.data;
            } else {
                throw new Error(result.message || 'Failed to load contact info');
            }
        } catch (error) {
            console.error('Error loading contact info:', error);
            // Use default contact info
            this.contactInfo = {
                contact: {
                    email: 'hello@abdulme.link',
                    phone: '+90 555 123 4567',
                    location: 'Istanbul, Turkey',
                    responseTime: '24 hours'
                },
                social: {}
            };
        }
    }

    /**
     * Create main layout structure
     */
    createLayout() {
        this.container.innerHTML = `
            <div class="contact-container">
                <div class="contact-content">
                    <div class="contact-header">
                        <h1>Get In Touch</h1>
                        <p>Have a project in mind? Let's work together!</p>
                    </div>
                    
                    <div class="contact-grid">
                        <div class="contact-form-wrapper">
                            ${this.createContactForm()}
                        </div>
                        
                        <div class="contact-sidebar">
                            ${this.createContactCards()}
                            ${this.createSocialLinks()}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Create contact form
     */
    createContactForm() {
        return `
            <form class="contact-form" id="contactForm">
                <div class="form-group">
                    <label for="name" class="form-label">Name *</label>
                    <input 
                        type="text" 
                        id="name" 
                        name="name" 
                        class="form-input"
                        placeholder="Your full name"
                        value="${this.formData.name}"
                        required
                        minlength="2"
                    />
                    <span class="form-error" data-field="name"></span>
                </div>
                
                <div class="form-group">
                    <label for="email" class="form-label">Email *</label>
                    <input 
                        type="email" 
                        id="email" 
                        name="email" 
                        class="form-input"
                        placeholder="your.email@example.com"
                        value="${this.formData.email}"
                        required
                    />
                    <span class="form-error" data-field="email"></span>
                </div>
                
                <div class="form-group">
                    <label for="subject" class="form-label">Subject *</label>
                    <input 
                        type="text" 
                        id="subject" 
                        name="subject" 
                        class="form-input"
                        placeholder="What's this about?"
                        value="${this.formData.subject}"
                        required
                        minlength="5"
                    />
                    <span class="form-error" data-field="subject"></span>
                </div>
                
                <div class="form-group">
                    <label for="message" class="form-label">Message *</label>
                    <textarea 
                        id="message" 
                        name="message" 
                        class="form-textarea"
                        placeholder="Tell me about your project..."
                        rows="6"
                        required
                        minlength="20"
                        maxlength="1000"
                    >${this.formData.message}</textarea>
                    <div class="textarea-meta">
                        <span class="form-error" data-field="message"></span>
                        <span class="character-count">
                            <span class="current">0</span> / 1000
                        </span>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" id="clearBtn">
                        Clear
                    </button>
                    <button type="submit" class="btn btn-primary" id="submitBtn">
                        <span class="btn-text">Send Message</span>
                        <span class="btn-spinner" style="display: none;">
                            <span class="spinner"></span>
                            Sending...
                        </span>
                    </button>
                </div>
                
                <div class="form-notice">
                    <i class="icon-info"></i>
                    Your information is safe and will never be shared.
                </div>
            </form>
        `;
    }

    /**
     * Create contact information cards
     */
    createContactCards() {
        const contact = this.contactInfo.contact;
        
        return `
            <div class="contact-cards">
                <h3>Contact Information</h3>
                
                <div class="contact-card" data-action="copy-email">
                    <div class="card-icon">
                        <i class="icon-email"></i>
                    </div>
                    <div class="card-content">
                        <h4>Email</h4>
                        <p>${contact.email}</p>
                        <span class="card-action">Click to copy</span>
                    </div>
                </div>
                
                <div class="contact-card">
                    <div class="card-icon">
                        <i class="icon-phone"></i>
                    </div>
                    <div class="card-content">
                        <h4>Phone</h4>
                        <p>${contact.phone}</p>
                    </div>
                </div>
                
                <div class="contact-card">
                    <div class="card-icon">
                        <i class="icon-location"></i>
                    </div>
                    <div class="card-content">
                        <h4>Location</h4>
                        <p>${contact.location}</p>
                    </div>
                </div>
                
                <div class="contact-card">
                    <div class="card-icon">
                        <i class="icon-clock"></i>
                    </div>
                    <div class="card-content">
                        <h4>Response Time</h4>
                        <p>Usually within ${contact.responseTime}</p>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Create social media links
     */
    createSocialLinks() {
        const social = this.contactInfo.social;
        const platforms = [
            { key: 'github', name: 'GitHub', icon: 'github' },
            { key: 'linkedin', name: 'LinkedIn', icon: 'linkedin' },
            { key: 'twitter', name: 'Twitter', icon: 'twitter' },
            { key: 'dribbble', name: 'Dribbble', icon: 'dribbble' }
        ];
        
        return `
            <div class="social-section">
                <h3>Connect With Me</h3>
                <div class="social-links">
                    ${platforms.map(platform => {
                        if (!social[platform.key]) return '';
                        return `
                            <a href="${social[platform.key]}" 
                               class="social-link social-${platform.key}" 
                               target="_blank" 
                               rel="noopener noreferrer"
                               title="${platform.name}">
                                <i class="icon-${platform.icon}"></i>
                                <span>${platform.name}</span>
                            </a>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        const form = this.container.querySelector('#contactForm');
        const clearBtn = this.container.querySelector('#clearBtn');
        const inputs = this.container.querySelectorAll('.form-input, .form-textarea');
        const messageInput = this.container.querySelector('#message');
        
        // Form submission
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }
        
        // Clear button
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearForm());
        }
        
        // Real-time validation and auto-save
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.handleInputChange(input);
                this.scheduleAutoSave();
            });
            
            input.addEventListener('blur', () => {
                this.validateField(input.name);
            });
        });
        
        // Character count for message
        if (messageInput) {
            messageInput.addEventListener('input', () => {
                this.updateCharacterCount();
            });
            this.updateCharacterCount();
        }
        
        // Copy email functionality
        const copyEmailCard = this.container.querySelector('[data-action="copy-email"]');
        if (copyEmailCard) {
            copyEmailCard.addEventListener('click', () => this.copyEmail());
        }
    }

    /**
     * Handle input change
     */
    handleInputChange(input) {
        this.formData[input.name] = input.value;
        
        // Clear error when user starts typing
        if (this.validationErrors[input.name]) {
            delete this.validationErrors[input.name];
            this.clearFieldError(input.name);
        }
    }

    /**
     * Validate single field
     */
    validateField(fieldName) {
        const value = this.formData[fieldName] || '';
        const rules = {
            name: { min: 2, message: 'Name must be at least 2 characters' },
            email: { 
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, 
                message: 'Please enter a valid email address' 
            },
            subject: { min: 5, message: 'Subject must be at least 5 characters' },
            message: { min: 20, message: 'Message must be at least 20 characters' }
        };
        
        const rule = rules[fieldName];
        if (!rule) return true;
        
        let isValid = true;
        let error = '';
        
        if (!value.trim()) {
            isValid = false;
            error = `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
        } else if (rule.min && value.length < rule.min) {
            isValid = false;
            error = rule.message;
        } else if (rule.pattern && !rule.pattern.test(value)) {
            isValid = false;
            error = rule.message;
        }
        
        if (!isValid) {
            this.validationErrors[fieldName] = error;
            this.showFieldError(fieldName, error);
        } else {
            delete this.validationErrors[fieldName];
            this.clearFieldError(fieldName);
        }
        
        return isValid;
    }

    /**
     * Show field error
     */
    showFieldError(fieldName, message) {
        const errorElement = this.container.querySelector(`[data-field="${fieldName}"]`);
        const inputElement = this.container.querySelector(`[name="${fieldName}"]`);
        
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
        
        if (inputElement) {
            inputElement.classList.add('error');
        }
    }

    /**
     * Clear field error
     */
    clearFieldError(fieldName) {
        const errorElement = this.container.querySelector(`[data-field="${fieldName}"]`);
        const inputElement = this.container.querySelector(`[name="${fieldName}"]`);
        
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
        
        if (inputElement) {
            inputElement.classList.remove('error');
        }
    }

    /**
     * Update character count
     */
    updateCharacterCount() {
        const messageInput = this.container.querySelector('#message');
        const countElement = this.container.querySelector('.character-count .current');
        
        if (messageInput && countElement) {
            const length = messageInput.value.length;
            countElement.textContent = length;
            
            if (length > 1000) {
                countElement.parentElement.classList.add('over-limit');
            } else {
                countElement.parentElement.classList.remove('over-limit');
            }
        }
    }

    /**
     * Handle form submission
     */
    async handleSubmit(e) {
        e.preventDefault();
        
        if (this.isSubmitting) return;
        
        // Validate all fields
        const fields = ['name', 'email', 'subject', 'message'];
        let isValid = true;
        
        fields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });
        
        if (!isValid) {
            this.showNotification('Please fix the errors before submitting', 'error');
            return;
        }
        
        this.isSubmitting = true;
        this.updateSubmitButton(true);
        
        try {
            const response = await fetch('/api/contact/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(this.formData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showSuccess(result.message);
                this.clearForm();
                this.clearDraft();
                EventBus.emit('contact:submitted', this.formData);
            } else {
                this.showNotification(result.message || 'Failed to send message', 'error');
            }
            
        } catch (error) {
            console.error('Form submission error:', error);
            this.showNotification('Failed to send message. Please try again.', 'error');
        } finally {
            this.isSubmitting = false;
            this.updateSubmitButton(false);
        }
    }

    /**
     * Update submit button state
     */
    updateSubmitButton(isLoading) {
        const submitBtn = this.container.querySelector('#submitBtn');
        const btnText = submitBtn?.querySelector('.btn-text');
        const btnSpinner = submitBtn?.querySelector('.btn-spinner');
        
        if (submitBtn) {
            submitBtn.disabled = isLoading;
            
            if (btnText) btnText.style.display = isLoading ? 'none' : 'inline';
            if (btnSpinner) btnSpinner.style.display = isLoading ? 'inline-flex' : 'none';
        }
    }

    /**
     * Clear form
     */
    clearForm() {
        this.formData = {
            name: '',
            email: '',
            subject: '',
            message: ''
        };
        
        const form = this.container.querySelector('#contactForm');
        if (form) {
            form.reset();
        }
        
        this.validationErrors = {};
        this.updateCharacterCount();
        this.clearDraft();
    }

    /**
     * Copy email to clipboard
     */
    async copyEmail() {
        const email = this.contactInfo.contact.email;
        
        try {
            await navigator.clipboard.writeText(email);
            this.showNotification('Email copied to clipboard!', 'success');
            EventBus.emit('contact:emailCopied', { email });
        } catch (error) {
            console.error('Failed to copy email:', error);
            this.showNotification('Failed to copy email', 'error');
        }
    }

    /**
     * Load draft from localStorage
     */
    loadDraft() {
        try {
            const draft = localStorage.getItem('contact_draft');
            if (draft) {
                const parsed = JSON.parse(draft);
                this.formData = { ...this.formData, ...parsed };
            }
        } catch (error) {
            console.error('Failed to load draft:', error);
        }
    }

    /**
     * Load saved draft into form fields
     */
    loadSavedDraft() {
        Object.keys(this.formData).forEach(key => {
            const input = this.container.querySelector(`[name="${key}"]`);
            if (input && this.formData[key]) {
                input.value = this.formData[key];
            }
        });
        
        this.updateCharacterCount();
    }

    /**
     * Schedule auto-save
     */
    scheduleAutoSave() {
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
        }
        
        this.autoSaveTimer = setTimeout(() => {
            this.saveDraft();
        }, 1000);
    }

    /**
     * Save draft to localStorage
     */
    saveDraft() {
        try {
            localStorage.setItem('contact_draft', JSON.stringify(this.formData));
        } catch (error) {
            console.error('Failed to save draft:', error);
        }
    }

    /**
     * Clear draft from localStorage
     */
    clearDraft() {
        try {
            localStorage.removeItem('contact_draft');
        } catch (error) {
            console.error('Failed to clear draft:', error);
        }
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'form-success-message';
        successDiv.innerHTML = `
            <div class="success-icon">✓</div>
            <h3>Message Sent!</h3>
            <p>${message}</p>
        `;
        
        const formWrapper = this.container.querySelector('.contact-form-wrapper');
        if (formWrapper) {
            formWrapper.innerHTML = '';
            formWrapper.appendChild(successDiv);
            
            // Reset form after 5 seconds
            setTimeout(() => {
                this.createLayout();
                this.setupEventListeners();
            }, 5000);
        }
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `contact-notification notification-${type}`;
        notification.textContent = message;
        
        this.container.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    /**
     * Show error state
     */
    showError(message) {
        this.container.innerHTML = `
            <div class="contact-error">
                <div class="error-icon">⚠️</div>
                <h3>Oops! Something went wrong</h3>
                <p>${message}</p>
                <button class="btn-retry" onclick="location.reload()">Retry</button>
            </div>
        `;
    }

    /**
     * Cleanup and destroy component
     */
    destroy() {
        // Save draft before destroying
        if (Object.values(this.formData).some(v => v)) {
            this.saveDraft();
        }
        
        // Clear timers
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
        }
        
        // Clear container
        this.container.innerHTML = '';
        
        EventBus.emit('contact:destroyed');
    }
}
