/**
 * PreferencesIntegration - Applies user preferences to all components
 * Listens for preference changes and updates UI in real-time
 * @module PreferencesIntegration
 */

import EventBus from '../EventBus.js';
import ThemeService from '../../services/ThemeService.js';

export default class PreferencesIntegration {
    constructor() {
        this.preferences = null;
        this.themeService = ThemeService;
        this.init();
    }

    /**
     * Initialize preference listeners
     */
    init() {
        // Listen for preference loading
        EventBus.on('preferences:loaded', (prefs) => {
            this.preferences = prefs;
            this.applyAllPreferences();
        });

        // Listen for individual preference changes
        EventBus.on('preference:changed', (data) => {
            this.handlePreferenceChange(data.path, data.value);
        });
    }

    /**
     * Apply all preferences on load
     */
    applyAllPreferences() {
        if (!this.preferences) return;

        // Apply appearance preferences
        this.applyAppearancePreferences();

        // Apply desktop preferences
        this.applyDesktopPreferences();

        // Apply dock preferences
        this.applyDockPreferences();

        // Apply terminal preferences
        this.applyTerminalPreferences();

        // Apply performance preferences
        this.applyPerformancePreferences();

        // Apply animation preferences
        this.applyAnimationPreferences();
    }

    /**
     * Handle individual preference change
     */
    handlePreferenceChange(path, value) {
        const [category, ...keyPath] = path.split('.');
        
        switch (category) {
            case 'appearance':
                this.handleAppearanceChange(keyPath.join('.'), value);
                break;
            case 'desktop':
                this.handleDesktopChange(keyPath.join('.'), value);
                break;
            case 'dock':
                this.handleDockChange(keyPath.join('.'), value);
                break;
            case 'terminal':
                this.handleTerminalChange(keyPath.join('.'), value);
                break;
            case 'performance':
            case 'boot':
            case 'animations':
                this.handlePerformanceChange(keyPath.join('.'), value, category);
                break;
            case 'privacy':
                this.handlePrivacyChange(keyPath.join('.'), value);
                break;
        }
    }

    /**
     * Apply appearance preferences
     */
    applyAppearancePreferences() {
        const appearance = this.preferences?.appearance;
        if (!appearance) return;

        // Apply theme
        this.applyTheme(appearance.theme || 'auto');

        // Apply accent color
        if (appearance.accent_color) {
            document.documentElement.style.setProperty('--accent-color', appearance.accent_color);
        }

        // Apply transparency
        if (appearance.transparency !== undefined) {
            document.documentElement.style.setProperty('--transparency', appearance.transparency);
        }
    }

    /**
     * Handle appearance changes
     */
    handleAppearanceChange(key, value) {
        switch (key) {
            case 'theme':
                // Use ThemeService for proper theme management
                this.themeService.setTheme(value);
                break;
            case 'accent_color':
                document.documentElement.style.setProperty('--accent-color', value);
                EventBus.emit('theme:accentChanged', { color: value });
                break;
            case 'transparency':
                document.documentElement.style.setProperty('--transparency', value);
                EventBus.emit('theme:transparencyChanged', { value });
                break;
        }
    }

    /**
     * Apply theme (light/dark/auto)
     */
    applyTheme(theme) {
        // Use ThemeService for consistent theme management
        this.themeService.setTheme(theme);
    }

    /**
     * Apply desktop preferences
     */
    applyDesktopPreferences() {
        const desktop = this.preferences?.desktop;
        if (!desktop) return;

        // Emit wallpaper preferences
        if (desktop.wallpaper) {
            EventBus.emit('wallpaper:preferencesLoaded', desktop.wallpaper);
        }

        // Apply icon size
        if (desktop.icons?.size) {
            const iconSize = this.getIconSizeValue(desktop.icons.size);
            document.documentElement.style.setProperty('--desktop-icon-size', iconSize);
        }
    }

