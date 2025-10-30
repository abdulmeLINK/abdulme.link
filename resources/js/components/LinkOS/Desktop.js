import EventBus from '../EventBus.js';
import LinkOS_COLORS from '../../config/ColorConstants.js';

/**
 * Desktop - LinkOS desktop experience with embedded boot animation and wallpaper system
 * Handles embedded boot sequence (via Blade), wallpaper management, icons, and context menu
 * Smart boot logic: 4-5s static on first visit, 1s quick on return visits
 */
class Desktop {
    constructor() {
        this.container = null;
        this.bootOverlay = null;
        this.wallpaperContainer = null;
        this.iconsContainer = null;
        this.contextMenu = null;
        
        // State
        this.isBooting = true; // Start with boot screen
        this.currentWallpaper = null;
        this.wallpapers = [];
        this.desktopApps = [];
        this.loadedAssets = new Set();
        this.preferences = {};
        this.sessionData = null;
        this.rotationTimer = null;
        this.wallpaperCache = new Map();
        this.progressiveLoading = true;
        this.bootScreen = null;
        this.lastWallpaperChange = null; // Debounce wallpaper changes
        
        // Configuration
        this.config = {
            bootDuration: 4000,
            wallpaperTransitionDuration: 1000,
            rotationInterval: 30 * 60 * 1000, // 30 minutes
            maxCacheSize: 100 * 1024 * 1024, // 100MB
            iconGridSize: 80,
            performanceMode: this.detectPerformanceMode()
        };

        this.init();
    }

    /**
     * Initialize desktop component
     */
    async init() {
        try {
            this.createElements();
            this.bindEvents();
            
            // Listen for boot completion from embedded boot screen
            window.addEventListener('boot-complete', () => {
                this.initializeAfterBoot();
            });
            
            // If no embedded boot screen is shown, initialize immediately
            const bootOverlay = document.getElementById('boot-screen-overlay');
            if (!bootOverlay) {
                this.initializeAfterBoot();
            }
            
        } catch (error) {
            console.error('Desktop: Initialization failed:', error);
            this.showErrorState(error);
        }
    }

