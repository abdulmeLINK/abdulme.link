/**
 * ApiConfig.js - Centralized API endpoint configuration
 * All API calls should use these constants
 */

export const API_ENDPOINTS = {
    // Laravel API endpoints
    ABOUT: '/api/about',
    CONTACT: '/api/contact',
    CONTACT_SUBMIT: '/api/contact/submit',
    PORTFOLIO: '/api/portfolio',
    PREFERENCES: '/api/preferences',
    
    // Desktop & System Data (via API)
    DESKTOP_APPS: '/api/desktop-apps',
    LOADING_MESSAGES: '/api/loading-messages',
    
    // Static assets (not managed by Laravel)
    WALLPAPERS_MANIFEST: '/wallpapers-manifest.json'
};

/**
 * ApiClient - Simple HTTP client for API requests
 */
export class ApiClient {
    /**
     * GET request
     * @param {string} endpoint - API endpoint
     * @returns {Promise<any>}
     */
    static async get(endpoint) {
        try {
            const response = await fetch(endpoint);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`ApiClient.get(${endpoint}) failed:`, error);
            throw error;
        }
    }

    /**
     * POST request
     * @param {string} endpoint - API endpoint
     * @param {object} data - Request body
     * @returns {Promise<any>}
     */
    static async post(endpoint, data) {
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`ApiClient.post(${endpoint}) failed:`, error);
            throw error;
        }
    }

    /**
     * PUT request
     * @param {string} endpoint - API endpoint
     * @param {object} data - Request body
     * @returns {Promise<any>}
     */
    static async put(endpoint, data) {
        try {
            const response = await fetch(endpoint, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`ApiClient.put(${endpoint}) failed:`, error);
            throw error;
        }
    }

    /**
     * DELETE request
     * @param {string} endpoint - API endpoint
     * @returns {Promise<any>}
     */
    static async delete(endpoint) {
        try {
            const response = await fetch(endpoint, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`ApiClient.delete(${endpoint}) failed:`, error);
            throw error;
        }
    }
}

export default { API_ENDPOINTS, ApiClient };