    /**
     * Handle desktop changes
     */
    handleDesktopChange(key, value) {
        if (key.startsWith('wallpaper.')) {
            const wallpaperKey = key.replace('wallpaper.', '');
            EventBus.emit('wallpaper:settingChanged', { key: wallpaperKey, value });
        } else if (key === 'icons.size') {
            const iconSize = this.getIconSizeValue(value);
            document.documentElement.style.setProperty('--desktop-icon-size', iconSize);
            EventBus.emit('desktop:iconSizeChanged', { size: value });
        }
    }

    /**
     * Get icon size value in pixels
     */
    getIconSizeValue(size) {
        const sizes = {
            small: '48px',
            medium: '64px',
            large: '80px'
        };
        return sizes[size] || sizes.medium;
    }

    /**
     * Apply dock preferences
     */
    applyDockPreferences() {
        const dock = this.preferences?.dock;
        if (!dock) return;

        // Emit dock preferences
        EventBus.emit('dock:preferencesLoaded', dock);
    }

    /**
     * Handle dock changes
     */
    handleDockChange(key, value) {
        EventBus.emit('dock:settingChanged', { key, value });
    }

    /**
     * Apply terminal preferences
     */
    applyTerminalPreferences() {
        const terminal = this.preferences?.terminal;
        if (!terminal) return;

        // Emit terminal preferences
        EventBus.emit('terminal:preferencesLoaded', terminal);
    }

    /**
     * Handle terminal changes
     */
    handleTerminalChange(key, value) {
        EventBus.emit('terminal:settingChanged', { key, value });
    }

    /**
     * Apply performance preferences
     */
    applyPerformancePreferences() {
        const animations = this.preferences?.animations;
        if (!animations) return;

        // Apply animation speed
        if (animations.speed) {
            this.applyAnimationSpeed(animations.speed);
        }

        // Apply reduced motion
        if (animations.reduced_motion) {
            document.documentElement.style.setProperty('--animation-duration', '0ms');
            document.body.classList.add('reduce-motion');
        }
    }

    /**
     * Apply animation preferences
     */
    applyAnimationPreferences() {
        const animations = this.preferences?.animations;
        if (!animations) return;

        // Set animation speed multiplier
        const speedMultipliers = {
            slow: 1.5,
            normal: 1.0,
            fast: 0.5,
            off: 0
        };

        const multiplier = speedMultipliers[animations.speed] || 1.0;
        document.documentElement.style.setProperty('--animation-speed', multiplier);

        // Handle reduced motion
        if (animations.reduced_motion) {
            document.body.classList.add('reduce-motion');
        } else {
            document.body.classList.remove('reduce-motion');
        }
    }

    /**
     * Handle performance changes
     */
    handlePerformanceChange(key, value, category) {
        if (category === 'animations') {
            if (key === 'speed') {
                this.applyAnimationSpeed(value);
            } else if (key === 'reduced_motion') {
                if (value) {
                    document.body.classList.add('reduce-motion');
                    document.documentElement.style.setProperty('--animation-duration', '0ms');
                } else {
                    document.body.classList.remove('reduce-motion');
                    document.documentElement.style.removeProperty('--animation-duration');
                }
            }
        }

        EventBus.emit('performance:settingChanged', { key, value, category });
    }

    /**
     * Apply animation speed
     */
    applyAnimationSpeed(speed) {
        const speedValues = {
            slow: '1.5',
            normal: '1.0',
            fast: '0.5',
            off: '0'
        };

        const speedValue = speedValues[speed] || '1.0';
        document.documentElement.style.setProperty('--animation-speed', speedValue);

        if (speed === 'off') {
            document.body.classList.add('animations-off');
        } else {
            document.body.classList.remove('animations-off');
        }
    }

    /**
     * Handle privacy changes
     */
    handlePrivacyChange(key, value) {
        EventBus.emit('privacy:settingChanged', { key, value });
    }

    /**
     * Get current preferences
     */
    getPreferences() {
        return this.preferences;
    }

    /**
     * Get preference value by path
     */
    getPreference(path) {
        const keys = path.split('.');
        let value = this.preferences;
        
        for (const key of keys) {
            if (value && typeof value === 'object') {
                value = value[key];
            } else {
                return null;
            }
        }
        
        return value;
    }
}