    /**
     * Initialize desktop after boot sequence completes
     */
    async initializeAfterBoot() {
        try {
            // Load essential data
            await Promise.all([
                this.loadPreferences(),
                this.loadWallpapers(), // Load wallpapers first so they're available during boot
                this.loadSessionData()
            ]);
            
            // Set initial wallpaper
            await this.setInitialWallpaper();
            
            // Load desktop apps
            await this.loadDesktopApps();
            
            // Load saved icon positions before setup
            this.loadIconPositions();
            
            // Initialize desktop
            await this.setupDesktop();
            
            // Mark desktop as ready
            this.isBooting = false;
            
            EventBus.emit('desktop:ready', {
                wallpapers: this.wallpapers.length,
                preferences: Object.keys(this.preferences).length,
                performanceMode: this.config.performanceMode
            });
            
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Create DOM elements
     */
    createElements() {
        // Get desktop container
        this.container = document.getElementById('desktop');
        if (!this.container) {
            throw new Error('Desktop container not found');
        }

        // Create wallpaper container
        this.wallpaperContainer = document.createElement('div');
        this.wallpaperContainer.className = 'wallpaper-container';
        this.wallpaperContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            z-index: 1;
        `;

        // Create icons container
        this.iconsContainer = document.createElement('div');
        this.iconsContainer.className = 'desktop-icons';
        this.iconsContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 2;
        `;

        // Create context menu
        this.contextMenu = document.createElement('div');
        this.contextMenu.className = 'context-menu';
        this.contextMenu.style.cssText = `
            position: fixed;
            display: none;
            z-index: 9999;
        `;
        this.contextMenu.innerHTML = this.createContextMenuHTML();

        // Append to container
        this.container.appendChild(this.wallpaperContainer);
        this.container.appendChild(this.iconsContainer);
        this.container.appendChild(this.contextMenu);
    }

    /**
     * Create context menu HTML
     */
    createContextMenuHTML(targetElement = null) {
        // Check if right-clicked on an app icon
        const isAppIcon = targetElement?.closest?.('.desktop-icon');
        
        if (isAppIcon) {
            const appId = isAppIcon.dataset.appId;
            const app = this.desktopApps.find(a => a.id === appId);
            const appName = isAppIcon.querySelector('.icon-label')?.textContent || 'Application';
            
            // Build menu based on app type
            let menuItems = `
                <div class="menu-item" data-action="open_app">
                    Open
                </div>`;
            
            // Add "Open Externally" for external links and documents
            if (app && (app.type === 'external' || app.type === 'document')) {
                menuItems += `
                <div class="menu-item" data-action="open_externally">
                    Open Externally
                </div>`;
            }
            
            menuItems += `
                <div class="menu-separator"></div>
                <div class="menu-item" data-action="get_app_info">
                    Get Info
                </div>`;
            
            return menuItems;
        }
        
        // Desktop context menu
        return `
            <div class="menu-item" data-action="wallpaper_settings">
                Wallpaper Settings...
            </div>
            <div class="menu-item" data-action="next_wallpaper">
                Next Wallpaper
            </div>
            <div class="menu-separator"></div>
            <div class="menu-item" data-action="get_info">
                Get Desktop Info
            </div>
        `;
    }

    /**
     * Bind event handlers
     */
    bindEvents() {
        // Global events
        EventBus.on('preferences:changed', this.onPreferencesChanged.bind(this));
        EventBus.on('wallpaper:change', this.changeWallpaper.bind(this));
        EventBus.on('theme:changed', this.handleThemeChanged.bind(this));
        
        // Window events
        window.addEventListener('resize', this.onWindowResize.bind(this));
        window.addEventListener('beforeunload', this.onBeforeUnload.bind(this));
        
        // Desktop events
        this.container.addEventListener('contextmenu', this.onContextMenu.bind(this));
        this.container.addEventListener('click', this.onDesktopClick.bind(this));
        
        // Context menu events
        this.contextMenu.addEventListener('click', this.onContextMenuClick.bind(this));
        
        // Performance monitoring
        if (this.config.performanceMode === 'auto') {
            this.setupPerformanceMonitoring();
        }
    }

    /**
     * Handle theme changed event
     * @param {object} data - Theme data
     */
    handleThemeChanged(data) {
        console.log('🎨 Desktop: Theme changed to', data.effectiveTheme);
        
        // Optionally coordinate wallpaper selection with theme
        if (this.preferences?.desktop?.wallpaper?.time_based_switching) {
            // Theme and wallpaper are already coordinated by backend
            console.log('✅ Wallpaper already coordinated with theme');
        }
    }

    /**
     * Load user preferences
     */
    async loadPreferences() {
        try {
            const response = await fetch('/api/preferences');
            const data = await response.json();
            
            if (data.success) {
                this.preferences = data.data;
            } else {
                this.preferences = this.getDefaultPreferences();
            }
        } catch (error) {
            console.warn('Failed to load preferences, using defaults:', error);
            this.preferences = this.getDefaultPreferences();
        }
    }

    /**
     * Load wallpapers data with progressive loading
     */
    async loadWallpapers() {
        try {
            const response = await fetch('/api/wallpapers');
            const data = await response.json();
            
            if (data.success) {
                this.wallpapers = data.data;
                
                // Start progressive preloading of thumbnails
                if (this.progressiveLoading) {
                    this.preloadWallpaperThumbnails();
                }
                
                // Set up auto-rotation timer
                this.setupWallpaperRotation();
                
                // Wallpaper selection is handled by setInitialWallpaper() consistently
                console.log('Wallpapers loaded, selection will be handled by setInitialWallpaper()');
            } else {
                this.wallpapers = this.getDefaultWallpapers();
            }
        } catch (error) {
            console.warn('Failed to load wallpapers, using defaults:', error);
            this.wallpapers = this.getDefaultWallpapers();
        }
    }

    /**
     * Load session data
     */
    async loadSessionData() {
        try {
            const stored = localStorage.getItem('desktop_session');
            if (stored) {
                this.sessionData = JSON.parse(stored);
            } else {
                this.sessionData = this.getDefaultSessionData();
            }
        } catch (error) {
            console.warn('Failed to load session data, using defaults:', error);
            this.sessionData = this.getDefaultSessionData();
        }
    }

    /**
     * Load desktop applications data
     */
    async loadDesktopApps() {
        try {
            const response = await fetch('/api/desktop-apps');
            const data = await response.json();
            
            // Handle Laravel API response format
            const appsData = data.success ? data.data : data;
            
            if (appsData && appsData.apps) {
                this.desktopApps = appsData.apps;
                console.log('✅ Desktop apps loaded:', this.desktopApps.length, 'apps');
                // Log external apps with openInNewTab property
                const externalApps = this.desktopApps.filter(app => app.type === 'external');
                console.log('🌐 External apps:', externalApps.map(app => ({ 
                    name: app.name, 
                    openInNewTab: app.openInNewTab,
                    url: app.url 
                })));
                this.createDesktopIcons();
            } else {
                this.desktopApps = this.getDefaultApps();
                this.createDesktopIcons();
            }
        } catch (error) {
            console.warn('Failed to load desktop apps, using defaults:', error);
            this.desktopApps = this.getDefaultApps();
            this.createDesktopIcons();
        }
    }







    async setupDesktop() {
        // Wallpaper is handled by setInitialWallpaper() - don't duplicate logic
        if (!this.currentWallpaper) {
            console.warn('Desktop: No wallpaper set, using fallback');
        }

        // Apply theme preferences
        if (this.preferences.appearance?.theme) {
            document.documentElement.setAttribute('data-theme', this.preferences.appearance.theme);
        }

        // Create desktop icons
        this.createDesktopIcons();
    }

    /**
     * Set initial wallpaper - Single source of truth for wallpaper selection
     * Priority: 1) Saved user choice 2) Backend smart selection 3) Fallback
     */
    async setInitialWallpaper() {
        try {
            let wallpaper = null;
            let selectionSource = 'none';
            
            // Priority 1: Check for saved user wallpaper preference
            wallpaper = this.getSavedWallpaper();
            if (wallpaper) {
                selectionSource = 'saved_preference';
            }
            
            // Priority 2: Get wallpaper data that was selected during page load (same as boot screen)
            if (!wallpaper) {
                // First try to get the wallpaper data that was already selected during page load
                const pageLoadWallpaper = await this.getPageLoadWallpaperData();
                if (pageLoadWallpaper) {
                    wallpaper = pageLoadWallpaper;
                    selectionSource = 'page_load';
                    // Save this as the current wallpaper for preferences to detect
                    await this.saveWallpaperSelection(pageLoadWallpaper);
                } else {
                    // Fallback to smart selection API (same logic as backend)
                    wallpaper = await this.getBackendSelectedWallpaper();
                    if (wallpaper) {
                        selectionSource = 'backend_smart_selection';
                        // Save this selection for consistency
                        await this.saveWallpaperSelection(wallpaper);
                    }
                }
            } else if (wallpaper && !localStorage.getItem('current_wallpaper')) {
                // If we loaded a saved wallpaper but localStorage is empty, save it
                await this.saveWallpaperSelection(wallpaper);
            }
            
            // Priority 3: Fallback to first available wallpaper
            if (!wallpaper && this.wallpapers.length > 0) {
                wallpaper = this.wallpapers[0];
                selectionSource = 'fallback';
                await this.saveWallpaperSelection(wallpaper);
            }
            
            if (wallpaper) {
                // Apply wallpaper consistently
                await this.applyWallpaperConsistently(wallpaper);
                this.currentWallpaper = wallpaper;
            }
        } catch (error) {
            console.error('Failed to set initial wallpaper:', error);
        }
    }

    /**
     * Get saved wallpaper from localStorage or session
     * Returns the user's explicitly saved wallpaper choice
     */
    getSavedWallpaper() {
        try {
            // First check localStorage (highest priority)
            const savedWallpaper = localStorage.getItem('current_wallpaper');
            if (savedWallpaper) {
                const wallpaperData = JSON.parse(savedWallpaper);
                console.log('📁 Found saved wallpaper in localStorage:', wallpaperData.name);
                
                // Check if wallpaper data is complete (has image URLs)
                if (!wallpaperData.fullImage && !wallpaperData.url && !wallpaperData.image) {
                    console.warn('⚠️ Saved wallpaper missing image URLs, searching in loaded collection');
                    
                    // Find the full wallpaper object from our loaded wallpapers
                    if (this.wallpapers.length > 0) {
                        const fullWallpaper = this.wallpapers.find(w => w.id === wallpaperData.id);
                        if (fullWallpaper) {
                            console.log('🎯 Found full wallpaper data in collection:', fullWallpaper.name);
                            // Update localStorage with complete data
                            this.saveWallpaperSelection(fullWallpaper);
                            return fullWallpaper;
                        }
                    }
                    
                    console.error('❌ Could not find complete wallpaper data, clearing localStorage');
                    localStorage.removeItem('current_wallpaper');
                    return null;
                }
                
                // Find the full wallpaper object from our loaded wallpapers (prefer fresh data)
                if (this.wallpapers.length > 0) {
                    const fullWallpaper = this.wallpapers.find(w => w.id === wallpaperData.id);
                    if (fullWallpaper) {
                        console.log('🎯 Matched saved wallpaper with loaded collection:', fullWallpaper.name);
                        return fullWallpaper;
                    }
                }
                
                console.log('📦 Using saved wallpaper data as-is:', wallpaperData.name);
                return wallpaperData;
            }
            
            // Check session data as fallback
            if (this.sessionData?.wallpaper?.id) {
                console.log('📄 Found wallpaper in session data:', this.sessionData.wallpaper.name);
                
                // Validate session data
                if (!this.sessionData.wallpaper.fullImage && !this.sessionData.wallpaper.url) {
                    console.warn('⚠️ Session wallpaper missing image URLs');
                    
                    // Find the full wallpaper object from our loaded wallpapers
                    if (this.wallpapers.length > 0) {
                        const fullWallpaper = this.wallpapers.find(w => w.id === this.sessionData.wallpaper.id);
                        if (fullWallpaper) {
                            console.log('🎯 Found full wallpaper data in collection:', fullWallpaper.name);
                            return fullWallpaper;
                        }
                    }
                    
                    return null;
                }
                
                // Find the full wallpaper object from our loaded wallpapers
                if (this.wallpapers.length > 0) {
                    const fullWallpaper = this.wallpapers.find(w => w.id === this.sessionData.wallpaper.id);
                    if (fullWallpaper) {
                        console.log('🎯 Matched session wallpaper with loaded collection:', fullWallpaper.name);
                        return fullWallpaper;
                    }
                }
                return this.sessionData.wallpaper;
            }
            
            return null;
        } catch (error) {
            console.error('Error getting saved wallpaper:', error);
            // Clear corrupted data
            localStorage.removeItem('current_wallpaper');
            return null;
        }
    }

    /**
     * Get wallpaper selected by backend (same as boot screen)
     * This ensures boot screen and desktop show the same wallpaper
     */
    async getBackendSelectedWallpaper() {
        try {
            const isFirstVisit = this.isFirstTimeUser();
            const userFingerprint = this.generateUserFingerprint();
            const currentHour = new Date().getHours();
            
            console.log('🔄 Getting backend wallpaper selection:', {
                isFirstVisit,
                currentHour,
                fingerprint: userFingerprint.substring(0, 8) + '...'
            });
            
            const response = await fetch(`/api/wallpapers/smart-selection?hour=${currentHour}&fingerprint=${userFingerprint}&firstVisit=${isFirstVisit}`);
            const data = await response.json();
            
            if (data.success && data.data) {
                console.log('✅ Backend selection:', data.data.name, '| Method:', data.metadata?.selectionMethod);
                
                // Find the full wallpaper object from our loaded wallpapers
                const fullWallpaper = this.wallpapers.find(w => w.id === data.data.id);
                if (fullWallpaper) {
                    console.log('🎯 Found matching wallpaper in local collection:', fullWallpaper.name);
                    return fullWallpaper;
                } else {
                    console.log('📦 Using API wallpaper data:', data.data.name);
                    return data.data;
                }
            } else {
                console.warn('⚠️ Backend selection failed:', data.error);
                return null;
            }
        } catch (error) {
            console.error('❌ Failed to get backend wallpaper selection:', error);
            return null;
        }
    }

    /**
     * Apply wallpaper consistently to both body and wallpaper container
     * Ensures smooth transition and consistent appearance
     */
    async applyWallpaperConsistently(wallpaper) {
        if (!wallpaper) return;
        
        const imageUrl = wallpaper.fullImage || wallpaper.url || wallpaper.image;
        if (!imageUrl) {
            console.error('No image URL found for wallpaper:', wallpaper);
            console.log('Available properties:', Object.keys(wallpaper));
            return;
        }
        
        // Log source information
        const source = wallpaper.source || 'unknown';
        console.log(`🎨 Applying wallpaper from ${source}:`, wallpaper.name || wallpaper.id);
        console.log(`   URL: ${imageUrl}`);
        
        // Preload image first
        await this.preloadWallpaperImage(imageUrl);
        
        // Apply to both body (for boot consistency) and container (for desktop)
        this.applyWallpaperWithTransition(imageUrl);
        
        console.log('✅ Wallpaper applied consistently:', wallpaper.name || wallpaper.id);
    }

    /**
     * Preload wallpaper image to ensure smooth application
     */
    async preloadWallpaperImage(imageUrl) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                console.log('🖼️ Wallpaper preloaded successfully');
                resolve();
            };
            img.onerror = () => {
                console.warn('⚠️ Failed to preload wallpaper, continuing anyway');
                resolve(); // Don't reject, continue with application
            };
            img.src = imageUrl;
        });
    }

    /**
     * Get wallpaper data that was selected during page load (from backend)
     * This ensures boot screen and desktop show the same wallpaper
     */
    async getPageLoadWallpaperData() {
        try {
            // First check window.AbdulmeApp.config for wallpaper data set by backend
            if (window.AbdulmeApp?.config?.currentWallpaper) {
                const wallpaperData = window.AbdulmeApp.config.currentWallpaper;
                console.log('📄 Found page load wallpaper from AbdulmeApp config:', wallpaperData.name);
                
                // Find the full wallpaper object from our loaded wallpapers
                const fullWallpaper = this.wallpapers.find(w => w.id === wallpaperData.id);
                if (fullWallpaper) {
                    console.log('🎯 Matched with loaded wallpaper collection:', fullWallpaper.name);
                    return fullWallpaper;
                } else {
                    console.log('📦 Using backend wallpaper data as-is:', wallpaperData.name);
                    return wallpaperData;
                }
            }
            
            // Fallback: Check if it's available in the window or document (older method)
            if (window.selectedWallpaper) {
                console.log('📄 Found legacy page load wallpaper data:', window.selectedWallpaper.name);
                
                // Find the full wallpaper object from our loaded wallpapers
                const fullWallpaper = this.wallpapers.find(w => w.id === window.selectedWallpaper.id);
                return fullWallpaper || window.selectedWallpaper;
            }
            
            // Alternative: Check meta tag or inline script data
            const wallpaperMeta = document.querySelector('meta[name="selected-wallpaper"]');
            if (wallpaperMeta) {
                const wallpaperData = JSON.parse(wallpaperMeta.getAttribute('content'));
                console.log('🏷️ Found wallpaper in meta tag:', wallpaperData.name);
                
                const fullWallpaper = this.wallpapers.find(w => w.id === wallpaperData.id);
                return fullWallpaper || wallpaperData;
            }
            
            console.log('ℹ️ No page load wallpaper data found');
            return null;
        } catch (error) {
            console.error('Error getting page load wallpaper data:', error);
            return null;
        }
    }

    /**
     * Event Handlers
     */

    /**
     * Handle preferences changed event
     */
    onPreferencesChanged(event) {
        console.log('Preferences changed:', event.data);
        this.preferences = { ...this.preferences, ...event.data };
        
        // Apply preference changes
        if (event.data.desktop?.wallpaper) {
            const wallpaper = this.wallpapers.find(w => w.id === event.data.desktop.wallpaper);
            if (wallpaper) {
                this.changeWallpaper(wallpaper);
            }
        }
        
        if (event.data.appearance?.theme) {
            document.documentElement.setAttribute('data-theme', event.data.appearance.theme);
        }
    }

    /**
     * Handle wallpaper change with progressive loading
     */
    async changeWallpaper(wallpaper) {
        if (!wallpaper || !this.wallpaperContainer) return;
        
        // Prevent rapid-fire wallpaper changes
        const now = Date.now();
        if (this.lastWallpaperChange && (now - this.lastWallpaperChange) < 500) {
            console.log('Ignoring rapid wallpaper change request');
            return;
        }
        this.lastWallpaperChange = now;
        
        // Skip if already the current wallpaper
        if (this.currentWallpaper && this.currentWallpaper.id === wallpaper.id) {
            console.log('Wallpaper already active:', wallpaper.id);
            return;
        }
        
        console.log('Changing wallpaper to:', wallpaper.name || wallpaper.id);
        
        try {
            // Build full image URL from different possible properties
            let fullImageUrl;
            
            if (wallpaper.fullImage) {
                fullImageUrl = wallpaper.fullImage;
            } else if (wallpaper.url) {
                fullImageUrl = wallpaper.url;
            } else if (wallpaper.filename) {
                // If only filename is provided, construct the path
                fullImageUrl = `/images/wallpapers/${wallpaper.filename}`;
            } else {
                console.error('Wallpaper object missing image URL/filename:', wallpaper);
                return;
            }
            
            // Validate URL before attempting to load
            if (!fullImageUrl || fullImageUrl.includes('undefined')) {
                console.error('Invalid wallpaper URL:', fullImageUrl, 'Wallpaper object:', wallpaper);
                return;
            }
            
            console.log('Loading wallpaper from:', fullImageUrl);
            
            // Clear old cache (keep only current wallpaper for performance)
            this.wallpaperCache.clear();
            
            // Check if full resolution is already cached
            if (this.wallpaperCache.has(fullImageUrl)) {
                // Use cached full resolution immediately with transition
                this.applyWallpaperWithTransition(fullImageUrl);
            } else {
                // Show loading state if needed
                this.wallpaperContainer.style.transition = 'opacity 0.3s ease';
                
                // Preload full resolution in background
                const preloadImage = new Image();
                preloadImage.onload = () => {
                    // Cache the loaded image (only current one)
                    this.wallpaperCache.set(fullImageUrl, preloadImage);
                    // Apply with smooth transition
                    this.applyWallpaperWithTransition(fullImageUrl);
                };
                preloadImage.onerror = () => {
                    console.error('Failed to load wallpaper:', fullImageUrl);
                    this.loadFallbackWallpaper();
                };
                preloadImage.src = fullImageUrl;
            }
            
            this.currentWallpaper = wallpaper;
            console.log('✅ Current wallpaper set to:', wallpaper.name || wallpaper.id);
            
            EventBus.emit('wallpaper:changed', { wallpaper });
            
            // Save to backend and local storage immediately
            console.log('💾 Starting wallpaper save process...');
            await this.saveWallpaperSelection(wallpaper);
            
            // Update session data immediately
            this.saveCurrentState();
            
            console.log('✅ Wallpaper change complete:', wallpaper.name || wallpaper.id);
            
            // Verify save worked
            const verification = localStorage.getItem('current_wallpaper');
            console.log('🔍 Verification - localStorage after save:', verification ? JSON.parse(verification).name : 'NONE');
            
        } catch (error) {
            console.error('Failed to change wallpaper:', error);
            // Fallback to default wallpaper
            this.loadFallbackWallpaper();
        }
    }
    
    /**
     * Save wallpaper selection - Single source of truth for persistence
     * Saves to both localStorage (immediate) and backend (for sync)
     */
    async saveWallpaperSelection(wallpaper) {
        try {
            console.log('💾 Saving wallpaper selection:', wallpaper.name || wallpaper.id);
            
            // Create standardized wallpaper data
            const wallpaperData = {
                id: wallpaper.id,
                name: wallpaper.name,
                thumbnail: wallpaper.thumbnail,
                fullImage: wallpaper.fullImage,
                category: wallpaper.category,
                type: wallpaper.type,
                colors: wallpaper.colors,
                savedAt: Date.now(),
                source: 'user_selection'
            };
            
            // Save to localStorage immediately (critical for persistence)
            localStorage.setItem('current_wallpaper', JSON.stringify(wallpaperData));
            console.log('✅ Saved to localStorage:', wallpaperData.name);
            
            // Mark as visited if this is first selection
            if (this.isFirstTimeUser()) {
                localStorage.setItem('portfolio_visited', new Date().toISOString());
                console.log('✅ Marked first visit complete');
            }
            
            // Update session data
            this.saveCurrentState();
            
        } catch (error) {
            console.error('❌ Critical error saving wallpaper selection:', error);
        }
    }

    /**
     * Apply wallpaper with smooth transition
     */
    applyWallpaperWithTransition(imageUrl) {
        if (!this.wallpaperContainer) return;
        
        // Add smooth fade transition
        this.wallpaperContainer.style.transition = 'background-image 0.8s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
        
        // Apply new wallpaper
        this.wallpaperContainer.style.backgroundImage = `url('${imageUrl}')`;
        this.wallpaperContainer.style.backgroundSize = 'cover';
        this.wallpaperContainer.style.backgroundPosition = 'center';
        this.wallpaperContainer.style.backgroundRepeat = 'no-repeat';
        this.wallpaperContainer.style.opacity = '1';
        
        // Also set on body for immediate visibility
        document.body.style.transition = 'background-image 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
        document.body.style.backgroundImage = `url('${imageUrl}')`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundRepeat = 'no-repeat';
        
        console.log('Wallpaper applied with smooth transition');
    }


    /**
     * Handle window resize
     */
    onWindowResize() {
        // Update desktop dimensions and icon positions
        if (this.iconsContainer) {
            this.repositionIcons();
        }
        
        // Update wallpaper if needed
        if (this.wallpaperContainer) {
            this.wallpaperContainer.style.width = '100%';
            this.wallpaperContainer.style.height = '100%';
        }
    }

    /**
     * Handle before unload
     */
    onBeforeUnload() {
        // Save current state before page unload
        const sessionData = {
            timestamp: Date.now(),
            wallpaper: this.currentWallpaper,
            preferences: this.preferences
        };
        
        localStorage.setItem('desktop_session', JSON.stringify(sessionData));
    }

    /**
     * Handle desktop context menu
     */
    onContextMenu(event) {
        event.preventDefault();
        
        if (!this.contextMenu) return;
        
        // Update menu content based on what was clicked
        this.contextMenu.innerHTML = this.createContextMenuHTML(event.target);
        
        // Position context menu at cursor
        this.contextMenu.style.left = event.clientX + 'px';
        this.contextMenu.style.top = event.clientY + 'px';
        this.contextMenu.style.display = 'block';
        
        // Store clicked element for context
        this.contextMenuTarget = event.target;
        
        // Close on next click
        setTimeout(() => {
            document.addEventListener('click', () => {
                this.contextMenu.style.display = 'none';
            }, { once: true });
        }, 0);
    }

    /**
     * Handle desktop click
     */
    onDesktopClick(event) {
        // Hide context menu if clicking on empty space
        if (this.contextMenu && event.target === this.container) {
            this.contextMenu.style.display = 'none';
        }
        
        // Deselect any selected icons
        const selectedIcons = this.container.querySelectorAll('.desktop-icon.selected');
        selectedIcons.forEach(icon => icon.classList.remove('selected'));
    }

    /**
     * Handle context menu clicks
     */
    onContextMenuClick(event) {
        event.stopPropagation();
        
        const action = event.target.closest('.menu-item')?.dataset.action;
        if (!action) return;
        
        switch (action) {
            case 'wallpaper_settings':
                this.openSystemPreferences('desktop');
                break;
            case 'next_wallpaper':
                this.switchToNextWallpaper();
                break;
            case 'get_info':
                this.showDesktopInfo();
                break;
            case 'open_app':
                this.openAppFromContextMenu();
                break;
            case 'open_externally':
                this.openAppExternally();
                break;
            case 'get_app_info':
                this.showAppInfo();
                break;
        }
        
        this.contextMenu.style.display = 'none';
    }

    /**
     * Setup performance monitoring
     */
    setupPerformanceMonitoring() {
        let frameCount = 0;
        let lastTime = performance.now();
        
        const measureFPS = () => {
            frameCount++;
            const currentTime = performance.now();
            
            if (currentTime - lastTime >= 1000) {
                const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
                
                // Adjust performance mode if FPS drops
                if (fps < 30 && this.config.performanceMode !== 'low') {
                    this.config.performanceMode = 'low';
                    console.warn('Performance mode switched to low due to low FPS:', fps);
                }
                
                frameCount = 0;
                lastTime = currentTime;
            }
            
            requestAnimationFrame(measureFPS);
        };
        
        requestAnimationFrame(measureFPS);
    }

    /**
     * Utility Methods
     */

    /**
     * Reposition desktop icons after resize
     */
    repositionIcons() {
        if (!this.iconsContainer) return;
        
        const icons = this.iconsContainer.querySelectorAll('.desktop-icon');
        const gridSize = this.config.iconGridSize;
        const containerRect = this.container.getBoundingClientRect();
        
        icons.forEach((icon, index) => {
            const col = Math.floor(index % Math.floor(containerRect.width / gridSize));
            const row = Math.floor(index / Math.floor(containerRect.width / gridSize));
            
            icon.style.left = (col * gridSize) + 'px';
            icon.style.top = (row * gridSize) + 'px';
        });
    }

    /**
     * Open System Preferences to a specific pane
     */
    openSystemPreferences(pane = 'general') {
        console.log('Opening System Preferences:', pane);
        
        // Emit app launch event with pane parameter
        EventBus.emit('app:launch', {
            appId: 'preferences',
            name: 'System Preferences',
            component: 'Preferences',
            initialPane: pane // Pass the pane to open
        });
    }

    /**
     * Switch to next wallpaper in current theme
     */
    async switchToNextWallpaper() {
        try {
            console.log('🔄 Next wallpaper requested');
            console.log('📦 Wallpapers array:', this.wallpapers);
            console.log('📊 Wallpapers count:', this.wallpapers?.length);
            
            let currentTheme = this.preferences?.appearance?.theme || 'light';
            
            // Resolve "auto" theme to actual light/dark based on time or system preference
            if (currentTheme === 'auto') {
                const hour = new Date().getHours();
                currentTheme = (hour >= 6 && hour < 18) ? 'light' : 'dark';
                console.log('🌓 Auto theme resolved to:', currentTheme, `(hour: ${hour})`);
            }
            
            console.log('🎨 Current theme:', currentTheme);
            
            // Ensure wallpapers are loaded
            if (!this.wallpapers || this.wallpapers.length === 0) {
                console.warn('❌ No wallpapers loaded yet');
                EventBus.emit('notification:show', {
                    title: 'No Wallpapers',
                    message: 'Wallpaper collection not loaded yet. Please refresh the page.',
                    type: 'warning',
                    duration: 3000
                });
                return;
            }
            
            // Get wallpapers for current theme from this.wallpapers array
            // Wallpapers use 'type' property (light/dark/both) not 'theme'
            const availableWallpapers = this.wallpapers.filter(w => 
                w.type === currentTheme || w.type === 'both'
            );
            
            console.log('🖼️ Available wallpapers for theme:', availableWallpapers.length);
            
            if (availableWallpapers.length === 0) {
                console.warn('❌ No wallpapers available for theme:', currentTheme);
                console.warn('All wallpapers:', this.wallpapers.map(w => ({ name: w.name, type: w.type })));
                EventBus.emit('notification:show', {
                    title: 'No Wallpapers',
                    message: `No wallpapers available for ${currentTheme} theme`,
                    type: 'warning',
                    duration: 3000
                });
                return;
            }

            // Get current wallpaper from localStorage or currentWallpaper
            let currentWallpaperId = null;
            try {
                const stored = localStorage.getItem('current_wallpaper');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    currentWallpaperId = parsed.id;
                    console.log('📍 Current wallpaper ID:', currentWallpaperId);
                }
            } catch (e) {
                console.warn('⚠️ Could not parse current wallpaper:', e);
            }
            
            // Find current wallpaper index
            const currentIndex = availableWallpapers.findIndex(w => w.id === currentWallpaperId);
            const nextIndex = (currentIndex + 1) % availableWallpapers.length;
            const nextWallpaper = availableWallpapers[nextIndex];

            console.log('✅ Switching to next wallpaper:', nextWallpaper.name);
            
            // Save and apply the new wallpaper
            await this.saveWallpaperSelection(nextWallpaper);
            await this.applyWallpaperConsistently(nextWallpaper);
            this.currentWallpaper = nextWallpaper;
            
            EventBus.emit('notification:show', {
                title: 'Wallpaper Changed',
                message: `Now showing: ${nextWallpaper.name}`,
                type: 'success',
                duration: 2000
            });
        } catch (error) {
            console.error('❌ Failed to switch wallpaper:', error);
            EventBus.emit('notification:show', {
                title: 'Error',
                message: 'Failed to change wallpaper',
                type: 'error',
                duration: 3000
            });
        }
    }

    /**
     * Open wallpaper selector modal
     */
    openWallpaperSelector() {
        console.log('Opening wallpaper selector');
        
        // Create modal overlay
        const modal = document.createElement('div');
        modal.className = 'wallpaper-selector-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(20px);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 300ms ease;
        `;
        
        // Create selector panel
        const panel = document.createElement('div');
        panel.className = 'wallpaper-panel';
        panel.style.cssText = `
            background: rgba(255, 255, 255, 0.9);
            border-radius: 12px;
            padding: 20px;
            max-width: 800px;
            max-height: 600px;
            overflow-y: auto;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            transform: scale(0.9);
            transition: transform 300ms ease;
        `;
        
        // Create header
        const header = document.createElement('div');
        header.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="margin: 0; font-size: 18px; color: ${LinkOS_COLORS.TEXT_PRIMARY};">Choose a Wallpaper</h3>
                <button class="close-btn" style="
                    background: ${LinkOS_COLORS.WINDOW_CLOSE};
                    border: none;
                    border-radius: 50%;
                    width: 20px;
                    height: 20px;
                    cursor: pointer;
                ">\u2715</button>
            </div>
        `;
        
        // Create wallpaper grid
        const grid = document.createElement('div');
        grid.className = 'wallpaper-grid';
        grid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 12px;
        `;
        
        // Add wallpapers to grid
        this.wallpapers.forEach(wallpaper => {
            const item = document.createElement('div');
            item.className = 'wallpaper-item';
            item.style.cssText = `
                aspect-ratio: 16/10;
                border-radius: 8px;
                overflow: hidden;
                cursor: pointer;
                border: 3px solid ${wallpaper.id === this.currentWallpaper?.id ? LinkOS_COLORS.SYSTEM_BLUE : LinkOS_COLORS.TRANSPARENT};
                transition: all 200ms ease;
                background-image: url(${wallpaper.thumbnail || wallpaper.fullImage});
                background-size: cover;
                background-position: center;
                position: relative;
            `;
            
            // Add hover effect
            item.addEventListener('mouseenter', () => {
                if (wallpaper.id !== this.currentWallpaper?.id) {
                    item.style.transform = 'scale(1.05)';
                    item.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.3)';
                }
            });
            
            item.addEventListener('mouseleave', () => {
                item.style.transform = 'scale(1)';
                item.style.boxShadow = 'none';
            });
            
            // Add wallpaper name overlay
            const nameOverlay = document.createElement('div');
            nameOverlay.style.cssText = `
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
                color: white;
                padding: 8px;
                font-size: 12px;
                text-align: center;
            `;
            nameOverlay.textContent = wallpaper.name || wallpaper.id;
            item.appendChild(nameOverlay);
            
            // Handle wallpaper selection
            item.addEventListener('click', async () => {
                try {
                    await this.changeWallpaper(wallpaper);
                    
                    // Update selection visual
                    grid.querySelectorAll('.wallpaper-item').forEach(el => {
                        el.style.border = `3px solid ${LinkOS_COLORS.TRANSPARENT}`;
                    });
                    item.style.border = `3px solid ${LinkOS_COLORS.SYSTEM_BLUE}`;
                    
                    // Close modal after short delay
                    setTimeout(() => {
                        modal.click();
                    }, 500);
                } catch (error) {
                    console.error('Failed to select wallpaper:', error);
                }
            });
            
            grid.appendChild(item);
        });
        
        // Assemble modal
        panel.appendChild(header);
        panel.appendChild(grid);
        modal.appendChild(panel);
        document.body.appendChild(modal);
        
        // Handle close button
        const closeBtn = panel.querySelector('.close-btn');
        closeBtn.addEventListener('click', () => modal.click());
        
        // Handle modal close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.opacity = '0';
                panel.style.transform = 'scale(0.9)';
                setTimeout(() => {
                    if (modal.parentNode) {
                        modal.parentNode.removeChild(modal);
                    }
                }, 300);
            }
        });
        
        // Animate in
        requestAnimationFrame(() => {
            modal.style.opacity = '1';
            panel.style.transform = 'scale(1)';
        });
        
        EventBus.emit('wallpaper:selector:opened');
    }

    /**
     * Show desktop information
     */
    showDesktopInfo() {
        console.log('Showing desktop info');
        
        // Get current wallpaper info dynamically
        let wallpaperName = 'Unknown';
        let wallpaperCategory = '';
        try {
            const stored = localStorage.getItem('current_wallpaper');
            if (stored) {
                const parsed = JSON.parse(stored);
                wallpaperName = parsed.name || 'Unknown';
                wallpaperCategory = parsed.category ? ` (${parsed.category})` : '';
            }
        } catch (e) {
            wallpaperName = 'Unknown';
        }
        
        // Get current theme
        const currentTheme = this.preferences?.appearance?.theme || 'light';
        const themeDisplay = currentTheme.charAt(0).toUpperCase() + currentTheme.slice(1);
        
        // Count visible icons
        const visibleIcons = this.iconsContainer?.querySelectorAll('.desktop-icon').length || 0;
        
        // Get total apps available
        const totalApps = this.desktopApps?.length || 0;
        
        // Get wallpapers count (total and for current theme)
        // Note: wallpapers use 'type' property (light/dark/both) not 'theme'
        const totalWallpapers = this.wallpapers?.length || 0;
        const themeWallpapers = this.wallpapers?.filter(w => 
            w.type === currentTheme || w.type === 'both'
        ).length || 0;
        
        const info = {
            wallpaper: wallpaperName + wallpaperCategory,
            theme: themeDisplay,
            icons: visibleIcons,
            totalApps: totalApps,
            resolution: `${window.innerWidth} × ${window.innerHeight}`,
            wallpapersTotal: totalWallpapers,
            wallpapersTheme: themeWallpapers
        };

        EventBus.emit('notification:show', {
            title: 'Desktop Information',
            message: `Theme: ${info.theme}\nWallpaper: ${info.wallpaper}\n\nDesktop Icons: ${info.icons}\nTotal Apps: ${info.totalApps}\nWallpapers: ${info.wallpapersTheme} of ${info.wallpapersTotal}\nResolution: ${info.resolution}`,
            type: 'info',
            duration: 6000
        });
    }

    /**
     * Open app from context menu
     */
    openAppFromContextMenu() {
        const appIcon = this.contextMenuTarget?.closest?.('.desktop-icon');
        if (appIcon) {
            appIcon.click(); // Trigger the app's click handler
        }
    }

    /**
     * Open app externally in new tab/window
     */
    openAppExternally() {
        const appIcon = this.contextMenuTarget?.closest?.('.desktop-icon');
        if (!appIcon) return;
        
        const appId = appIcon.dataset.appId;
        const app = this.desktopApps.find(a => a.id === appId);
        
        if (!app) return;
        
        let externalUrl = null;
        
        // Handle external links
        if (app.type === 'external' && app.url) {
            externalUrl = app.url;
        }
        
        // Handle documents (PDFs)
        if (app.type === 'document' && app.filePath) {
            // Convert relative path to absolute URL
            externalUrl = window.location.origin + app.filePath;
        }
        
        if (externalUrl) {
            window.open(externalUrl, '_blank', 'noopener,noreferrer');
            console.log('🌐 Opened externally:', externalUrl);
        }
    }

    /**
     * Show application information
     */
    showAppInfo() {
        const appIcon = this.contextMenuTarget?.closest?.('.desktop-icon');
        if (!appIcon) return;
        
        const appId = appIcon.dataset.appId || 'unknown';
        
        // Find app from loaded desktop apps
        const app = this.desktopApps.find(a => a.id === appId);
        
        if (!app) {
            EventBus.emit('notification:show', {
                title: 'Application',
                message: 'Application information not available',
                type: 'warning',
                duration: 3000
            });
            return;
        }
        
        // Calculate app size dynamically (estimate based on type)
        const estimatedSize = this.estimateAppSize(app);
        const appType = this.getAppType(app);
        const version = this.getAppVersion(app);
        
        EventBus.emit('notification:show', {
            title: app.name,
            message: `${app.description || 'No description available'}\n\nType: ${appType}\nVersion: ${version}\nSize: ${estimatedSize}`,
            type: 'info',
            duration: 7000
        });
    }

    /**
     * Get application type based on app properties
     */
    getAppType(app) {
        if (app.type === 'external') {
            return 'External Link';
        }
        
        // Categorize based on component or id
        const systemApps = ['preferences', 'finder', 'terminal'];
        const utilityApps = ['calculator', 'notes', 'calendar'];
        
        if (systemApps.includes(app.id)) {
            return 'System Application';
        } else if (utilityApps.includes(app.id)) {
            return 'Utility';
        } else if (app.id === 'portfolio') {
            return 'Portfolio Application';
        } else if (app.id === 'browser') {
            return 'Internet Application';
        }
        
        return 'Application';
    }

    /**
     * Estimate app size (in reality, this would come from build system)
     * TODO: In production, calculate actual bundle sizes from webpack stats
     * or store in desktop-apps.json with actual build sizes
     */
    estimateAppSize(app) {
        // Base size on app type and complexity
        if (app.type === 'external') {
            return 'N/A (External)';
        }
        
        // TODO: Replace with actual sizes from build manifest
        // These are estimates - in production should use real bundle analysis
        const componentSizes = {
            'portfolio': '2.4 MB',
            'terminal': '850 KB',
            'preferences': '1.2 MB',
            'finder': '3.1 MB',
            'browser': '4.5 MB',
            'about': '1.8 MB',
            'contact': '1.1 MB',
            'calculator': '450 KB',
            'notes': '680 KB'
        };
        
        return componentSizes[app.id] || '~1.0 MB';
    }

    /**
     * Get app version (could come from package.json or app metadata)
     * TODO: Pull version from app component's package.json or metadata
     * Consider adding 'version' field to desktop-apps.json
     */
    getAppVersion(app) {
        // In production, this should come from app manifest or package.json
        // For now, use semantic versioning based on app maturity
        const versions = {
            'portfolio': '2.1.0',
            'terminal': '1.5.2',
            'preferences': '1.0.0',
            'finder': '1.8.3',
            'browser': '1.2.1',
            'about': '1.4.0',
            'contact': '1.3.0',
            'calculator': '1.0.1',
            'github': 'External',
            'linkedin': 'External'
        };
        
        return versions[app.id] || '1.0.0';
    }

    /**
     * Get detailed app information (LEGACY - kept for backward compatibility)
     * @deprecated Use app data from this.desktopApps instead
     */
    getAppDetails(appId, appName) {
        // Find app from loaded apps
        const app = this.desktopApps.find(a => a.id === appId);
        
        if (app) {
            return {
                description: app.description || 'Application',
                type: this.getAppType(app),
                version: this.getAppVersion(app),
                size: this.estimateAppSize(app)
            };
        }
        
        // Fallback for unknown apps
        return {
            description: 'Application',
            type: 'Application',
            version: '1.0.0',
            size: 'Unknown'
        };
    }

    /**
     * Load image with promise
     */
    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    /**
     * Delay utility
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Animation utility
     */
    animate(element, keyframes, options) {
        if (this.config.performanceMode === 'low') {
            return Promise.resolve();
        }
        
        return element.animate(keyframes, options).finished;
    }

    /**
     * Get progress text based on percentage
     */
    getProgressText(percentage) {
        if (percentage < 20) return 'Starting up...';
        if (percentage < 40) return 'Loading components...';
        if (percentage < 60) return 'Initializing systems...';
        if (percentage < 80) return 'Preparing desktop...';
        return 'Almost ready...';
    }

    /**
     * Get default boot messages
     */
    getDefaultBootMessages() {
        return [
            'Initializing AbdulmeLink Portfolio...',
            'Loading LinkOS interface...',
            'Configuring EventBus system...',
            'Loading wallpapers and assets...',
            'Setting up desktop environment...',
            'Starting services...',
            'Almost ready...'
        ];
    }

    /**
     * Detect device performance mode
     */
    detectPerformanceMode() {
        const isMobile = /Mobi|Android/i.test(navigator.userAgent);
        const cores = navigator.hardwareConcurrency || 2;
        const memory = navigator.deviceMemory || 2;
        
        const isLowEnd = cores < 4 || memory < 4;
        
        if (isMobile || isLowEnd) return 'mobile';
        if (cores >= 8 && memory >= 8) return 'high';
        return 'auto';
    }

    /**
     * Get default preferences
     */
    getDefaultPreferences() {
        return {
            appearance: {
                theme: 'auto',
                transparency: 0.9
            },
            desktop: {
                wallpaper: null,
                autoRotate: true,
                showLabels: true
            },
            performance: {
                animations: true,
                effects: true,
                quality: 'auto'
            }
        };
    }

    /**
     * Get default wallpapers
     */
    getDefaultWallpapers() {
        return [
            {
                id: 'default-1',
                name: 'LinkOS Big Sur',
                url: '/images/wallpapers/big-sur.jpg',
                thumbnail: '/images/wallpapers/thumbs/big-sur.jpg',
                type: 'light'
            },
            {
                id: 'default-2',
                name: 'LinkOS Monterey',
                url: '/images/wallpapers/monterey.jpg',
                thumbnail: '/images/wallpapers/thumbs/monterey.jpg',
                type: 'dark'
            }
        ];
    }

    /**
     * Get default session data
     */
    getDefaultSessionData() {
        return {
            timestamp: Date.now(),
            firstVisit: true,
            bootCount: 1
        };
    }

    /**
     * Get default desktop applications
     */
    getDefaultApps() {
        return [
            {
                id: 'portfolio',
                name: 'Portfolio',
                icon: '/images/icons/portfolio.png',
                type: 'internal',
                component: 'Portfolio',
                position: { x: 60, y: 60 },
                featured: true
            },
            {
                id: 'terminal',
                name: 'Terminal',
                icon: '/images/icons/terminal.png',
                type: 'internal', 
                component: 'Terminal',
                position: { x: 180, y: 60 },
                featured: true
            },
            {
                id: 'about',
                name: 'About Me',
                icon: '/images/icons/about.png',
                type: 'internal',
                component: 'About', 
                position: { x: 300, y: 60 },
                featured: true
            },
            {
                id: 'contact',
                name: 'Contact',
                icon: '/images/icons/contact.png',
                type: 'internal',
                component: 'Contact',
                position: { x: 420, y: 60 },
                featured: true
            }
        ];
    }

    /**
     * Create desktop icons for all apps
     */
    createDesktopIcons() {
        if (!this.iconsContainer) return;
        
        // Clear existing icons
        this.iconsContainer.innerHTML = '';
        
        // Get apps to show (featured by default unless preferences say otherwise)
        const showAllApps = this.preferences.desktop?.showAllApps !== false;
        const appsToShow = showAllApps ? this.desktopApps : this.desktopApps.filter(app => app.featured);
        
        appsToShow.forEach(app => {
            this.createDesktopIcon(app);
        });
        
        console.log(`Created ${appsToShow.length} desktop icons`);
    }

    /**
     * Create individual desktop icon
     */
    createDesktopIcon(app) {
        const icon = document.createElement('div');
        icon.className = 'desktop-icon';
        icon.dataset.appId = app.id;
        icon.dataset.appType = app.type;
        
        // Set initial position
        icon.style.cssText = `
            position: absolute;
            left: ${app.position.x}px;
            top: ${app.position.y}px;
            width: 80px;
            cursor: pointer;
            user-select: none;
            transform-origin: center;
            transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
        `;
        
        // Create icon image
        const iconImg = document.createElement('div');
        iconImg.className = 'icon-image';
        iconImg.style.cssText = `
            width: 64px;
            height: 64px;
            background-image: url(${app.icon});
            background-size: cover;
            background-position: center;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
            transition: all 200ms ease;
        `;
        
        // Create icon label
        const showLabels = this.preferences.desktop?.showIconLabels !== false;
        let iconLabel = null;
        
        if (showLabels) {
            iconLabel = document.createElement('div');
            iconLabel.className = 'icon-label';
            iconLabel.textContent = app.name;
            iconLabel.style.cssText = `
                color: white;
                font-size: 11px;
                font-weight: 500;
                text-align: center;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
                max-width: 80px;
                line-height: 1.2;
                word-wrap: break-word;
            `;
        }
        
        // Assemble icon
        icon.appendChild(iconImg);
        if (iconLabel) {
            icon.appendChild(iconLabel);
        }
        
        // Add event listeners
        this.addIconEventListeners(icon, app);
        
        // Add to container
        this.iconsContainer.appendChild(icon);
    }

    /**
     * Add event listeners to desktop icon
     */
    addIconEventListeners(iconElement, app) {
        const iconImg = iconElement.querySelector('.icon-image');
        let isDragging = false;
        let dragStartPos = { x: 0, y: 0 };
        let iconStartPos = { x: 0, y: 0 };
        
        // Hover effects
        iconElement.addEventListener('mouseenter', () => {
            if (!isDragging) {
                iconImg.style.transform = 'scale(1.1) rotate(5deg)';
                iconImg.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.4)';
            }
        });
        
        iconElement.addEventListener('mouseleave', () => {
            if (!isDragging) {
                iconImg.style.transform = 'scale(1) rotate(0deg)';
                iconImg.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
            }
        });
        
        // Double-click to open app
        iconElement.addEventListener('dblclick', (e) => {
            e.preventDefault();
            this.openApp(app);
        });
        
        // Drag functionality
        iconElement.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return; // Only left mouse button
            
            isDragging = true;
            iconElement.style.opacity = '0.8';
            iconElement.style.zIndex = '9999';
            
            dragStartPos = { x: e.clientX, y: e.clientY };
            const rect = iconElement.getBoundingClientRect();
            iconStartPos = { x: rect.left, y: rect.top };
            
            e.preventDefault();
        });
        
        // Global mouse move for dragging
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const deltaX = e.clientX - dragStartPos.x;
            const deltaY = e.clientY - dragStartPos.y;
            
            const newX = iconStartPos.x + deltaX;
            const newY = iconStartPos.y + deltaY;
            
            iconElement.style.left = newX + 'px';
            iconElement.style.top = newY + 'px';
        });
        
        // Global mouse up to end dragging
        document.addEventListener('mouseup', (e) => {
            if (!isDragging) return;
            
            isDragging = false;
            iconElement.style.opacity = '1';
            iconElement.style.zIndex = 'auto';
            
            // Snap to grid
            const rect = iconElement.getBoundingClientRect();
            const snappedPos = this.snapToGrid({ x: rect.left, y: rect.top });
            
            iconElement.style.left = snappedPos.x + 'px';
            iconElement.style.top = snappedPos.y + 'px';
            
            // Update app position
            app.position = snappedPos;
            
            // Save positions
            this.saveIconPositions();
            
            // Reset hover effects
            iconImg.style.transform = 'scale(1) rotate(0deg)';
            iconImg.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
        });
    }

    /**
     * Snap position to grid
     */
    snapToGrid(position) {
        const gridSize = this.config.iconGridSize;
        const snapThreshold = 15;
        
        const snappedX = Math.round(position.x / gridSize) * gridSize;
        const snappedY = Math.round(position.y / gridSize) * gridSize;
        
        // Only snap if close enough
        const deltaX = Math.abs(position.x - snappedX);
        const deltaY = Math.abs(position.y - snappedY);
        
        return {
            x: deltaX < snapThreshold ? snappedX : position.x,
            y: deltaY < snapThreshold ? snappedY : position.y
        };
    }

    /**
     * Open desktop application
     */
    openApp(app) {
        console.log('Opening app:', app.name, 'Type:', app.type, 'openInNewTab:', app.openInNewTab, 'URL:', app.url);
        
        if (app.type === 'document') {
            // Open document file (PDF, etc.) in file viewer
            const fileName = app.filePath ? app.filePath.split('/').pop() : app.name + '.pdf';
            EventBus.emit('file:open', {
                path: app.filePath || `/documents/${fileName}`,
                name: fileName,
                content: '', // PDF content loaded by iframe
                size: 0,
                modified: new Date().toISOString(),
                type: app.fileType || 'pdf'
            });
            console.log('📄 Opened document:', fileName);
        } else if (app.type === 'external' || app.type === 'link') {
            // Check if app should open in new tab directly
            if (app.openInNewTab === true) {
                // Open directly in new browser tab (for sites that block iframes)
                window.open(app.url, '_blank', 'noopener,noreferrer');
                console.log('🌐 Opened in new tab:', app.url);
            } else {
                // Open in browser app with iframe (default behavior)
                EventBus.emit('app:launch', {
                    appId: 'browser',
                    url: app.url,
                    name: 'Browser'
                });
            }
        } else {
            // Open internal component via EventBus
            EventBus.emit('app:launch', {
                appId: app.id,
                component: app.component,
                name: app.name,
                config: {
                    title: app.name,
                    size: app.size || { width: 800, height: 600 }
                }
            });
        }
        
        // Add to recent apps
        this.addToRecentApps(app);
    }

    /**
     * Add app to recent apps list
     */
    addToRecentApps(app) {
        if (!this.sessionData.recentApps) {
            this.sessionData.recentApps = [];
        }
        
        // Remove if already exists
        this.sessionData.recentApps = this.sessionData.recentApps.filter(recent => recent.id !== app.id);
        
        // Add to beginning
        this.sessionData.recentApps.unshift({
            id: app.id,
            name: app.name,
            timestamp: Date.now()
        });
        
        // Keep only last 10
        this.sessionData.recentApps = this.sessionData.recentApps.slice(0, 10);
        
        // Save session data
        this.saveCurrentState();
    }

    /**
     * Save desktop icon positions
     */
    saveIconPositions() {
        const positions = {};
        
        const icons = this.iconsContainer.querySelectorAll('.desktop-icon');
        icons.forEach(iconElement => {
            const appId = iconElement.dataset.appId;
            const rect = iconElement.getBoundingClientRect();
            positions[appId] = {
                x: parseInt(iconElement.style.left),
                y: parseInt(iconElement.style.top)
            };
        });
        
        localStorage.setItem('desktop_icon_positions', JSON.stringify(positions));
    }

    /**
     * Load saved icon positions
     */
    loadIconPositions() {
        try {
            const saved = localStorage.getItem('desktop_icon_positions');
            if (saved) {
                const positions = JSON.parse(saved);
                
                // Update app positions
                this.desktopApps.forEach(app => {
                    if (positions[app.id]) {
                        app.position = positions[app.id];
                    }
                });
            }
        } catch (error) {
            console.warn('Failed to load icon positions:', error);
        }
    }

    /**
     * Reposition icons after window resize
     */
    repositionIcons() {
        if (!this.iconsContainer) return;
        
        const containerRect = this.iconsContainer.getBoundingClientRect();
        const icons = this.iconsContainer.querySelectorAll('.desktop-icon');
        
        icons.forEach(iconElement => {
            const rect = iconElement.getBoundingClientRect();
            
            // Keep icons within bounds
            let x = parseInt(iconElement.style.left);
            let y = parseInt(iconElement.style.top);
            
            if (x + 64 > containerRect.width) {
                x = containerRect.width - 64 - 20;
            }
            if (y + 64 > containerRect.height) {
                y = containerRect.height - 64 - 20;
            }
            
            iconElement.style.left = Math.max(20, x) + 'px';
            iconElement.style.top = Math.max(20, y) + 'px';
        });
    }

    /**
     * Handle error conditions
     */
    handleError(error) {
        console.error('Desktop error:', error);
        
        // Hide boot overlay if it's showing
        if (this.bootOverlay && this.isBooting) {
            this.bootOverlay.style.display = 'none';
            this.isBooting = false;
        }
        
        EventBus.emit('desktop:error', { error: error.message });
    }

    /**
     * Progressive wallpaper loading - Load image with caching and transition
     */
    async loadWallpaperImage(imageUrl, isThumbnail = false) {
        return new Promise((resolve, reject) => {
            // Check cache first
            if (this.wallpaperCache.has(imageUrl)) {
                this.applyWallpaperImage(imageUrl);
                resolve();
                return;
            }
            
            const img = new Image();
            
            img.onload = () => {
                // Cache the loaded image
                this.wallpaperCache.set(imageUrl, img);
                
                // Apply with smooth transition
                this.applyWallpaperImage(imageUrl, isThumbnail);
                resolve();
            };
            
            img.onerror = () => {
                console.error('Failed to load wallpaper image:', imageUrl);
                reject(new Error(`Failed to load ${isThumbnail ? 'thumbnail' : 'wallpaper'}: ${imageUrl}`));
            };
            
            img.src = imageUrl;
        });
    }

    /**
     * Apply wallpaper image with smooth crossfade transition
     */
    applyWallpaperImage(imageUrl, isThumbnail = false) {
        if (!this.wallpaperContainer) return;
        
        const duration = this.config.wallpaperTransitionDuration;
        
        // Create temporary container for crossfade effect
        if (!isThumbnail && this.wallpaperContainer.style.backgroundImage) {
            const tempContainer = this.wallpaperContainer.cloneNode(false);
            tempContainer.style.opacity = '0';
            tempContainer.style.backgroundImage = `url(${imageUrl})`;
            tempContainer.style.transition = `opacity ${duration}ms ease-in-out`;
            
            this.wallpaperContainer.parentNode.appendChild(tempContainer);
            
            // Trigger transition
            requestAnimationFrame(() => {
                tempContainer.style.opacity = '1';
                this.wallpaperContainer.style.opacity = '0';
                
                setTimeout(() => {
                    this.wallpaperContainer.style.backgroundImage = `url(${imageUrl})`; 
                    this.wallpaperContainer.style.opacity = '1';
                    this.wallpaperContainer.style.transition = '';
                    tempContainer.remove();
                }, duration);
            });
        } else {
            // Direct application for thumbnails or first load
            this.wallpaperContainer.style.backgroundImage = `url(${imageUrl})`;
        }
    }

    /**
     * Preload wallpaper thumbnails for faster switching
     */
    async preloadWallpaperThumbnails() {
        if (!this.wallpapers || this.wallpapers.length === 0) return;
        
        console.log('Preloading wallpaper thumbnails...');
        
        const preloadPromises = this.wallpapers
            .filter(wallpaper => wallpaper.thumbnail)
            .slice(0, 10) // Limit to first 10 to avoid overwhelming bandwidth
            .map(wallpaper => {
                return new Promise((resolve) => {
                    const img = new Image();
                    img.onload = () => {
                        this.wallpaperCache.set(wallpaper.thumbnail, img);
                        resolve();
                    };
                    img.onerror = () => resolve(); // Don't fail the whole preload
                    img.src = wallpaper.thumbnail;
                });
            });
            
        await Promise.all(preloadPromises);
        console.log('Thumbnails preloaded successfully');
    }

    /**
     * Setup automatic wallpaper rotation timer
     */
    setupWallpaperRotation() {
        // Clear existing timer
        if (this.rotationTimer) {
            clearInterval(this.rotationTimer);
        }
        
        // Check if auto-rotation is enabled in preferences
        const rotationEnabled = this.preferences.desktop?.autoRotation !== false;
        
        if (rotationEnabled && this.wallpapers.length > 1) {
            this.rotationTimer = setInterval(() => {
                this.rotateToNextWallpaper();
            }, this.config.rotationInterval);
            
            console.log(`Auto-rotation enabled: every ${this.config.rotationInterval / 60000} minutes`);
        }
    }

    /**
     * Rotate to next wallpaper based on time or random selection
     */
    async rotateToNextWallpaper() {
        try {
            // Prefer time-based wallpapers
            const timeBasedWallpaper = await this.getTimeBasedWallpaper();
            
            if (timeBasedWallpaper && timeBasedWallpaper.id !== this.currentWallpaper?.id) {
                await this.changeWallpaper(timeBasedWallpaper);
                return;
            }
            
            // Fallback to random selection
            if (this.wallpapers.length > 1) {
                const availableWallpapers = this.wallpapers.filter(w => 
                    w.id !== this.currentWallpaper?.id
                );
                
                if (availableWallpapers.length > 0) {
                    const randomIndex = Math.floor(Math.random() * availableWallpapers.length);
                    const nextWallpaper = availableWallpapers[randomIndex];
                    await this.changeWallpaper(nextWallpaper);
                }
            }
        } catch (error) {
            console.error('Failed to rotate wallpaper:', error);
        }
    }

    /**
     * Load time-based wallpaper from API
     */
    async loadTimeBasedWallpaper() {
        try {
            // Don't override user's saved wallpaper preference
            const hasSavedWallpaper = localStorage.getItem('current_wallpaper') || (this.sessionData?.wallpaper);
            if (hasSavedWallpaper) {
                console.log('User has saved wallpaper preference, skipping time-based loading');
                return;
            }
            
            console.log('Loading time-based wallpaper...');
            const wallpaper = await this.getTimeBasedWallpaper();
            if (wallpaper) {
                await this.changeWallpaper(wallpaper);
            }
        } catch (error) {
            console.warn('Failed to load time-based wallpaper:', error);
        }
    }

    /**
     * Get time-appropriate wallpaper
     */
    async getTimeBasedWallpaper() {
        try {
            const response = await fetch('/api/wallpapers/time-based');
            const data = await response.json();
            
            if (data.success && data.data.length > 0) {
                return data.data[0]; // API returns best match first
            }
            
            return null;
        } catch (error) {
            console.error('Failed to get time-based wallpaper:', error);
            return null;
        }
    }

    /**
     * Load fallback wallpaper on errors
     */
    loadFallbackWallpaper() {
        const fallback = {
            id: 'fallback',
            name: 'Default',
            fullImage: '/images/wallpapers/default.jpg',
            thumbnail: '/images/wallpapers/default.jpg'
        };
        
        // Simple fallback without progressive loading
        this.wallpaperContainer.style.backgroundImage = `url(${fallback.fullImage})`;
        this.currentWallpaper = fallback;
    }

    /**
     * Save current desktop state
     */
    saveCurrentState() {
        const sessionData = {
            timestamp: Date.now(),
            wallpaper: this.currentWallpaper,
            preferences: this.preferences,
            bootCount: (this.sessionData?.bootCount || 0)
        };
        
        try {
            localStorage.setItem('desktop_session', JSON.stringify(sessionData));
            // Update the local sessionData object so it's immediately available
            this.sessionData = sessionData;
            console.log('Desktop state saved with wallpaper:', this.currentWallpaper?.name || this.currentWallpaper?.id);
        } catch (error) {
            console.warn('Failed to save desktop state:', error);
        }
    }

    /**
     * Clean up resources and timers
     */
    destroy() {
        // Clear rotation timer
        if (this.rotationTimer) {
            clearInterval(this.rotationTimer);
            this.rotationTimer = null;
        }
        
        // Clear wallpaper cache
        this.wallpaperCache.clear();
        
        // Remove event listeners
        EventBus.off('wallpaper:change', this.changeWallpaper.bind(this));
        EventBus.off('preferences:changed', this.onPreferencesChanged.bind(this));
        
        console.log('Desktop component destroyed and cleaned up');
    }
    
    /**
     * Get random default wallpaper for first-time users
     * Uses deterministic randomization based on browser/session fingerprint
     */
    getRandomDefaultWallpaper() {
        try {
            // Create a unique identifier for this browser/user
            const fingerprint = this.generateUserFingerprint();
            
            // Use fingerprint to deterministically select a wallpaper
            const availableWallpapers = this.wallpapers.filter(w => 
                w.category === 'System' || w.category === 'Classic'
            );
            
            if (availableWallpapers.length === 0) {
                return this.wallpapers[0] || null;
            }
            
            // Create deterministic random index from fingerprint
            let hash = 0;
            for (let i = 0; i < fingerprint.length; i++) {
                const char = fingerprint.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32-bit integer
            }
            
            const index = Math.abs(hash) % availableWallpapers.length;
            const selectedWallpaper = availableWallpapers[index];
            
            console.log(`🎲 New user detected! Assigned random default wallpaper: ${selectedWallpaper.name} (index ${index}/${availableWallpapers.length})`);
            console.log(`👤 User fingerprint: ${fingerprint.substring(0, 8)}...`);
            
            return selectedWallpaper;
            
        } catch (error) {
            console.error('Error generating random default wallpaper:', error);
            return this.wallpapers[0] || null;
        }
    }
    
    /**
     * Generate a semi-unique fingerprint for this browser/user
     * Combines various browser characteristics for deterministic randomization
     */
    generateUserFingerprint() {
        const components = [
            navigator.userAgent,
            navigator.language,
            screen.width + 'x' + screen.height,
            screen.colorDepth,
            new Date().getTimezoneOffset(),
            navigator.platform,
            navigator.cookieEnabled ? '1' : '0'
        ];
        
        // Add current date to make it change periodically (optional)
        // components.push(new Date().toDateString());
        
        return btoa(components.join('|')).replace(/[^a-zA-Z0-9]/g, '');
    }
    
    /**
     * Check if this is a first-time user (no wallpaper preference saved)
     */
    isFirstTimeUser() {
        // Check for any existing wallpaper settings
        const hasLocalStorageWallpaper = localStorage.getItem('current_wallpaper');
        const hasSessionWallpaper = this.sessionData?.wallpaper;
        const hasPreferenceWallpaper = this.preferences?.desktop?.wallpaper;
        
        // Check for first visit flag (set after first smart selection)
        const hasVisitedBefore = localStorage.getItem('portfolio_visited');
        
        const isFirstTime = !hasLocalStorageWallpaper && !hasSessionWallpaper && !hasPreferenceWallpaper && !hasVisitedBefore;
        
        // Don't mark as visited here - let the backend handle this after wallpaper selection
        
        return isFirstTime;
    }
    
    /**
     * Debug helper: Test wallpaper persistence
     */
    testWallpaperPersistence() {
        console.log('=== WALLPAPER PERSISTENCE TEST ===');
        console.log('Current wallpaper:', this.currentWallpaper?.name || 'none');
        console.log('Available wallpapers:', this.wallpapers.length);
        console.log('Is first-time user:', this.isFirstTimeUser());
        
        const saved = localStorage.getItem('current_wallpaper');
        console.log('Saved in localStorage:', saved ? JSON.parse(saved) : 'none');
        
        const session = localStorage.getItem('desktop_session');
        console.log('Session data:', session ? JSON.parse(session) : 'none');
        
        if (this.wallpapers.length > 0) {
            console.log('Testing random assignment...');
            const randomWallpaper = this.getRandomDefaultWallpaper();
            console.log('Would assign:', randomWallpaper?.name || 'none');
        }
    }
    
    /**
     * Debug helper: Simulate new user (clear all saved data)
     */
    simulateNewUser() {
        console.log('🗑️ Clearing all user data to simulate new user...');
        localStorage.removeItem('current_wallpaper');
        localStorage.removeItem('desktop_session');
        localStorage.removeItem('desktop_icon_positions');
        
        // Reset session data
        this.sessionData = null;
        
        console.log('✅ User data cleared. Refresh the page to see new user experience.');
        console.log('🔄 Or call: location.reload()');
    }
    
    /**
     * Debug helper: Test random wallpaper assignment
     */
    testRandomAssignment() {
        console.log('=== RANDOM WALLPAPER ASSIGNMENT TEST ===');
        
        const fingerprint = this.generateUserFingerprint();
        console.log('User fingerprint:', fingerprint.substring(0, 16) + '...');
        
        // Test multiple times to show consistency
        for (let i = 0; i < 5; i++) {
            const randomWallpaper = this.getRandomDefaultWallpaper();
            console.log(`Test ${i + 1}: ${randomWallpaper?.name || 'none'}`);
        }
        
        console.log('☝️ Should be the same wallpaper every time (deterministic)');
    }
}

export default Desktop;