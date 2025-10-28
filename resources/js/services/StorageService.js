/**
 * StorageService.js - Centralized localStorage management
 * All localStorage operations should go through this service
 */

export class StorageService {
    // Centralized storage keys
    static KEYS = {
        USER_PREFERENCES: 'userPreferences',
        CURRENT_WALLPAPER: 'current_wallpaper',
        DESKTOP_SESSION: 'desktop_session',
        TERMINAL_SESSION: 'terminal_session',
        TERMINAL_THEME: 'terminal_theme',
        PORTFOLIO_VISITED: 'portfolio_visited',
        ICON_POSITIONS: 'desktop_icon_positions',
        APP_THEME: 'app_theme',
        // Game scores
        SNAKE_HIGH_SCORE: 'snake_high_score',
        GAME_2048_HIGH_SCORE: '2048_high_score',
        TYPING_BEST_SCORE: 'typing_best_'
    };

    /**
     * Get item from localStorage
     * @param {string} key - Storage key
     * @returns {any} Parsed value or null
     */
    static get(key) {
        try {
            const item = localStorage.getItem(key);
            if (!item) return null;
            
            // Try to parse as JSON
            try {
                return JSON.parse(item);
            } catch {
                // Return as string if not JSON
                return item;
            }
        } catch (error) {
            console.error(`StorageService.get(${key}) failed:`, error);
            return null;
        }
    }

    /**
     * Set item in localStorage
     * @param {string} key - Storage key
     * @param {any} value - Value to store
     */
    static set(key, value) {
        try {
            const data = typeof value === 'object' ? JSON.stringify(value) : String(value);
            localStorage.setItem(key, data);
        } catch (error) {
            console.error(`StorageService.set(${key}) failed:`, error);
        }
    }

    /**
     * Remove item from localStorage
     * @param {string} key - Storage key
     */
    static remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error(`StorageService.remove(${key}) failed:`, error);
        }
    }

    /**
     * Clear all localStorage
     */
    static clear() {
        try {
            localStorage.clear();
        } catch (error) {
            console.error('StorageService.clear() failed:', error);
        }
    }

    /**
     * Check if key exists
     * @param {string} key - Storage key
     * @returns {boolean}
     */
    static has(key) {
        return localStorage.getItem(key) !== null;
    }

    /**
     * Get all keys
     * @returns {string[]}
     */
    static getAllKeys() {
        return Object.keys(localStorage);
    }
}

export default StorageService;
