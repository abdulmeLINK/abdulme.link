import EventBus from '../EventBus.js';
import LinkOS_COLORS from '../../config/ColorConstants.js';

/**
 * Dock - LinkOS-authentic dock interface with magnification and spring physics
 * Handles app icons, magnification effects, drag-to-rearrange, and context menus
 */
class Dock {
    constructor() {
        this.container = null;
        this.iconsContainer = null;
        this.contextMenu = null;
        
        // State
        this.apps = [];
        this.recentApps = [];
        this.runningApps = new Set();
        this.preferences = {};
        this.isDragging = false;
        this.draggedApp = null;
        
        // Configuration
        this.config = {
            position: 'bottom', // bottom, left, right
            size: 64, // Icon size in pixels
            maxScale: 1.5, // Maximum magnification
            magnetRadius: 100, // Magnification effect radius
            springDuration: 300, // Animation duration in ms
            hoverResponse: 50, // Hover response time in ms
            autoHide: false,
            magnificationEnabled: true,
            showRecentApps: true,
            maxRecentApps: 5
        };

        this.init();
    }

    /**
     * Initialize dock component
     */
    async init() {
        try {
            await this.loadPreferences();
            await this.loadDockApps();
            
            this.createElements();
            this.bindEvents();
            this.createDockIcons();
            
            // Setup magnification system
            this.setupMagnification();
            
            EventBus.emit('dock:ready', {
                apps: this.apps.length,
                position: this.config.position
            });
            
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Create dock elements
     */
    createElements() {
        // Find or create dock container
        this.container = document.getElementById('dock-container');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'dock-container';
            document.body.appendChild(this.container);
        }

        // Set classes (dock-container + position class)
        this.container.className = `dock-container ${this.config.position}`;
        
        // Create inner dock
        const dock = document.createElement('div');
        dock.className = 'dock';
        
        // Create icons container
        this.iconsContainer = document.createElement('div');
        this.iconsContainer.className = 'dock-icons';
        
        // Create context menu
        this.createContextMenu();
        
        // Assemble dock
        dock.appendChild(this.iconsContainer);
        this.container.appendChild(dock);
        
        console.log('Dock elements created. Container class:', this.container.className);
    }

    /**
     * Apply position-based styles to dock container
     */
    applyPositionStyles() {
        // Update class to include position
        this.container.className = `dock-container ${this.config.position}`;
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Global mouse move for magnification
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        
        // App state events
        EventBus.on('app:launch', this.handleAppLaunched.bind(this)); // Desktop launches
        EventBus.on('app:launched', this.handleAppLaunched.bind(this)); // Legacy support
        EventBus.on('app:closed', this.handleAppClosed.bind(this));
        EventBus.on('preferences:changed', this.handlePreferencesChanged.bind(this));
        EventBus.on('preference:changed', this.handlePreferenceChanged.bind(this));
        
        // Dock-specific preference events
        EventBus.on('dock:preferencesLoaded', this.handleDockPreferencesLoaded.bind(this));
        EventBus.on('dock:settingChanged', this.handleDockSettingChanged.bind(this));
        
        // Theme change events
        EventBus.on('theme:changed', this.handleThemeChanged.bind(this));
        
        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        
        // Auto-hide functionality
        if (this.config.autoHide) {
            this.setupAutoHide();
        }
    }

    /**
     * Load dock preferences
     */
    async loadPreferences() {
        try {
            const response = await fetch('/api/preferences');
            const data = await response.json();
            
            if (data.success && data.data.dock) {
                this.preferences = data.data.dock;
                this.updateConfigFromPreferences();
            }
        } catch (error) {
            console.warn('Failed to load dock preferences:', error);
        }
    }

    /**
     * Update configuration from preferences
     */
    updateConfigFromPreferences() {
        if (this.preferences.position) {
            this.config.position = this.preferences.position;
        }
        
        // Handle size - can be either a number (pixels) or string (small/medium/large)
        if (this.preferences.size !== undefined) {
            if (typeof this.preferences.size === 'number') {
                // Direct pixel value from preferences
                this.config.size = this.preferences.size;
            } else {
                // Convert size string to pixel value
                const sizeMap = {
                    'small': 48,
                    'medium': 64,
                    'large': 80
                };
                this.config.size = sizeMap[this.preferences.size] || 64;
            }
            
            // Update CSS custom property for icon size
            document.documentElement.style.setProperty('--dock-icon-size', `${this.config.size}px`);
            
            // Update all dock icons
            const icons = this.container.querySelectorAll('.dock-icon');
            icons.forEach(icon => {
                icon.style.width = this.config.size + 'px';
                icon.style.height = this.config.size + 'px';
            });
        }
        
        // Handle magnification - nested object or flat property
        if (this.preferences.magnification !== undefined) {
            if (typeof this.preferences.magnification === 'object') {
                this.config.magnificationEnabled = this.preferences.magnification.enabled !== false;
                this.config.maxScale = this.preferences.magnification.scale || 1.5;
            } else {
                this.config.magnificationEnabled = this.preferences.magnification;
            }
        } else if (this.preferences.magnificationEnabled !== undefined) {
            this.config.magnificationEnabled = this.preferences.magnificationEnabled;
        }
        
        // Handle auto-hide - underscore or camelCase
        if (this.preferences.auto_hide !== undefined) {
            this.config.autoHide = this.preferences.auto_hide;
            if (this.config.autoHide) {
                this.setupAutoHide();
            } else {
                this.removeAutoHide();
            }
        } else if (this.preferences.autoHide !== undefined) {
            this.config.autoHide = this.preferences.autoHide;
            if (this.config.autoHide) {
                this.setupAutoHide();
            } else {
                this.removeAutoHide();
            }
        }
        
        console.log('Dock config updated from preferences:', this.config);
    }

    /**
     * Load dock applications
     */
    async loadDockApps() {
        try {
            // Load desktop apps data from API
            const response = await fetch('/api/desktop-apps');
            
            if (!response.ok) {
                console.warn('Failed to fetch desktop-apps, status:', response.status);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Handle Laravel API response format
            const appsData = data.success ? data.data : data;
            
            if (appsData && appsData.apps) {
                // Get featured apps for dock
                this.apps = appsData.apps.filter(app => app.featured).slice(0, 7);
                console.log('✅ Loaded dock apps from API:', this.apps.length, 'apps');
                
                // Log external apps with openInNewTab property
                const externalApps = this.apps.filter(app => app.type === 'external');
                console.log('🌐 Dock external apps:', externalApps.map(app => ({ 
                    name: app.name, 
                    openInNewTab: app.openInNewTab,
                    url: app.url 
                })));
                
                // Add finder as first app if not present
                if (!this.apps.find(app => app.id === 'finder')) {
                    this.apps.unshift({
                        id: 'finder',
                        name: 'Finder',
                        icon: '/images/icons/finder.png',
                        type: 'system',
                        component: 'Finder'
                    });
                }
            } else {
                console.warn('Invalid data structure in desktop-apps.json, using defaults');
                this.apps = this.getDefaultDockApps();
            }
            
            console.log('Final dock apps:', this.apps);
        } catch (error) {
            console.warn('Failed to load dock apps, using defaults:', error);
            this.apps = this.getDefaultDockApps();
            console.log('Using default dock apps:', this.apps);
        }
    }

    /**
     * Get default dock applications
     */
    getDefaultDockApps() {
        return [
            { id: 'finder', name: 'Finder', icon: '/images/icons/finder.png', type: 'system' },
            { id: 'terminal', name: 'Terminal', icon: '/images/icons/terminal.png', type: 'internal' },
            { id: 'portfolio', name: 'Portfolio', icon: '/images/icons/portfolio.png', type: 'internal' },
            { id: 'about', name: 'About', icon: '/images/icons/about.png', type: 'internal' },
            { id: 'contact', name: 'Contact', icon: '/images/icons/contact.png', type: 'internal' },
            { id: 'preferences', name: 'System Preferences', icon: '/images/icons/preferences.png', type: 'internal' }
        ];
    }

    /**
     * Create dock icons
     */
    createDockIcons() {
        if (!this.iconsContainer) {
            console.error('Dock icons container not found!');
            return;
        }
        
        console.log('Creating dock icons for', this.apps.length, 'apps');
        
        // Clear existing icons
        this.iconsContainer.innerHTML = '';
        
        // Create app icons
        this.apps.forEach((app, index) => {
            console.log('Creating icon for:', app.name);
            this.createDockIcon(app, index);
        });
        
        console.log('Dock icons created. Container children:', this.iconsContainer.children.length);
        
        // Add separator and recent apps if enabled (disabled for now to prevent errors)
        // if (this.config.showRecentApps && this.recentApps.length > 0) {
        //     this.addRecentAppsSection();
        // }
    }

    /**
     * Create individual dock icon
     */
    createDockIcon(app, index) {
        const iconContainer = document.createElement('div');
        iconContainer.className = 'dock-icon-container';
        iconContainer.dataset.appId = app.id;
        iconContainer.dataset.index = index;
        
        // Create icon image
        const iconImg = document.createElement('div');
        iconImg.className = 'dock-icon';
        iconImg.dataset.appName = app.name;
        iconImg.style.backgroundImage = `url(${app.icon})`;
        
        console.log(`Creating icon: ${app.name}, size: ${this.config.size}px, icon: ${app.icon}`);
        
        // Handle missing icon images
        const testImg = new Image();
        testImg.onload = () => {
            // Icon loaded successfully, hide fallback text
            iconImg.style.setProperty('--icon-fallback-opacity', '0');
        };
        testImg.onerror = () => {
            // Icon failed to load, show fallback text
            iconImg.style.backgroundImage = 'none';
            iconImg.style.setProperty('--icon-fallback-opacity', '1');
        };
        testImg.src = app.icon;
        
        // Create running indicator dot
        const indicator = document.createElement('div');
        indicator.className = 'running-indicator';
        
        // Create app label
        const label = document.createElement('div');
        label.className = 'dock-label';
        label.textContent = app.name;
        
        // Assemble icon
        iconContainer.appendChild(iconImg);
        iconContainer.appendChild(indicator);
        iconContainer.appendChild(label);
        
        // Add event listeners
        this.addIconEventListeners(iconContainer, app);
        
        // Add to container
        this.iconsContainer.appendChild(iconContainer);
        
        // Update running state
        if (this.runningApps.has(app.id)) {
            indicator.style.opacity = '1';
        }
    }

    /**
     * Add event listeners to dock icon
     */
    addIconEventListeners(iconContainer, app) {
        const iconImg = iconContainer.querySelector('.dock-icon');
        const label = iconContainer.querySelector('.dock-label');
        
        // Click to launch app
        iconContainer.addEventListener('click', (e) => {
            e.preventDefault();
            this.launchApp(app);
        });
        
        // Context menu (Control+Click or Right+Click)
        iconContainer.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showContextMenu(e, app);
        });
        
        iconContainer.addEventListener('mousedown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                this.showContextMenu(e, app);
            }
        });
        
        // Hover for label
        iconContainer.addEventListener('mouseenter', () => {
            if (!this.isDragging) {
                label.style.opacity = '1';
            }
        });
        
        iconContainer.addEventListener('mouseleave', () => {
            label.style.opacity = '0';
        });
        
        // Drag functionality
        iconContainer.draggable = true;
        iconContainer.addEventListener('dragstart', (e) => {
            this.isDragging = true;
            this.draggedApp = app;
            iconContainer.style.opacity = '0.5';
            
            // Hide label during drag
            label.style.opacity = '0';
        });
        
        iconContainer.addEventListener('dragend', (e) => {
            this.isDragging = false;
            this.draggedApp = null;
            iconContainer.style.opacity = '1';
        });
    }

    /**
     * Setup magnification system
     */
    setupMagnification() {
        if (!this.config.magnificationEnabled) return;
        
        this.magnificationActive = true;
        
        // Store original icon sizes
        this.originalSizes = {};
        const icons = this.iconsContainer.querySelectorAll('.dock-icon-container');
        icons.forEach((icon, index) => {
            this.originalSizes[index] = {
                width: this.config.size,
                height: this.config.size
            };
        });
    }

    /**
     * Handle mouse move for magnification
     */
    handleMouseMove(event) {
        if (!this.magnificationActive || this.isDragging) return;
        
        const dockRect = this.iconsContainer.getBoundingClientRect();
        const mouseX = event.clientX;
        const mouseY = event.clientY;
        
        // Check if mouse is near dock
        const isNearDock = this.isMouseNearDock(mouseX, mouseY, dockRect);
        
        if (isNearDock) {
            this.applyMagnification(mouseX, mouseY, dockRect);
        } else {
            this.resetMagnification();
        }
    }

    /**
     * Check if mouse is near dock for magnification
     */
    isMouseNearDock(mouseX, mouseY, dockRect) {
        const margin = this.config.magnetRadius;
        
        return (
            mouseX >= dockRect.left - margin &&
            mouseX <= dockRect.right + margin &&
            mouseY >= dockRect.top - margin &&
            mouseY <= dockRect.bottom + margin
        );
    }

    /**
     * Apply magnification effect to dock icons
     */
    applyMagnification(mouseX, mouseY, dockRect) {
        const icons = this.iconsContainer.querySelectorAll('.dock-icon-container');
        
        icons.forEach((iconContainer, index) => {
            const iconRect = iconContainer.getBoundingClientRect();
            const iconCenterX = iconRect.left + iconRect.width / 2;
            const iconCenterY = iconRect.top + iconRect.height / 2;
            
            // Calculate distance from mouse to icon center
            const distance = Math.sqrt(
                Math.pow(mouseX - iconCenterX, 2) + Math.pow(mouseY - iconCenterY, 2)
            );
            
            // Calculate scale based on distance
            let scale = 1;
            if (distance < this.config.magnetRadius) {
                const proximity = 1 - (distance / this.config.magnetRadius);
                scale = 1 + (proximity * (this.config.maxScale - 1));
            }
            
            // Apply scale with smooth transition
            const iconImg = iconContainer.querySelector('.dock-icon');
            iconImg.style.transform = `scale(${scale})`;
            
            // Add lift effect for hovered icon
            if (scale > 1.2) {
                iconImg.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.5)';
            } else {
                iconImg.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
            }
        });
    }

    /**
     * Reset magnification to normal state
     */
    resetMagnification() {
        const icons = this.iconsContainer.querySelectorAll('.dock-icon');
        
        icons.forEach(iconImg => {
            iconImg.style.transform = 'scale(1)';
            iconImg.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
        });
    }

    /**
     * Launch application
     */
    launchApp(app) {
        console.log('Launching app from dock:', app.name, 'Type:', app.type, 'openInNewTab:', app.openInNewTab, 'URL:', app.url);
        
        // Check if external app should open in new tab directly
        if ((app.type === 'external' || app.type === 'link') && app.openInNewTab === true) {
            // Open directly in new browser tab (for sites that block iframes)
            window.open(app.url, '_blank', 'noopener,noreferrer');
            console.log('🌐 Opened in new tab from dock:', app.url);
            return; // Don't add bounce or running indicator for new tab opens
        }
        
        // Add bounce animation
        this.addBounceAnimation(app.id);
        
        // Mark as running
        this.runningApps.add(app.id);
        this.updateRunningIndicator(app.id, true);
        
        // Emit app launch event
        EventBus.emit('app:launch', {
            appId: app.id,
            name: app.name,
            component: app.component,
            type: app.type,
            url: app.url, // Pass URL for external apps
            openInNewTab: app.openInNewTab, // Pass flag
            filePath: app.filePath, // Pass filePath for document types
            fileType: app.fileType, // Pass fileType for document types
            config: {
                title: app.name,
                size: app.size || { width: 800, height: 600 }
            }
        });
        
        // Add to recent apps
        this.addToRecentApps(app);
    }

    /**
     * Add bounce animation to app icon
     */
    addBounceAnimation(appId) {
        const iconContainer = this.iconsContainer.querySelector(`[data-app-id="${appId}"]`);
        if (!iconContainer) return;
        
        const iconImg = iconContainer.querySelector('.dock-icon');
        
        // Create bounce keyframes
        iconImg.style.animation = 'dockBounce 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        
        // Remove animation after completion
        setTimeout(() => {
            iconImg.style.animation = '';
        }, 600);
    }

    /**
     * Update running indicator for app
     */
    updateRunningIndicator(appId, isRunning) {
        const iconContainer = this.iconsContainer.querySelector(`[data-app-id="${appId}"]`);
        if (!iconContainer) return;
        
        const indicator = iconContainer.querySelector('.running-indicator');
        indicator.style.opacity = isRunning ? '1' : '0';
    }

    /**
     * Handle theme changed event
     * @param {object} data - Theme data
     */
    handleThemeChanged(data) {
        console.log('🎨 Dock: Theme changed to', data.effectiveTheme);
        // CSS variables handle the visual changes automatically
        // This is here for any JS-specific theme logic if needed
    }

    /**
     * Show context menu for dock icon
     */
    showContextMenu(event, app) {
        if (!this.contextMenu) return;
        
        // Position context menu
        const x = event.clientX;
        const y = event.clientY - 150; // Above the dock
        
        this.contextMenu.style.left = x + 'px';
        this.contextMenu.style.top = y + 'px';
        this.contextMenu.style.display = 'block';
        this.contextMenu.style.opacity = '1';
        
        // Update context menu content based on app
        this.updateContextMenuContent(app);
        
        // Store current app for context actions
        this.contextMenu.dataset.appId = app.id;
        
        // Hide menu on outside click
        setTimeout(() => {
            document.addEventListener('click', this.hideContextMenu.bind(this), { once: true });
        }, 100);
    }

    /**
     * Create context menu element
     */
    createContextMenu() {
        this.contextMenu = document.createElement('div');
        this.contextMenu.className = 'dock-context-menu';
        this.contextMenu.style.cssText = `
            position: fixed;
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(0, 0, 0, 0.1);
            border-radius: 8px;
            padding: 4px 0;
            min-width: 140px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            display: none;
            opacity: 0;
            transition: opacity 200ms ease;
        `;
        
        document.body.appendChild(this.contextMenu);
        
        // Add event listener for menu actions
        this.contextMenu.addEventListener('click', this.handleContextMenuClick.bind(this));
    }

    /**
     * Update context menu content
     */
    updateContextMenuContent(app) {
        const isRunning = this.runningApps.has(app.id);
        
        this.contextMenu.innerHTML = `
            <div class="context-menu-item" data-action="open">
                ${isRunning ? 'Show' : 'Open'}
            </div>
            <div class="context-menu-separator"></div>
            <div class="context-menu-item" data-action="keep-in-dock">
                Keep in Dock
            </div>
            <div class="context-menu-item" data-action="remove-from-dock">
                Remove from Dock
            </div>
            ${isRunning ? `
                <div class="context-menu-separator"></div>
                <div class="context-menu-item" data-action="force-quit">
                    Force Quit
                </div>
            ` : ''}
        `;
        
        // Style menu items
        const items = this.contextMenu.querySelectorAll('.context-menu-item');
        items.forEach(item => {
            item.style.cssText = `
                padding: 6px 12px;
                cursor: pointer;
                font-size: 13px;
                color: ${LinkOS_COLORS.DOCK_TEXT};
                transition: background-color 150ms ease;
            `;
            
            item.addEventListener('mouseenter', () => {
                item.style.backgroundColor = 'rgba(0, 122, 255, 0.1)';
            });
            
            item.addEventListener('mouseleave', () => {
                item.style.backgroundColor = 'transparent';
            });
        });
        
        // Style separators
        const separators = this.contextMenu.querySelectorAll('.context-menu-separator');
        separators.forEach(separator => {
            separator.style.cssText = `
                height: 1px;
                background: rgba(0, 0, 0, 0.1);
                margin: 4px 0;
            `;
        });
    }

    /**
     * Handle context menu clicks
     */
    handleContextMenuClick(event) {
        const action = event.target.dataset.action;
        const appId = this.contextMenu.dataset.appId;
        
        if (!action || !appId) return;
        
        const app = this.apps.find(a => a.id === appId);
        if (!app) return;
        
        switch (action) {
            case 'open':
                this.launchApp(app);
                break;
            case 'keep-in-dock':
                // Already in dock, just close menu
                break;
            case 'remove-from-dock':
                this.removeAppFromDock(appId);
                break;
            case 'force-quit':
                this.forceQuitApp(appId);
                break;
        }
        
        this.hideContextMenu();
    }

    /**
     * Hide context menu
     */
    hideContextMenu() {
        if (this.contextMenu) {
            this.contextMenu.style.opacity = '0';
            setTimeout(() => {
                this.contextMenu.style.display = 'none';
            }, 200);
        }
    }

    /**
     * Handle keyboard shortcuts
     */
    handleKeyDown(event) {
        // Control+Shift: Toggle magnification
        if (event.ctrlKey && event.shiftKey && !event.repeat) {
            this.toggleMagnification();
            event.preventDefault();
        }
    }

    /**
     * Toggle magnification on/off
     */
    toggleMagnification() {
        this.config.magnificationEnabled = !this.config.magnificationEnabled;
        
        if (this.config.magnificationEnabled) {
            this.setupMagnification();
            console.log('Dock magnification enabled');
        } else {
            this.magnificationActive = false;
            this.resetMagnification();
            console.log('Dock magnification disabled');
        }
        
        // Save preference
        this.savePreference('magnificationEnabled', this.config.magnificationEnabled);
    }

    /**
     * Save dock preference
     */
    async savePreference(key, value) {
        try {
            const preferences = { dock: { [key]: value } };
            await fetch('/api/preferences', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(preferences)
            });
        } catch (error) {
            console.warn('Failed to save dock preference:', error);
        }
    }

    /**
     * Handle app launched event
     */
    handleAppLaunched(data) {
        const appId = data.id || data.appId; // Support both formats
        console.log('App launched, updating dock indicator for:', appId);
        this.runningApps.add(appId);
        this.updateRunningIndicator(appId, true);
    }

    /**
     * Handle app closed event
     */
    handleAppClosed(data) {
        const appId = data.id || data.appId; // Support both formats
        this.runningApps.delete(appId);
        this.updateRunningIndicator(appId, false);
        console.log('App closed on dock:', appId);
    }

    /**
     * Handle preferences changed
     */
    handlePreferencesChanged(data) {
        // Handle both legacy format (data.category) and new format (data.data.dock)
        if (data.category === 'dock') {
            this.preferences = { ...this.preferences, ...data.preferences };
            this.updateConfigFromPreferences();
            this.applyPositionStyles();
        } else if (data.data && data.data.dock) {
            // New format: full preferences object
            this.preferences = { ...this.preferences, ...data.data.dock };
            this.updateConfigFromPreferences();
            this.applyPositionStyles();
        }
    }

    /**
     * Handle individual preference changed (new granular system)
     */
    handlePreferenceChanged(data) {
        const { path, value, preferences } = data;
        
        // Only handle dock-related preferences
        if (!path.startsWith('dock.')) return;
        
        console.log('🎯 Dock preference changed:', path, '=', value);
        
        // Update full preferences object
        if (preferences && preferences.dock) {
            this.preferences = { ...this.preferences, ...preferences.dock };
        }
        
        // Handle specific preference changes
        const prefPath = path.replace('dock.', '');
        
        switch (prefPath) {
            case 'size':
                this.config.size = parseInt(value);
                document.documentElement.style.setProperty('--dock-icon-size', `${this.config.size}px`);
                const icons = this.container.querySelectorAll('.dock-icon');
                icons.forEach(icon => {
                    icon.style.width = this.config.size + 'px';
                    icon.style.height = this.config.size + 'px';
                });
                console.log('🔄 Updated dock size to:', this.config.size);
                break;
                
            case 'magnification.enabled':
                this.config.magnificationEnabled = value;
                console.log('🔄 Updated magnification enabled to:', this.config.magnificationEnabled);
                break;
                
            case 'magnification.scale':
                this.config.maxScale = parseFloat(value);
                console.log('🔄 Updated magnification scale to:', this.config.maxScale);
                break;
                
            case 'auto_hide':
                this.config.autoHide = value;
                if (this.config.autoHide) {
                    this.setupAutoHide();
                    console.log('🔄 Enabled auto-hide');
                } else {
                    this.removeAutoHide();
                    console.log('🔄 Disabled auto-hide');
                }
                break;
                
            case 'position':
                this.config.position = value;
                this.applyPositionStyles();
                console.log('🔄 Updated dock position to:', this.config.position);
                break;
        }
    }

    /**
     * Handle dock preferences loaded
     */
    handleDockPreferencesLoaded(prefs) {
        console.log('Dock preferences loaded:', prefs);
        this.preferences = prefs;
        this.updateConfigFromPreferences();
        
        // Apply position immediately
        if (prefs.position) {
            this.setDockPosition(prefs.position);
        }
        
        // Apply size
        if (prefs.size) {
            this.setDockSize(prefs.size);
        }
        
        // Apply magnification
        if (prefs.magnification !== undefined) {
            const mag = prefs.magnification;
            this.config.magnificationEnabled = mag.enabled !== false;
            this.config.maxScale = mag.scale || 1.5;
        }
        
        // Apply auto-hide
        if (prefs.auto_hide !== undefined) {
            this.config.autoHide = prefs.auto_hide;
            if (this.config.autoHide) {
                this.setupAutoHide();
            }
        }
    }

    /**
     * Handle individual dock setting changed
     */
    handleDockSettingChanged(data) {
        const { key, value } = data;
        console.log('Dock setting changed:', key, value);
        
        switch (key) {
            case 'position':
                this.setDockPosition(value);
                break;
            case 'size':
                this.setDockSize(value);
                break;
            case 'magnification.enabled':
                this.config.magnificationEnabled = value;
                break;
            case 'magnification.scale':
                this.config.maxScale = parseFloat(value);
                break;
            case 'auto_hide':
                this.config.autoHide = value;
                if (value) {
                    this.setupAutoHide();
                }
                break;
        }
    }

    /**
     * Set dock position
     */
    setDockPosition(position) {
        this.config.position = position;
        this.container.className = `dock-container ${position}`;
        console.log('Dock position changed to:', position);
    }

    /**
     * Set dock size
     */
    setDockSize(size) {
        const sizeMap = {
            'small': 48,
            'medium': 64,
            'large': 80
        };
        this.config.size = sizeMap[size] || 64;
        
        // Update icon sizes
        const icons = this.container.querySelectorAll('.dock-icon');
        icons.forEach(icon => {
            icon.style.width = this.config.size + 'px';
            icon.style.height = this.config.size + 'px';
        });
        
        console.log('Dock size changed to:', size, this.config.size + 'px');
    }

    /**
     * Add to recent apps
     */
    addToRecentApps(app) {
        // Remove if already exists
        this.recentApps = this.recentApps.filter(recent => recent.id !== app.id);
        
        // Add to beginning
        this.recentApps.unshift(app);
        
        // Keep only max count
        this.recentApps = this.recentApps.slice(0, this.config.maxRecentApps);
    }

    /**
     * Add recent apps section to dock (with separator)
     */
    addRecentAppsSection() {
        if (!this.iconsContainer || this.recentApps.length === 0) {
            return;
        }

        // Add separator
        const separator = document.createElement('div');
        separator.className = 'dock-separator';
        separator.style.cssText = `
            width: 1px;
            height: 48px;
            background: rgba(255, 255, 255, 0.2);
            margin: 0 8px;
            align-self: center;
        `;
        this.iconsContainer.appendChild(separator);

        // Add recent apps
        this.recentApps.forEach((app, index) => {
            const recentIndex = this.apps.length + index;
            this.createDockIcon(app, recentIndex);
        });

        console.log('Recent apps section added:', this.recentApps.length, 'apps');
    }

    /**
     * Remove app from dock
     */
    removeAppFromDock(appId) {
        this.apps = this.apps.filter(app => app.id !== appId);
        this.createDockIcons();
    }

    /**
     * Force quit application
     */
    forceQuitApp(appId) {
        this.runningApps.delete(appId);
        this.updateRunningIndicator(appId, false);
        
        EventBus.emit('app:force-quit', { id: appId });
    }

    /**
     * Handle error conditions
     */
    handleError(error) {
        console.error('Dock error:', error);
        EventBus.emit('dock:error', { error: error.message });
    }

    /**
     * Clean up resources
     */
    destroy() {
        // Remove event listeners
        document.removeEventListener('mousemove', this.handleMouseMove.bind(this));
        EventBus.off('app:launched', this.handleAppLaunched.bind(this));
        EventBus.off('app:closed', this.handleAppClosed.bind(this));
        EventBus.off('preferences:changed', this.handlePreferencesChanged.bind(this));
        
        // Remove elements
        if (this.container) {
            this.container.remove();
        }
        if (this.contextMenu) {
            this.contextMenu.remove();
        }
        
        console.log('Dock component destroyed');
    }
}

export default Dock;