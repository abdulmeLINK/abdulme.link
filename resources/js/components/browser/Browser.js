/**
 * Browser - Simple LinkOS Safari-style web browser
 * Opens external links in an iframe window
 */

import EventBus from '../EventBus.js';

class Browser {
    constructor() {
        this.container = null;
        this.currentUrl = 'about:blank';
        this.history = ['about:blank'];
        this.historyIndex = 0;
        this.isLoading = false;
        this.canGoBack = false;
        this.canGoForward = false;
        this.showStartPage = true;
    }

    /**
     * Initialize Browser
     */
    async init(container) {
        this.container = container;
        console.log('🌐 Browser: Initializing...');

        try {
            this.render();
            this.setupEventListeners();
            
            console.log('🌐 Browser: Initialized successfully');
            EventBus.emit('browser:ready');
        } catch (error) {
            console.error('Browser: Initialization failed', error);
            this.renderError(error);
        }
    }

    /**
     * Render Browser UI
     */
    render() {
        const html = `
            <div class="browser-container">
                <div class="browser-window">
                    ${this.renderToolbar()}
                    ${this.renderContent()}
                </div>
            </div>
        `;
        this.container.innerHTML = html;
        this.updateNavigationState();
    }

    /**
     * Render toolbar with navigation controls
     */
    renderToolbar() {
        return `
            <div class="browser-toolbar">
                <div class="browser-nav-buttons">
                    <button class="browser-btn browser-btn-back" ${!this.canGoBack ? 'disabled' : ''} data-action="back" title="Back">
                        <span>◀</span>
                    </button>
                    <button class="browser-btn browser-btn-forward" ${!this.canGoForward ? 'disabled' : ''} data-action="forward" title="Forward">
                        <span>▶</span>
                    </button>
                    <button class="browser-btn browser-btn-reload" data-action="reload" title="Reload">
                        <span>${this.isLoading ? '✕' : '↻'}</span>
                    </button>
                </div>
                
                <div class="browser-address-bar">
                    <span class="address-bar-icon">🔒</span>
                    <input 
                        type="text" 
                        class="address-bar-input" 
                        value="${this.currentUrl}" 
                        placeholder="Search or enter website"
                        spellcheck="false"
                    />
                </div>
                
                <div class="browser-actions">
                    <button class="browser-btn" data-action="home" title="Home">
                        <span>🏠</span>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Render content area with iframe
     */
    renderContent() {
        if (this.showStartPage) {
            return this.renderStartPage();
        }

        return `
            <div class="browser-content">
                <iframe 
                    class="browser-iframe" 
                    src="${this.currentUrl}"
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-popups-to-escape-sandbox"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    frameborder="0"
                ></iframe>
                <div class="browser-loading ${this.isLoading ? 'active' : ''}">
                    <div class="loading-bar"></div>
                </div>
            </div>
        `;
    }

    /**
     * Render start page (shown by default)
     */
    renderStartPage() {
        return `
            <div class="browser-content browser-start-page">
                <div class="start-page-container">
                    <div class="start-page-logo">🌐</div>
                    <h1 class="start-page-title">Welcome to Browser</h1>
                    <p class="start-page-subtitle">Enter a URL or search term to get started</p>
                    
                    <div class="start-page-suggestions">
                        <div class="suggestion-category">
                            <h3>Quick Links</h3>
                            <div class="suggestion-grid">
                                <button class="suggestion-item" data-url="https://www.bing.com">
                                    <span class="suggestion-icon">🔍</span>
                                    <span class="suggestion-label">Bing Search</span>
                                </button>
                                <button class="suggestion-item" data-url="https://www.wikipedia.org">
                                    <span class="suggestion-icon">📚</span>
                                    <span class="suggestion-label">Wikipedia</span>
                                </button>
                                <button class="suggestion-item" data-url="https://github.com">
                                    <span class="suggestion-icon">💻</span>
                                    <span class="suggestion-label">GitHub</span>
                                </button>
                                <button class="suggestion-item" data-url="https://www.youtube.com">
                                    <span class="suggestion-icon">📺</span>
                                    <span class="suggestion-label">YouTube</span>
                                </button>
                            </div>
                        </div>
                        
                        <div class="start-page-note">
                            💡 <strong>Note:</strong> Some websites (like Google) block iframe embedding for security. 
                            Try using alternatives like Bing or DuckDuckGo for search.
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Navigation buttons
        this.container.addEventListener('click', (e) => {
            const action = e.target.closest('[data-action]')?.dataset.action;
            if (action === 'back') this.goBack();
            if (action === 'forward') this.goForward();
            if (action === 'reload') this.reload();
            if (action === 'home') this.goHome();
        });

        // Start page suggestions
        this.container.addEventListener('click', (e) => {
            const suggestionItem = e.target.closest('.suggestion-item');
            if (suggestionItem) {
                const url = suggestionItem.dataset.url;
                if (url) {
                    this.navigateTo(url);
                }
            }
        });

        // Address bar
        const addressInput = this.container.querySelector('.address-bar-input');
        if (addressInput) {
            addressInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.navigateTo(e.target.value);
                }
            });

            addressInput.addEventListener('focus', (e) => {
                e.target.select();
            });
        }

        // Iframe load events
        const iframe = this.container.querySelector('.browser-iframe');
        if (iframe) {
            // Note: Load and error detection now handled in detectIframeBlocking()
            // which is called from navigateTo()
        }

        // EventBus listeners
        EventBus.on('browser:navigate', (data) => {
            if (data.url) this.navigateTo(data.url);
        });
    }

    /**
     * Navigate to URL
     */
    navigateTo(url) {
        // Handle empty or just whitespace
        if (!url || !url.trim()) {
            return;
        }

        // Validate and format URL
        url = this.formatUrl(url);

        // Check for self-referential URLs
        if (this.isSelfReferential(url)) {
            this.showSelfReferentialAlert();
            return;
        }

        // Hide start page
        this.showStartPage = false;

        // Update history
        if (this.history[this.historyIndex] !== url) {
            this.history = this.history.slice(0, this.historyIndex + 1);
            this.history.push(url);
            this.historyIndex = this.history.length - 1;
        }

        this.currentUrl = url;
        this.isLoading = true;
        
        // Re-render to show iframe
        this.render();
        this.setupEventListeners();

        // Update iframe src
        const iframe = this.container.querySelector('.browser-iframe');
        if (iframe) {
            iframe.src = url;
            
            // Simple load handler
            iframe.addEventListener('load', () => {
                this.isLoading = false;
                this.updateLoadingState();
            }, { once: true });
        }

        EventBus.emit('browser:navigated', { url });
        console.log('🌐 Browser: Navigated to', url);
    }

    /**
     * Format URL (add https:// if missing)
     */
    formatUrl(url) {
        url = url.trim();
        
        // If it looks like a search query, use Bing (Google blocks iframes)
        if (!url.includes('.') || url.includes(' ')) {
            return `https://www.bing.com/search?q=${encodeURIComponent(url)}`;
        }

        // Add protocol if missing
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        return url;
    }

    /**
     * Check if URL is self-referential
     */
    isSelfReferential(url) {
        const selfUrls = [
            'abdulme.link',
            'localhost',
            '127.0.0.1',
            window.location.hostname
        ];

        return selfUrls.some(domain => url.toLowerCase().includes(domain));
    }

    /**
     * Show LinkOS-style alert for self-referential URLs
     */
    showSelfReferentialAlert() {
        const alertHtml = `
            <div class="LinkOS-alert-overlay">
                <div class="LinkOS-alert">
                    <div class="LinkOS-alert-icon">⚠️</div>
                    <div class="LinkOS-alert-content">
                        <h3 class="LinkOS-alert-title">Nice Try! 😄</h3>
                        <p class="LinkOS-alert-message">
                            You're already here! No need to open this website in a browser within itself. 
                            That would create a paradox and the universe might implode! 🌌
                        </p>
                    </div>
                    <div class="LinkOS-alert-buttons">
                        <button class="LinkOS-alert-btn LinkOS-alert-btn-primary" data-alert-action="ok">
                            OK
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add alert to body
        const alertElement = document.createElement('div');
        alertElement.innerHTML = alertHtml;
        document.body.appendChild(alertElement.firstElementChild);

        // Add event listener for OK button
        const okButton = document.querySelector('[data-alert-action="ok"]');
        if (okButton) {
            okButton.addEventListener('click', () => {
                const overlay = document.querySelector('.LinkOS-alert-overlay');
                if (overlay) {
                    overlay.style.animation = 'fadeOut 0.2s ease-out';
                    setTimeout(() => overlay.remove(), 200);
                }
            });
        }

        // Close on overlay click
        const overlay = document.querySelector('.LinkOS-alert-overlay');
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.style.animation = 'fadeOut 0.2s ease-out';
                    setTimeout(() => overlay.remove(), 200);
                }
            });
        }
    }

    /**
     * Go back in history
     */
    goBack() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.currentUrl = this.history[this.historyIndex];
            
            const iframe = this.container.querySelector('.browser-iframe');
            if (iframe) {
                iframe.src = this.currentUrl;
            }
            
            this.updateNavigationState();
            this.updateAddressBar();
        }
    }

    /**
     * Go forward in history
     */
    goForward() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.currentUrl = this.history[this.historyIndex];
            
            const iframe = this.container.querySelector('.browser-iframe');
            if (iframe) {
                iframe.src = this.currentUrl;
            }
            
            this.updateNavigationState();
            this.updateAddressBar();
        }
    }

    /**
     * Reload current page
     */
    reload() {
        if (this.isLoading) {
            // Stop loading
            const iframe = this.container.querySelector('.browser-iframe');
            if (iframe) {
                iframe.src = 'about:blank';
                setTimeout(() => {
                    iframe.src = this.currentUrl;
                }, 10);
            }
        } else {
            // Reload
            const iframe = this.container.querySelector('.browser-iframe');
            if (iframe) {
                iframe.src = iframe.src;
            }
        }
    }

    /**
     * Go to home page (Start page)
     */
    goHome() {
        this.showStartPage = true;
        this.currentUrl = 'about:blank';
        this.render();
        this.setupEventListeners();
    }

    /**
     * Update navigation button states
     */
    updateNavigationState() {
        this.canGoBack = this.historyIndex > 0;
        this.canGoForward = this.historyIndex < this.history.length - 1;

        const backBtn = this.container.querySelector('.browser-btn-back');
        const forwardBtn = this.container.querySelector('.browser-btn-forward');

        if (backBtn) {
            backBtn.disabled = !this.canGoBack;
        }
        if (forwardBtn) {
            forwardBtn.disabled = !this.canGoForward;
        }
    }

    /**
     * Update address bar value
     */
    updateAddressBar() {
        const addressInput = this.container.querySelector('.address-bar-input');
        if (addressInput) {
            addressInput.value = this.currentUrl;
        }
    }

    /**
     * Update loading state
     */
    updateLoadingState() {
        const loadingBar = this.container.querySelector('.browser-loading');
        const reloadBtn = this.container.querySelector('.browser-btn-reload span');

        if (loadingBar) {
            if (this.isLoading) {
                loadingBar.classList.add('active');
            } else {
                loadingBar.classList.remove('active');
            }
        }

        if (reloadBtn) {
            reloadBtn.textContent = this.isLoading ? '✕' : '↻';
        }
    }

    /**
     * Render error
     */
    renderError(error) {
        this.container.innerHTML = `
            <div class="browser-error">
                <h3>Failed to load Browser</h3>
                <p>${error.message}</p>
            </div>
        `;
    }

    /**
     * Destroy component
     */
    destroy() {
        EventBus.off('browser:navigate');
        this.container = null;
        console.log('🌐 Browser: Destroyed');
    }
}

export default Browser;
