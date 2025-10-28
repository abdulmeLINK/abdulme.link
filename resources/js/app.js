import ThemeService from './services/ThemeService.js';
import Desktop from './components/LinkOS/Desktop.js';
import Dock from './components/LinkOS/Dock.js';
import WindowManager from './components/LinkOS/WindowManager.js';
import Terminal from './components/terminal/Terminal.js';
import Portfolio from './components/portfolio/Portfolio.js';
import About from './components/about/About.js';
import Contact from './components/contact/Contact.js';
import Finder from './components/finder/Finder.js';
import Browser from './components/browser/Browser.js';
import PreferencesIntegration from './components/preferences/PreferencesIntegration.js';
import EventBus from './components/EventBus.js';

/**
 * AbdulmeLink Portfolio - LinkOS Desktop Experience
 * Main application entry point
 */
class App {
    constructor() {
        this.themeService = ThemeService; // Singleton
        this.desktop = null;
        this.dock = null;
        this.windowManager = null;
        this.preferencesIntegration = null;
        this.isInitialized = false;
        this.components = new Map();
        
        this.init();
    }

    /**
     * Initialize application
     */
    async init() {
        try {
            console.log('🚀 Initializing AbdulmeLink Portfolio...');
            
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.start());
            } else {
                await this.start();
            }
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.handleError(error);
        }
    }

    /**
     * Start application
     */
    async start() {
        try {
            // Setup global error handling
            this.setupErrorHandling();
            
            // Setup performance monitoring
            this.setupPerformanceMonitoring();
            
            // Initialize EventBus
            this.setupEventBus();
            
            // Initialize Desktop (CRITICAL PRIORITY - Phase 2)
            this.desktop = new Desktop();
            this.components.set('desktop', this.desktop);
            
            // Expose Desktop globally for debugging
            window.DesktopInstance = this.desktop;
            window.testWallpaperPersistence = () => this.desktop.testWallpaperPersistence();
            window.simulateNewUser = () => this.desktop.simulateNewUser();
            window.testRandomAssignment = () => this.desktop.testRandomAssignment();
            
            // Wait for desktop to be ready before loading other components
            EventBus.once('desktop:ready', () => {
                console.log('✅ Desktop initialized successfully');
                console.log('🔧 Debug helpers:');
                console.log('  - window.testWallpaperPersistence() - Test persistence system');
                console.log('  - window.simulateNewUser() - Clear data to test new user experience');
                console.log('  - window.testRandomAssignment() - Test random wallpaper assignment');
                this.loadAdditionalComponents();
            });
            
            this.isInitialized = true;
            console.log('✅ App initialization complete');
            
        } catch (error) {
            console.error('Failed to start app:', error);
            this.handleError(error);
        }
    }

    /**
     * Load additional components after desktop is ready
     */
    async loadAdditionalComponents() {
        try {
            console.log('📋 Loading Phase 2 components...');
            
            // Initialize Preferences Integration (Phase 6)
            console.log('⚙️ Initializing Preferences Integration...');
            this.preferencesIntegration = new PreferencesIntegration();
            this.components.set('preferencesIntegration', this.preferencesIntegration);
            console.log('✅ Preferences Integration initialized');
            
            // Phase 2 components (CRITICAL PRIORITY):
            
            // Initialize Dock (CRITICAL)
            console.log('🎪 Initializing Dock component...');
            this.dock = new Dock();
            this.components.set('dock', this.dock);
            
            // Wait for dock to be ready
            EventBus.once('dock:ready', () => {
                console.log('✅ Dock initialized successfully');
                
                // Initialize Window Manager (CRITICAL)
                console.log('🪟 Initializing Window Manager...');
                this.windowManager = new WindowManager();
                this.components.set('windowManager', this.windowManager);
                
                console.log('✅ Window Manager initialized successfully');
                console.log('🔧 Window Debug helpers:');
                console.log('  - window.WindowManager = this.windowManager');
                console.log('  - window.createTestWindow() - Create test window');
                
                // Expose Window Manager globally for debugging
                window.WindowManager = this.windowManager;
                window.createTestWindow = () => this.createTestWindow();
                window.createTerminalWindow = () => this.createTerminalWindow();
                
                // Setup app launch handlers
                this.setupAppLaunchers();
                
                // Future Phase 2 components:
                // - Window Manager (HIGH)
            });
            
            // Phase 3 components (will be added later):
            // - Terminal (HIGH)
            
            // Phase 4 components (will be added later):
            // - Portfolio (HIGH)
            // - About (MEDIUM)
            // - Contact (MEDIUM)
            
        } catch (error) {
            console.error('Failed to load additional components:', error);
        }
    }

    /**
     * Setup EventBus global event handling
     */
    setupEventBus() {
        // Enable debug mode in development
        if (window.location.hostname === 'localhost' || window.location.search.includes('debug=true')) {
            EventBus.setDebugMode(true);
        }

        // Global error events
        EventBus.on('desktop:error', this.onDesktopError.bind(this));
        
        // Performance events
        EventBus.on('performance:warning', this.onPerformanceWarning.bind(this));
        
        // File viewer events
        EventBus.on('file:open', this.openFileViewer.bind(this));
        
        // Notification events
        EventBus.on('notification:show', this.showNotification.bind(this));
        
        console.log('📡 EventBus configured');
    }

    /**
     * Setup global error handling
     */
    setupErrorHandling() {
        // Uncaught JavaScript errors
        window.addEventListener('error', (event) => {
            console.error('Uncaught error:', event.error);
            EventBus.emit('app:error', { 
                type: 'javascript', 
                error: event.error,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });

        // Unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            EventBus.emit('app:error', { 
                type: 'promise', 
                error: event.reason 
            });
        });

        // Resource loading errors
        window.addEventListener('error', (event) => {
            if (event.target !== window) {
                console.warn('Resource loading error:', event.target.src || event.target.href);
                EventBus.emit('app:resource-error', { 
                    type: 'resource',
                    element: event.target,
                    src: event.target.src || event.target.href
                });
            }
        }, true);
    }

    /**
     * Setup performance monitoring
     */
    setupPerformanceMonitoring() {
        // Monitor FPS
        let fps = 0;
        let lastTime = performance.now();
        let frameCount = 0;

        const measureFPS = (currentTime) => {
            frameCount++;
            
            if (currentTime - lastTime >= 1000) {
                fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
                
                // Warn if FPS drops below targets
                const isMobile = /Mobi|Android/i.test(navigator.userAgent);
                const targetFPS = isMobile ? 30 : 60;
                
                if (fps < targetFPS * 0.8) { // 80% of target
                    EventBus.emit('performance:warning', {
                        type: 'fps',
                        current: fps,
                        target: targetFPS,
                        severity: fps < targetFPS * 0.5 ? 'high' : 'medium'
                    });
                }
                
                lastTime = currentTime;
                frameCount = 0;
            }
            
            requestAnimationFrame(measureFPS);
        };

        requestAnimationFrame(measureFPS);

        // Monitor memory usage (if available)
        if (performance.memory) {
            setInterval(() => {
                const memInfo = performance.memory;
                const usedMB = Math.round(memInfo.usedJSHeapSize / 1024 / 1024);
                
                // Warn if memory usage exceeds 100MB
                if (usedMB > 100) {
                    EventBus.emit('performance:warning', {
                        type: 'memory',
                        usedMB,
                        limitMB: 100,
                        severity: usedMB > 150 ? 'high' : 'medium'
                    });
                }
            }, 30000); // Check every 30 seconds
        }
    }

    /**
     * Handle desktop errors
     */
    onDesktopError(data) {
        console.error('Desktop error:', data);
        
        // Show fallback UI if desktop fails critically
        if (data.error && data.error.includes('initialization')) {
            this.showFallbackUI();
        }
    }

    /**
     * Handle performance warnings
     */
    onPerformanceWarning(data) {
        console.warn('Performance warning:', data);
        
        // Automatically reduce quality for severe performance issues
        if (data.severity === 'high') {
            EventBus.emit('app:reduce-quality', data);
        }
    }

    /**
     * Show notification
     */
    showNotification(data) {
        const { title, message, type = 'info', duration = 3000 } = data;
        
        // Format message with proper line breaks
        const formattedMessage = message ? message.replace(/\n/g, '<br>') : '';
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `LinkOS-notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-title">${title || 'Notification'}</div>
                ${formattedMessage ? `<div class="notification-message">${formattedMessage}</div>` : ''}
            </div>
        `;
        
        // Add styles with LinkOS authenticity
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            minWidth: '320px',
            maxWidth: '420px',
            padding: '16px 20px',
            background: 'rgba(28, 28, 30, 0.85)',
            border: '0.5px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '10px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 0.5px rgba(255, 255, 255, 0.05) inset',
            zIndex: '10000',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
            fontSize: '13px',
            color: 'var(--text-primary)',
            animation: 'slideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            cursor: 'pointer'
        });
        
        // Click to dismiss
        notification.addEventListener('click', () => {
            notification.style.animation = 'slideOut 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            setTimeout(() => notification.remove(), 300);
        });
        
        // Add to DOM
        document.body.appendChild(notification);
        
        // Auto-remove after duration
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            setTimeout(() => notification.remove(), 300);
        }, duration);
        
        console.log('📢 Notification shown:', title, message);
    }

    /**
     * Show fallback UI for critical errors
     */
    showFallbackUI() {
        const fallbackHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: linear-gradient(135deg, #000 0%, #1a1a1a 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                z-index: 99999;
            ">
                <div style="text-align: center; max-width: 400px; padding: 2rem;">
                    <h1 style="font-size: 2rem; margin-bottom: 1rem;">⚠️ Loading Error</h1>
                    <p style="margin-bottom: 2rem; opacity: 0.8;">
                        The desktop experience failed to load properly. Please refresh the page or try again later.
                    </p>
                    <button onclick="window.location.reload()" style="
                        background: #007AFF;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 8px;
                        font-size: 16px;
                        cursor: pointer;
                    ">
                        Refresh Page
                    </button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', fallbackHTML);
    }

    /**
     * Handle critical application errors
     */
    handleError(error) {
        console.error('Critical app error:', error);
        
        // Try to recover or show fallback
        if (!this.isInitialized) {
            this.showFallbackUI();
        }
    }

    /**
     * Setup app launcher handlers
     */
    setupAppLaunchers() {
        EventBus.on('app:launch', (data) => {
            console.log('App launch requested:', data);
            
            // Handle document type by converting to file:open event
            if (data.type === 'document') {
                const fileName = data.filePath ? data.filePath.split('/').pop() : data.name + '.pdf';
                EventBus.emit('file:open', {
                    path: data.filePath || `/documents/${fileName}`,
                    name: data.name || fileName,
                    content: '', // PDF content loaded by iframe
                    size: 0,
                    modified: new Date().toISOString(),
                    type: data.fileType || 'pdf'
                });
                return;
            }
            
            switch (data.appId) {
                case 'finder':
                    this.createFinderWindow();
                    break;
                case 'terminal':
                    this.createTerminalWindow();
                    break;
                case 'portfolio':
                    this.createPortfolioWindow();
                    break;
                case 'about':
                    this.createAboutWindow();
                    break;
                case 'contact':
                    this.createContactWindow();
                    break;
                case 'preferences':
                    this.createPreferencesWindow(data.initialPane);
                    break;
                case 'browser':
                    this.createBrowserWindow(data.url);
                    break;
                default:
                    console.warn('Unknown app:', data.appId);
                    break;
            }
        });
    }

    /**
     * Create Finder window
     */
    createFinderWindow() {
        if (!this.windowManager) {
            console.warn('WindowManager not initialized yet');
            return;
        }
        
        // Check if Finder window already exists
        const existingWindows = this.windowManager.getWindowsByApp('finder');
        if (existingWindows.length > 0) {
            const firstWindow = existingWindows[0];
            if (firstWindow.isMinimized) {
                firstWindow.restore();
            } else {
                this.windowManager.focusWindow(firstWindow.id);
            }
            return;
        }
        
        // Create finder instance and let it manage its own container
        const finder = new Finder();
        
        const window = this.windowManager.createWindow({
            appId: 'finder',
            title: 'Finder',
            content: '', // Empty initially, Finder will populate
            size: { width: 900, height: 600 },
            position: { x: 100, y: 80 },
            minSize: { width: 600, height: 400 },
            resizable: true
        });
        
        if (window) {
            // Get the window content area and initialize Finder directly in it
            const windowContent = window.contentArea;
            
            // Initialize finder in the window content
            finder.init(windowContent).then(() => {
                console.log('Finder initialized in window');
            });
            
            // Show the window with animation
            window.show();
            
            // Store component reference
            this.components.set(window.id, finder);
        }
    }

    /**
     * Create terminal window
     */
    createTerminalWindow() {
        if (!this.windowManager) {
            console.warn('WindowManager not initialized yet');
            return;
        }
        
        // Check if terminal window already exists
        const existingWindows = this.windowManager.getWindowsByApp('terminal');
        if (existingWindows.length > 0) {
            // Focus existing window instead of creating new one
            const firstWindow = existingWindows[0];
            if (firstWindow.isMinimized) {
                firstWindow.restore();
            } else {
                this.windowManager.focusWindow(firstWindow.id);
            }
            
            // Also focus the terminal component to ensure cursor blinks
            setTimeout(() => {
                const terminalElement = firstWindow.contentElement.querySelector('.xterm-helper-textarea');
                if (terminalElement) {
                    terminalElement.focus();
                }
            }, 100);
            
            return;
        }
        
        // Create terminal container
        const terminalContainer = document.createElement('div');
        terminalContainer.className = 'terminal-container';
        terminalContainer.style.cssText = `
            width: 100%;
            height: 100%;
            background: #000000;
        `;
        
        // Create terminal instance
        const terminal = new Terminal(terminalContainer);
        
        const window = this.windowManager.createWindow({
            appId: 'terminal',
            title: 'Terminal',
            content: terminalContainer,
            size: { width: 800, height: 500 },
            position: { x: 150, y: 100 },
            minSize: { width: 400, height: 300 }
        });
        
        if (window) {
            window.show();
            
            // Focus terminal to enable cursor blinking
            setTimeout(() => {
                terminal.focus();
            }, 100);
            
            // Resize terminal when window is resized
            const originalSetSize = window.setSize.bind(window);
            window.setSize = (width, height) => {
                originalSetSize(width, height);
                setTimeout(() => {
                    terminal.resize();
                }, 100);
            };
            
            console.log('Terminal window created:', window.id);
        }
        
        return window;
    }

    /**
     * Create portfolio window
     */
    createPortfolioWindow() {
        if (!this.windowManager) {
            console.warn('WindowManager not initialized yet');
            return;
        }
        
        // Check if portfolio window already exists
        const existingWindows = this.windowManager.getWindowsByApp('portfolio');
        if (existingWindows.length > 0) {
            const firstWindow = existingWindows[0];
            if (firstWindow.isMinimized) {
                firstWindow.restore();
            } else {
                this.windowManager.focusWindow(firstWindow.id);
            }
            return;
        }
        
        // Create portfolio container
        const portfolioContainer = document.createElement('div');
        portfolioContainer.className = 'portfolio-container';
        portfolioContainer.style.cssText = `
            width: 100%;
            height: 100%;
            background: #f8fafc;
            overflow: hidden;
        `;
        
        // Create portfolio instance
        const portfolio = new Portfolio(portfolioContainer);
        
        const window = this.windowManager.createWindow({
            appId: 'portfolio',
            title: 'Portfolio - My Projects',
            content: portfolioContainer,
            size: { width: 1200, height: 800 },
            position: { x: 100, y: 100 },
            minSize: { width: 800, height: 600 },
            resizable: true
        });
        
        if (window) {
            window.show();
            
            // Setup window-specific event handlers
            window.onResize = () => {
                // Portfolio component handles its own responsive layout
                EventBus.emit('portfolio:window-resized', {
                    windowId: window.id,
                    size: window.getSize()
                });
            };
            
            window.onClose = () => {
                // Cleanup portfolio component
                if (portfolio && typeof portfolio.destroy === 'function') {
                    portfolio.destroy();
                }
            };
        }
        
        return window;
    }

    /**
     * Create about window
     */
    createAboutWindow() {
        if (!this.windowManager) {
            console.warn('WindowManager not initialized yet');
            return;
        }
        
        // Check if about window already exists
        const existingWindows = this.windowManager.getWindowsByApp('about');
        if (existingWindows.length > 0) {
            const firstWindow = existingWindows[0];
            if (firstWindow.isMinimized) {
                firstWindow.restore();
            } else {
                this.windowManager.focusWindow(firstWindow.id);
            }
            return;
        }
        
        // Create about container
        const aboutContainer = document.createElement('div');
        aboutContainer.className = 'about-container-wrapper';
        aboutContainer.style.cssText = `
            width: 100%;
            height: 100%;
            background: #ffffff;
            overflow: hidden;
        `;
        
        // Create about instance
        const about = new About(aboutContainer);
        
        const window = this.windowManager.createWindow({
            appId: 'about',
            title: 'About Me',
            content: aboutContainer,
            size: { width: 1000, height: 700 },
            position: { x: 200, y: 100 },
            minSize: { width: 800, height: 600 },
            resizable: true
        });
        
        if (window) {
            window.show();
            
            // Setup window-specific event handlers
            window.onResize = () => {
                EventBus.emit('about:window-resized', {
                    windowId: window.id,
                    size: window.getSize()
                });
            };
            
            window.onClose = () => {
                // Cleanup about component
                if (about && typeof about.destroy === 'function') {
                    about.destroy();
                }
            };
            
            console.log('About window created:', window.id);
        }
        
        return window;
    }

    /**
     * Create browser window
     */
    createBrowserWindow(url = null) {
        if (!this.windowManager) {
            console.warn('WindowManager not initialized yet');
            return;
        }
        
        console.log('🌐 Creating browser window with URL:', url);
        
        // Create browser instance
        const browser = new Browser();
        
        const window = this.windowManager.createWindow({
            appId: 'browser',
            title: 'Safari',
            content: '', // Empty initially, Browser will populate
            size: { width: 1000, height: 700 },
            position: { x: 120, y: 60 },
            minSize: { width: 600, height: 400 },
            resizable: true
        });
        
        if (window) {
            // Get the window content area and initialize Browser directly in it
            const windowContent = window.contentArea;
            
            // Initialize browser in the window content
            browser.init(windowContent).then(() => {
                console.log('🌐 Browser initialized in window');
                
                // Navigate to URL if provided
                if (url) {
                    browser.navigateTo(url);
                }
            });
            
            // Show the window with animation
            window.show();
            
            // Store component reference
            this.components.set(window.id, browser);
            
            // Cleanup on window close
            window.onClose = () => {
                if (browser && typeof browser.destroy === 'function') {
                    browser.destroy();
                }
                this.components.delete(window.id);
            };
            
            console.log('🌐 Browser window created:', window.id);
        }
        
        return window;
    }

    /**
     * Create contact window
     */
    createContactWindow() {
        if (!this.windowManager) {
            console.warn('WindowManager not initialized yet');
            return;
        }
        
        // Check if contact window already exists
        const existingWindows = this.windowManager.getWindowsByApp('contact');
        if (existingWindows.length > 0) {
            const firstWindow = existingWindows[0];
            if (firstWindow.isMinimized) {
                firstWindow.restore();
            } else {
                this.windowManager.focusWindow(firstWindow.id);
            }
            return;
        }
        
        // Create contact container
        const contactContainer = document.createElement('div');
        contactContainer.className = 'contact-container-wrapper';
        contactContainer.style.cssText = `
            width: 100%;
            height: 100%;
            background: #ffffff;
            overflow: hidden;
        `;
        
        // Create contact instance
        const contact = new Contact(contactContainer);
        
        const window = this.windowManager.createWindow({
            appId: 'contact',
            title: 'Contact Me',
            content: contactContainer,
            size: { width: 1000, height: 700 },
            position: { x: 250, y: 100 },
            minSize: { width: 800, height: 600 },
            resizable: true
        });
        
        if (window) {
            window.show();
            
            // Setup window-specific event handlers
            window.onResize = () => {
                EventBus.emit('contact:window-resized', {
                    windowId: window.id,
                    size: window.getSize()
                });
            };
            
            window.onClose = () => {
                // Cleanup contact component
                if (contact && typeof contact.destroy === 'function') {
                    contact.destroy();
                }
            };
            
            console.log('Contact window created:', window.id);
        }
        
        return window;
    }

    /**
     * Create preferences window
     */
    async createPreferencesWindow(initialPane = 'appearance') {
        console.log('🔧 Creating Preferences window with initial pane:', initialPane);
        
        // Check if preferences window already exists
        const existingWindows = this.windowManager.getWindowsByApp('preferences');
        if (existingWindows.length > 0) {
            console.log('Preferences window already exists, focusing and switching pane...');
            const firstWindow = existingWindows[0];
            if (firstWindow.isMinimized) {
                firstWindow.restore();
            } else {
                this.windowManager.focusWindow(firstWindow.id);
            }
            
            // Switch to requested pane if component instance exists
            if (firstWindow.componentInstance && firstWindow.componentInstance.switchTab) {
                firstWindow.componentInstance.switchTab(initialPane);
            }
            return;
        }
        
        try {
            console.log('Importing Preferences component...');
            // Import Preferences component
            const { default: Preferences } = await import('./components/preferences/Preferences.js');
            
            console.log('Creating Preferences instance...');
            // Create instance and initialize
            const preferences = new Preferences();
            const container = await preferences.init();
            
            console.log('Preferences container created:', container);
            
            // Create window
            const window = this.windowManager.createWindow({
                appId: 'preferences',
                title: 'System Preferences',
                content: '',
                size: { width: 800, height: 600 },
                position: { x: 150, y: 80 },
                minSize: { width: 600, height: 400 }
            });
            
            console.log('Window created:', window);
            
            // Wait for next frame to ensure window is in DOM
            await new Promise(resolve => requestAnimationFrame(resolve));
            
            // Add preferences component to window
            const windowContent = document.querySelector(`[data-window-id="${window.id}"] .window-content`);
            if (windowContent) {
                console.log('Adding container to window content...');
                windowContent.appendChild(container);
                
                // Store component instance for cleanup
                window.componentInstance = preferences;
                console.log('✅ Preferences component added to window');
                
                // Switch to initial pane AFTER component is in DOM
                if (initialPane && preferences.switchTab) {
                    // Wait one more frame to ensure DOM is fully rendered
                    await new Promise(resolve => requestAnimationFrame(resolve));
                    preferences.switchTab(initialPane);
                }
            } else {
                console.error('Window content not found for window:', window.id);
                // Try alternative selector
                const altContent = window.element?.querySelector('.window-content');
                if (altContent) {
                    console.log('Found window content via window.element, adding container...');
                    altContent.appendChild(container);
                    window.componentInstance = preferences;
                    console.log('✅ Preferences component added via alternative method');
                    
                    // Switch to initial pane AFTER component is in DOM
                    if (initialPane && preferences.switchTab) {
                        await new Promise(resolve => requestAnimationFrame(resolve));
                        preferences.switchTab(initialPane);
                    }
                } else {
                    console.error('Could not find window content element at all!');
                }
            }
            
            // Show the window
            if (window && window.show) {
                window.show();
                console.log('✅ Preferences window shown');
            }
            
            // Listen for window close to cleanup
            EventBus.on('window:closed', (data) => {
                if (data.windowId === window.id && window.componentInstance) {
                    window.componentInstance.destroy();
                }
            });
            
            console.log('Preferences window created:', window.id);
            return window;
            
        } catch (error) {
            console.error('Failed to create preferences window:', error);
            
            // Fallback UI
            const fallbackWindow = this.windowManager.createWindow({
                appId: 'preferences',
                title: 'System Preferences',
                content: `
                    <div style="padding: 2rem; text-align: center; color: #86868b;">
                        <h2>Failed to Load Preferences</h2>
                        <p>Please refresh the page and try again.</p>
                        <pre style="margin-top: 1rem; text-align: left; font-size: 12px; color: #ff3b30;">${error.message}</pre>
                    </div>
                `,
                size: { width: 500, height: 300 },
                position: { x: 200, y: 150 }
            });
            
            if (fallbackWindow) {
                fallbackWindow.show();
            }
            
            return fallbackWindow;
        }
    }

    /**
     * Create a test window for debugging
     */
    createTestWindow() {
        if (!this.windowManager) {
            console.warn('WindowManager not initialized yet');
            return;
        }
        
        const testContent = `
            <div style="padding: 2rem; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
                <h2 style="margin-top: 0; color: #1d1d1f;">Test Window</h2>
                <p style="color: #86868b; line-height: 1.6;">
                    This is a test window to demonstrate the LinkOS window system. 
                    You can drag it around, resize it using the handles, and interact with the traffic light buttons.
                </p>
                <div style="margin: 1.5rem 0;">
                    <button onclick="alert('Button clicked!')" style="
                        background: #007AFF;
                        color: white;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 6px;
                        cursor: pointer;
                        margin-right: 8px;
                    ">Test Button</button>
                    
                    <button onclick="this.closest('.LinkOS-window').style.background = 'rgba(255,100,100,0.9)'" style="
                        background: #ff3b30;
                        color: white;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 6px;
                        cursor: pointer;
                    ">Change Color</button>
                </div>
                <div style="
                    background: rgba(0, 122, 255, 0.1);
                    padding: 1rem;
                    border-radius: 8px;
                    border-left: 4px solid #007AFF;
                    margin-top: 1.5rem;
                ">
                    <strong>Keyboard Shortcuts:</strong><br>
                    • <kbd>⌘M</kbd> - Minimize<br>
                    • <kbd>⌘W</kbd> - Close<br>
                    • <kbd>⌘Tab</kbd> - Cycle windows
                </div>
            </div>
        `;
        
        const window = this.windowManager.createWindow({
            appId: 'test-app',
            title: 'Test Window',
            content: testContent,
            size: { width: 500, height: 400 },
            position: { x: 200, y: 150 }
        });
        
        if (window) {
            window.show();
            console.log('Test window created:', window.id);
        }
        
        return window;
    }

    /**
     * Open file viewer window
     */
    openFileViewer(data) {
        if (!this.windowManager) {
            console.warn('WindowManager not initialized yet');
            return;
        }

        const { name, content, path, size, modified, type } = data;

        // If PDF, check browser and decide whether to open externally or in iframe
        if (type === 'pdf') {
            // Build a safe URL relative to public/documents
            const safeName = encodeURIComponent(name);
            const pdfUrl = `/documents/${safeName}`;
            
            // Detect Firefox (use iframe for Firefox, external for all others)
            const isFirefox = /Firefox/i.test(navigator.userAgent);
            
            console.log('📄 PDF open requested - Browser:', isFirefox ? 'Firefox' : 'Non-Firefox');
            
            // Open PDFs externally in non-Firefox browsers for better native support
            if (!isFirefox) {
                console.log('📄 Attempting to open PDF externally...');
                try {
                    const fullUrl = `${location.origin}${pdfUrl}`;
                    // Use globalThis.open or self.open as fallback if window is not available
                    const openWindow = globalThis.open || self.open || window.open;
                    const newWindow = openWindow(fullUrl, '_blank', 'noopener,noreferrer');
                    console.log('📄 PDF opened externally (non-Firefox browser):', fullUrl);
                    return; // CRITICAL: Stop here, don't create iframe
                } catch (error) {
                    console.warn('Failed to open PDF externally, falling back to iframe:', error);
                    // Fall through to iframe viewer
                }
            }
            
            console.log('📄 Using iframe viewer for PDF');

            // For Firefox, use iframe viewer
            const iframeContent = `
                <div style="display:flex;flex-direction:column;height:100%;background:var(--bg-primary)">
                    <div style="padding:12px 16px;border-bottom:1px solid var(--border-light);background:var(--bg-secondary);flex-shrink:0;display:flex;align-items:center;justify-content:space-between">
                        <div>
                            <div style="font-weight:600;font-size:13px;">${this.escapeHtml(name)}</div>
                            <div style="font-size:11px;color:var(--text-tertiary);margin-top:2px;">${this.escapeHtml(path)} • ${this.formatFileSize(size)} • Modified: ${this.escapeHtml(modified)}</div>
                        </div>
                    </div>
                    <div style="flex:1;overflow:hidden;display:flex;">
                        <iframe src="${pdfUrl}" style="border:0;width:100%;height:100%;" sandbox="allow-scripts allow-same-origin allow-forms"></iframe>
                    </div>
                </div>
            `;

            const win = this.windowManager.createWindow({
                appId: 'file-viewer',
                title: `PDF — ${name}`,
                content: iframeContent,
                size: { width: 900, height: 700 },
                position: { x: 120, y: 80 },
                minSize: { width: 480, height: 320 }
            });

            if (win) {
                win.show();
                console.log('📄 PDF viewer opened in iframe:', pdfUrl);
            }

            return;
        }

        // Fallback: plain text/file viewer for other file types
        const fileContent = `
            <div style="
                display: flex;
                flex-direction: column;
                height: 100%;
                background: var(--bg-primary);
                color: var(--text-primary);
                font-family: var(--font-family-system);
            ">
                <div style="
                    padding: 12px 16px;
                    border-bottom: 1px solid var(--border-light);
                    background: var(--bg-secondary);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-shrink: 0;
                ">
                    <div>
                        <div style="font-weight: 600; font-size: 13px;">${this.escapeHtml(name)}</div>
                        <div style="font-size: 11px; color: var(--text-tertiary); margin-top: 2px;">
                            ${this.escapeHtml(path)} • ${this.formatFileSize(size)} • Modified: ${this.escapeHtml(modified)}
                        </div>
                    </div>
                </div>
                <div style="
                    flex: 1;
                    overflow: auto;
                    padding: 16px;
                    font-family: var(--font-family-mono);
                    font-size: 12px;
                    line-height: 1.6;
                    white-space: pre-wrap;
                    word-break: break-word;
                    user-select: text;
                    -webkit-user-select: text;
                    cursor: text;
                ">${this.escapeHtml(content || 'Empty file')}</div>
            </div>
        `;

        const window = this.windowManager.createWindow({
            appId: 'file-viewer',
            title: `📄 ${name}`,
            content: fileContent,
            size: { width: 700, height: 500 },
            position: { x: 150, y: 100 },
            minSize: { width: 400, height: 300 }
        });

        if (window) {
            window.show();
            console.log('📄 File viewer opened:', name);
        }
    }

    /**
     * Format file size
     */
    formatFileSize(bytes) {
        if (!bytes) return '0 B';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Get application status
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            components: Array.from(this.components.keys()),
            eventBusActive: !!window.EventBus,
            activeEvents: window.EventBus ? window.EventBus.getActiveEvents() : {}
        };
    }
}

// Initialize app when script loads
const app = new App();

// Make app globally available for debugging
window.AbdulmeApp = app;

export default App;