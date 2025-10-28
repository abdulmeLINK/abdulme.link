import EventBus from '../components/EventBus.js';

/**
 * ThemeService - Global theme management system
 * Handles light/dark/auto theme switching with time-based intelligence
 * Coordinates with wallpaper system and updates all UI components
 */
class ThemeService {
    constructor() {
        // Theme state
        this.currentTheme = 'auto'; // 'light', 'dark', 'auto'
        this.effectiveTheme = 'light'; // Actual theme being displayed
        this.systemPreference = this.detectSystemTheme();
        this.preferences = null;
        
        // Time-based auto theme
        this.autoThemeInterval = null;
        this.lastAutoCheck = null;
        
        // Bind methods
        this.handleSystemThemeChange = this.handleSystemThemeChange.bind(this);
        
        this.init();
    }

    /**
     * Initialize theme service
     */
    async init() {
        try {
            // Load saved preferences
            await this.loadPreferences();
            
            // Set initial theme
            const savedTheme = this.getSavedTheme();
            this.currentTheme = savedTheme || this.preferences?.appearance?.theme || 'auto';
            
            // Apply initial theme
            this.applyTheme(this.currentTheme);
            
            // Listen for system theme changes
            this.watchSystemTheme();
            
            // Start auto theme scheduler if needed
            if (this.currentTheme === 'auto') {
                this.startAutoThemeScheduler();
            }
            
            // Listen for preference changes
            EventBus.on('preferences:changed', this.handlePreferencesChanged.bind(this));
            
            console.log('✅ ThemeService initialized:', {
                currentTheme: this.currentTheme,
                effectiveTheme: this.effectiveTheme,
                systemPreference: this.systemPreference
            });
            
            // Emit ready event
            EventBus.emit('theme:ready', {
                currentTheme: this.currentTheme,
                effectiveTheme: this.effectiveTheme
            });
            
        } catch (error) {
            console.error('ThemeService initialization failed:', error);
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
            }
        } catch (error) {
            console.warn('Failed to load theme preferences:', error);
        }
    }

    /**
     * Get saved theme from localStorage
     */
    getSavedTheme() {
        try {
            return localStorage.getItem('app_theme');
        } catch (error) {
            return null;
        }
    }

    /**
     * Save theme to localStorage
     */
    saveTheme(theme) {
        try {
            localStorage.setItem('app_theme', theme);
        } catch (error) {
            console.warn('Failed to save theme:', error);
        }
    }

    /**
     * Set theme manually
     * @param {string} theme - 'light', 'dark', or 'auto'
     */
    setTheme(theme) {
        if (!['light', 'dark', 'auto'].includes(theme)) {
            console.warn('Invalid theme:', theme);
            return;
        }

        this.currentTheme = theme;
        this.saveTheme(theme);
        
        // Stop auto scheduler if switching away from auto
        if (theme !== 'auto' && this.autoThemeInterval) {
            clearInterval(this.autoThemeInterval);
            this.autoThemeInterval = null;
        }
        
        // Start auto scheduler if switching to auto
        if (theme === 'auto') {
            this.startAutoThemeScheduler();
        }
        
        // Apply theme
        this.applyTheme(theme);
        
        console.log('🎨 Theme changed to:', theme);
    }

    /**
     * Apply theme to the DOM
     * @param {string} theme - Theme to apply
     */
    applyTheme(theme) {
        // Determine effective theme
        let effective = theme;
        
        if (theme === 'auto') {
            // Check time-based preference first
            const hour = new Date().getHours();
            const isNightTime = hour < 6 || hour >= 18;
            
            if (this.preferences?.desktop?.wallpaper?.time_based_switching) {
                // Use time-based logic: 6 AM - 6 PM = light, 6 PM - 6 AM = dark
                effective = isNightTime ? 'dark' : 'light';
            } else {
                // Fall back to system preference
                effective = this.systemPreference;
            }
        }
        
        // Store effective theme
        this.effectiveTheme = effective;
        
        // Update DOM
        this.updateDOM(effective);
        
        // Emit theme changed event
        EventBus.emit('theme:changed', {
            theme: this.currentTheme,
            effectiveTheme: effective
        });
    }

    /**
     * Update DOM with theme
     * @param {string} theme - 'light' or 'dark'
     */
    updateDOM(theme) {
        const root = document.documentElement;
        
        // Set data-theme attribute
        root.setAttribute('data-theme', theme);
        
        // Update CSS custom properties for smooth transitions
        root.style.setProperty('--theme-transition', 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)');
        
        console.log(`🎨 DOM updated to ${theme} theme`);
    }

    /**
     * Get current effective theme
     * @returns {string} 'light' or 'dark'
     */
    getEffectiveTheme() {
        return this.effectiveTheme;
    }

    /**
     * Get current theme setting
     * @returns {string} 'light', 'dark', or 'auto'
     */
    getCurrentTheme() {
        return this.currentTheme;
    }

    /**
     * Check if dark theme is active
     * @returns {boolean}
     */
    isDark() {
        return this.effectiveTheme === 'dark';
    }

    /**
     * Check if light theme is active
     * @returns {boolean}
     */
    isLight() {
        return this.effectiveTheme === 'light';
    }

    /**
     * Detect system theme preference
     * @returns {string} 'light' or 'dark'
     */
    detectSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    /**
     * Watch for system theme changes
     */
    watchSystemTheme() {
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            
            // Modern browsers
            if (mediaQuery.addEventListener) {
                mediaQuery.addEventListener('change', this.handleSystemThemeChange);
            } else if (mediaQuery.addListener) {
                // Safari <= 13
                mediaQuery.addListener(this.handleSystemThemeChange);
            }
        }
    }

    /**
     * Handle system theme change
     * @param {MediaQueryListEvent} e
     */
    handleSystemThemeChange(e) {
        this.systemPreference = e.matches ? 'dark' : 'light';
        
        console.log('🌓 System theme changed to:', this.systemPreference);
        
        // Re-apply theme if in auto mode
        if (this.currentTheme === 'auto') {
            this.applyTheme('auto');
        }
    }

    /**
     * Start automatic theme scheduler based on time of day
     */
    startAutoThemeScheduler() {
        // Clear existing interval
        if (this.autoThemeInterval) {
            clearInterval(this.autoThemeInterval);
        }
        
        // Check immediately
        this.applyTheme('auto');
        
        // Check every 5 minutes
        this.autoThemeInterval = setInterval(() => {
            if (this.currentTheme === 'auto') {
                const hour = new Date().getHours();
                const lastHour = this.lastAutoCheck ? this.lastAutoCheck.getHours() : -1;
                
                // Only re-apply if hour changed (to reduce overhead)
                if (hour !== lastHour) {
                    this.applyTheme('auto');
                    this.lastAutoCheck = new Date();
                    console.log('⏰ Auto theme check at hour:', hour);
                }
            }
        }, 5 * 60 * 1000); // 5 minutes
        
        console.log('⏰ Auto theme scheduler started');
    }

    /**
     * Handle preferences changed event
     * @param {object} data - Preferences data
     */
    handlePreferencesChanged(data) {
        if (data && data.appearance && data.appearance.theme) {
            this.setTheme(data.appearance.theme);
        }
    }

    /**
     * Get theme-appropriate colors
     * @returns {object} Color palette for current theme
     */
    getThemeColors() {
        const isDark = this.isDark();
        
        return {
            // Window colors
            windowBg: isDark ? 'rgba(40, 40, 40, 0.95)' : 'rgba(246, 246, 246, 0.95)',
            windowTitlebar: isDark 
                ? 'linear-gradient(to bottom, rgba(60, 60, 60, 0.9), rgba(50, 50, 50, 0.9))'
                : 'linear-gradient(to bottom, rgba(255, 255, 255, 0.9), rgba(240, 240, 240, 0.9))',
            windowBorder: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.2)',
            windowTitleText: isDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)',
            
            // Dock colors
            dockBg: isDark ? 'rgba(30, 30, 30, 0.3)' : 'rgba(255, 255, 255, 0.15)',
            dockBorder: isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.18)',
            dockLabel: isDark ? 'rgba(30, 30, 30, 0.9)' : 'rgba(0, 0, 0, 0.8)',
            dockLabelText: 'white',
            
            // Context menu colors
            contextMenuBg: isDark ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.9)',
            contextMenuText: isDark ? '#fff' : '#333',
            contextMenuHover: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 122, 255, 0.1)',
            
            // Desktop colors
            iconText: 'white', // Always white for contrast on wallpapers
            iconTextShadow: isDark ? '0 1px 3px rgba(0, 0, 0, 0.9)' : '0 1px 2px rgba(0, 0, 0, 0.8)',
            
            // General colors
            shadowColor: 'rgba(0, 0, 0, 0.3)',
            accentColor: '#007AFF'
        };
    }

    /**
     * Destroy theme service
     */
    destroy() {
        if (this.autoThemeInterval) {
            clearInterval(this.autoThemeInterval);
        }
        
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            if (mediaQuery.removeEventListener) {
                mediaQuery.removeEventListener('change', this.handleSystemThemeChange);
            } else if (mediaQuery.removeListener) {
                mediaQuery.removeListener(this.handleSystemThemeChange);
            }
        }
    }
}

// Create singleton instance
const themeService = new ThemeService();

// Export singleton
export default themeService;
