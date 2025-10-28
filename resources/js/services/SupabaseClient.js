/**
 * DataClient.js - Frontend data client
 * ALWAYS uses Laravel API backend - never bypasses the backend
 * This maintains proper architecture with backend caching/error handling
 */

/**
 * DataClient - Fetches all data through Laravel API
 * Backend handles Supabase Storage fallback transparently
 */
export class DataClient {
    constructor() {
        this.baseUrl = '/api'; // Laravel API endpoints
        this.cacheTime = 300000; // 5 minutes (backend has its own cache)
    }

    /**
     * Fetch data from Laravel API with caching
     * @param {string} endpoint - API endpoint (e.g., '/about', '/portfolio')
     * @returns {Promise<object|null>}
     */
    async fetchApi(endpoint) {
        try {
            // Check localStorage cache first
            const cacheKey = `api:${endpoint}`;
            const cached = localStorage.getItem(cacheKey);
            
            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                if (Date.now() - timestamp < this.cacheTime) {
                    console.log(`[API] Using cached ${endpoint}`);
                    return data;
                }
            }

            // Fetch from Laravel API
            const url = `${this.baseUrl}${endpoint}`;
            console.log(`[API] Fetching ${url}`);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            const data = result.data || result; // Handle both {data: ...} and direct response

            // Cache the result
            localStorage.setItem(cacheKey, JSON.stringify({
                data,
                timestamp: Date.now()
            }));

            console.log(`[API] Successfully fetched ${endpoint}`);
            return data;

        } catch (error) {
            console.error(`[API] Failed to fetch ${endpoint}:`, error);
            
            // Try to return stale cache as fallback
            const cacheKey = `api:${endpoint}`;
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                console.warn(`[API] Using stale cache for ${endpoint}`);
                return JSON.parse(cached).data;
            }

            return null;
        }
    }

    /**
     * Get about data through Laravel API
     */
    async getAbout() {
        return this.fetchApi('/about');
    }

    /**
     * Get portfolio data through Laravel API
     */
    async getPortfolio() {
        return this.fetchApi('/portfolio');
    }

    /**
     * Get portfolio projects through Laravel API
     */
    async getPortfolioProjects(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        const endpoint = queryParams ? `/portfolio/projects?${queryParams}` : '/portfolio/projects';
        return this.fetchApi(endpoint);
    }

    /**
     * Get preferences data through Laravel API
     */
    async getPreferences() {
        return this.fetchApi('/preferences');
    }

    /**
     * Update preferences through Laravel API
     */
    async updatePreferences(preferences) {
        try {
            const response = await fetch(`${this.baseUrl}/preferences`, {
                method: 'PUT',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
                },
                body: JSON.stringify(preferences)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            // Clear cache after update
            localStorage.removeItem('api:/preferences');
            
            return await response.json();
        } catch (error) {
            console.error('[API] Failed to update preferences:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get terminal commands through Laravel API
     */
    async getTerminalCommands() {
        return this.fetchApi('/terminal/commands');
    }

    /**
     * Get desktop apps through Laravel API
     */
    async getDesktopApps() {
        return this.fetchApi('/desktop/apps');
    }

    /**
     * Get filesystem data through Laravel API
     */
    async getFilesystem() {
        return this.fetchApi('/filesystem');
    }

    /**
     * Get loading messages through Laravel API
     */
    async getLoadingMessages() {
        return this.fetchApi('/loading-messages');
    }

    /**
     * Clear all API caches
     */
    clearCache() {
        const keys = Object.keys(localStorage).filter(key => key.startsWith('api:'));
        keys.forEach(key => localStorage.removeItem(key));
        console.log('[API] Cache cleared');
    }

    /**
     * Clear specific endpoint cache
     */
    clearEndpointCache(endpoint) {
        localStorage.removeItem(`api:${endpoint}`);
        console.log(`[API] Cleared cache for ${endpoint}`);
    }

    /**
     * Test connection to Laravel API
     */
    async testConnection() {
        try {
            await this.getAbout();
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Check if API is reachable
     */
    async isOnline() {
        if (!navigator.onLine) {
            return false;
        }

        try {
            const response = await fetch(`${this.baseUrl}/health`, {
                method: 'HEAD',
                cache: 'no-cache'
            });
            return response.ok;
        } catch {
            return false;
        }
    }
}

// Export singleton instance
const dataClient = new DataClient();
export default dataClient;

// Also export class for testing
export { DataClient };

