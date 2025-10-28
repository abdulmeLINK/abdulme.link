import EventBus from '../EventBus.js';
import Window from './Window.js';

/**
 * WindowManager - Manages multiple windows and their interactions
 * Handles window stacking, focus management, and keyboard shortcuts
 */
class WindowManager {
    constructor() {
        this.windows = new Map();
        this.focusedWindow = null;
        this.windowStack = [];
        
        // Configuration
        this.config = {
            maxWindows: 20,
            stackSpacing: 30,
            defaultPosition: { x: 100, y: 100 },
            keyboardShortcuts: true
        };
        
        this.init();
    }

    /**
     * Initialize window manager
     */
    init() {
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
        
        console.log('WindowManager initialized');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Window events
        EventBus.on('window:created', (data) => this.handleWindowCreated(data));
        EventBus.on('window:destroyed', (data) => this.handleWindowDestroyed(data));
        EventBus.on('window:focused', (data) => this.handleWindowFocused(data));
        EventBus.on('window:minimized', (data) => this.handleWindowMinimized(data));
        EventBus.on('window:close-requested', (data) => this.handleWindowCloseRequested(data));
        
        // App close events
        EventBus.on('app:close', (data) => this.handleAppClose(data));
        EventBus.on('app:force-quit', (data) => this.handleForceQuit(data));
        
        // Global click to blur windows
        document.addEventListener('mousedown', (e) => {
            if (!e.target.closest('.LinkOS-window')) {
                this.blurAllWindows();
            }
        });
        
        // Window resize handling
        window.addEventListener('resize', () => {
            this.handleScreenResize();
        });
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        if (!this.config.keyboardShortcuts) return;
        
        document.addEventListener('keydown', (e) => {
            // Command+Tab - Cycle through windows
            if (e.metaKey && e.key === 'Tab') {
                e.preventDefault();
                this.cycleWindows();
            }
            
            // Command+` - Cycle through app windows
            if (e.metaKey && e.key === '`') {
                e.preventDefault();
                this.cycleAppWindows();
            }
            
            // Command+Shift+W - Close all windows
            if (e.metaKey && e.shiftKey && e.key === 'W') {
                e.preventDefault();
                this.closeAllWindows();
            }
            
            // Command+Option+H - Hide all windows
            if (e.metaKey && e.altKey && e.key === 'h') {
                e.preventDefault();
                this.hideAllWindows();
            }
        });
    }

    /**
     * Create and show a new window
     */
    createWindow(config) {
        // Check window limit
        if (this.windows.size >= this.config.maxWindows) {
            console.warn('Maximum window limit reached');
            return null;
        }
        
        // Calculate stacked position for new windows
        const position = this.calculateNewWindowPosition(config.appId);
        const windowConfig = {
            position,
            ...config
        };
        
        const window = new Window(windowConfig);
        this.registerWindow(window);
        
        return window;
    }

    /**
     * Register window with manager
     */
    registerWindow(window) {
        this.windows.set(window.id, window);
        this.windowStack.push(window.id);
        
        console.log(`Window registered: ${window.title} (${window.id})`);
    }

    /**
     * Get window by ID
     */
    getWindow(windowId) {
        return this.windows.get(windowId);
    }

    /**
     * Get windows by app ID
     */
    getWindowsByApp(appId) {
        return Array.from(this.windows.values()).filter(window => window.appId === appId);
    }

    /**
     * Get all visible windows
     */
    getVisibleWindows() {
        return Array.from(this.windows.values()).filter(window => window.isVisible);
    }

    /**
     * Focus a specific window
     */
    focusWindow(windowId) {
        const window = this.getWindow(windowId);
        if (!window) return;
        
        // Blur current focused window
        if (this.focusedWindow && this.focusedWindow !== window) {
            this.focusedWindow.blur();
        }
        
        // Focus new window
        window.focus();
        this.focusedWindow = window;
        
        // Update window stack order
        this.moveToTop(windowId);
    }

    /**
     * Blur all windows
     */
    blurAllWindows() {
        this.windows.forEach(window => {
            window.blur();
        });
        this.focusedWindow = null;
    }

    /**
     * Move window to top of stack
     */
    moveToTop(windowId) {
        const index = this.windowStack.indexOf(windowId);
        if (index > -1) {
            this.windowStack.splice(index, 1);
            this.windowStack.push(windowId);
        }
    }

    /**
     * Cycle through windows with Command+Tab
     */
    cycleWindows() {
        const visibleWindows = this.getVisibleWindows();
        if (visibleWindows.length === 0) return;
        
        let nextIndex = 0;
        
        if (this.focusedWindow) {
            const currentIndex = visibleWindows.findIndex(w => w.id === this.focusedWindow.id);
            nextIndex = (currentIndex + 1) % visibleWindows.length;
        }
        
        this.focusWindow(visibleWindows[nextIndex].id);
    }

    /**
     * Cycle through windows of the same app
     */
    cycleAppWindows() {
        if (!this.focusedWindow) return;
        
        const appWindows = this.getWindowsByApp(this.focusedWindow.appId)
            .filter(w => w.isVisible);
        
        if (appWindows.length <= 1) return;
        
        const currentIndex = appWindows.findIndex(w => w.id === this.focusedWindow.id);
        const nextIndex = (currentIndex + 1) % appWindows.length;
        
        this.focusWindow(appWindows[nextIndex].id);
    }

    /**
     * Close all windows
     */
    closeAllWindows() {
        const windowIds = Array.from(this.windows.keys());
        windowIds.forEach(id => {
            const window = this.getWindow(id);
            if (window) {
                window.close();
            }
        });
    }

    /**
     * Hide all windows
     */
    hideAllWindows() {
        this.windows.forEach(window => {
            if (window.isVisible) {
                window.hide();
            }
        });
        this.focusedWindow = null;
    }

    /**
     * Show all windows
     */
    showAllWindows() {
        this.windows.forEach(window => {
            if (!window.isVisible && !window.isMinimized) {
                window.show();
            }
        });
    }

    /**
     * Calculate position for new window
     */
    calculateNewWindowPosition(appId) {
        const existingWindows = this.getWindowsByApp(appId);
        const basePosition = { ...this.config.defaultPosition };
        
        if (existingWindows.length === 0) {
            return basePosition;
        }
        
        // Stack windows with offset
        const offset = existingWindows.length * this.config.stackSpacing;
        return {
            x: basePosition.x + offset,
            y: basePosition.y + offset
        };
    }

    /**
     * Handle screen resize
     */
    handleScreenResize() {
        this.windows.forEach(window => {
            // Ensure windows stay within screen bounds
            const maxX = window.innerWidth - window.size.width;
            const maxY = window.innerHeight - window.size.height;
            
            if (window.position.x > maxX) {
                window.setPosition(Math.max(0, maxX), window.position.y);
            }
            
            if (window.position.y > maxY) {
                window.setPosition(window.position.x, Math.max(0, maxY));
            }
            
            // Update maximized windows
            if (window.isMaximized) {
                window.setSize(window.innerWidth, window.innerHeight);
            }
        });
    }

    /**
     * Handle window created event
     */
    handleWindowCreated(data) {
        console.log(`Window created: ${data.windowId} for app: ${data.appId}`);
    }

    /**
     * Handle window destroyed event
     */
    handleWindowDestroyed(data) {
        const window = this.windows.get(data.windowId);
        if (!window) return;
        
        const appId = data.appId || window.appId;
        
        // Remove from collections
        this.windows.delete(data.windowId);
        const stackIndex = this.windowStack.indexOf(data.windowId);
        if (stackIndex > -1) {
            this.windowStack.splice(stackIndex, 1);
        }
        
        // Check if this was the last window for this app
        const remainingWindows = this.getWindowsByApp(appId);
        if (remainingWindows.length === 0) {
            // Emit app:closed event for Dock to update
            EventBus.emit('app:closed', {
                appId: appId
            });
        }
        
        // Update focused window
        if (this.focusedWindow === window) {
            this.focusedWindow = null;
            
            // Focus next window in stack
            if (this.windowStack.length > 0) {
                const nextWindowId = this.windowStack[this.windowStack.length - 1];
                const nextWindow = this.getWindow(nextWindowId);
                if (nextWindow && nextWindow.isVisible) {
                    this.focusWindow(nextWindowId);
                }
            }
        }
        
        console.log(`Window destroyed: ${data.windowId}`);
    }

    /**
     * Handle window focused event
     */
    handleWindowFocused(data) {
        const window = this.getWindow(data.windowId);
        if (window) {
            this.focusedWindow = window;
            this.moveToTop(data.windowId);
        }
    }

    /**
     * Handle window minimized event
     */
    handleWindowMinimized(data) {
        const window = this.getWindow(data.windowId);
        if (window && this.focusedWindow === window) {
            this.focusedWindow = null;
            
            // Focus next visible window
            const visibleWindows = this.getVisibleWindows();
            if (visibleWindows.length > 0) {
                this.focusWindow(visibleWindows[visibleWindows.length - 1].id);
            }
        }
    }

    /**
     * Handle window close request (e.g., from terminal exit command)
     */
    handleWindowCloseRequested(data) {
        const { windowId } = data;
        const window = this.getWindow(windowId);
        if (window) {
            console.log('🚪 Closing window:', windowId);
            window.close();
        }
    }

    /**
     * Handle app close event
     */
    handleAppClose(data) {
        const { appId } = data;
        const appWindows = this.getWindowsByApp(appId);
        
        appWindows.forEach(window => {
            window.close();
        });
    }

    /**
     * Handle force quit event from Dock
     * Immediately closes all windows for the app without animation
     */
    handleForceQuit(data) {
        const appId = data.id || data.appId;
        const appWindows = this.getWindowsByApp(appId);
        
        console.log(`Force quitting app: ${appId}, closing ${appWindows.length} window(s)`);
        
        // Force close all windows for this app
        appWindows.forEach(window => {
            window.destroy(); // Use destroy() for immediate removal
        });
    }

    /**
     * Create app content container
     */
    createAppContent(component) {
        const container = document.createElement('div');
        container.className = 'app-content';
        container.style.cssText = `
            width: 100%;
            height: 100%;
            overflow: hidden;
        `;
        
        if (typeof component === 'string') {
            container.innerHTML = component;
        } else if (component instanceof HTMLElement) {
            container.appendChild(component);
        } else if (typeof component === 'function') {
            // Component constructor
            const instance = new component(container);
            if (instance.element) {
                container.appendChild(instance.element);
            }
        }
        
        return container;
    }

    /**
     * Get window manager statistics
     */
    getStats() {
        return {
            totalWindows: this.windows.size,
            visibleWindows: this.getVisibleWindows().length,
            focusedWindow: this.focusedWindow?.id || null,
            windowStack: [...this.windowStack]
        };
    }

    /**
     * Destroy window manager and clean up
     */
    destroy() {
        this.closeAllWindows();
        
        EventBus.off('window:created');
        EventBus.off('window:destroyed');
        EventBus.off('window:focused');
        EventBus.off('window:minimized');
        EventBus.off('app:launch');
        EventBus.off('app:close');
        
        this.windows.clear();
        this.windowStack = [];
        this.focusedWindow = null;
        
        console.log('WindowManager destroyed');
    }
}

export default WindowManager;