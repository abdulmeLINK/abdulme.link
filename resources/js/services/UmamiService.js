/**
 * UmamiService.js - Umami Analytics Integration
 * Tracks custom events for portfolio interactions
 */

export class UmamiService {
    constructor() {
        this.enabled = typeof window !== 'undefined' && window.umami;
        
        if (!this.enabled) {
            console.warn('[Umami] Analytics not loaded. Events will be logged but not tracked.');
        }
    }

    /**
     * Track a custom event
     * @param {string} eventName - Event name (e.g., 'terminal-command')
     * @param {object} eventData - Additional event data
     */
    track(eventName, eventData = {}) {
        if (this.enabled) {
            try {
                window.umami.track(eventName, eventData);
                console.log(`[Umami] Tracked: ${eventName}`, eventData);
            } catch (error) {
                console.error('[Umami] Tracking failed:', error);
            }
        } else {
            console.log(`[Umami] Would track: ${eventName}`, eventData);
        }
    }

    /**
     * Track page view (usually automatic, but useful for SPA navigation)
     * @param {string} pagePath - Page path (e.g., '/about')
     * @param {string} pageTitle - Page title
     */
    trackPageView(pagePath, pageTitle) {
        if (this.enabled) {
            window.umami.track(props => ({
                ...props,
                url: pagePath,
                title: pageTitle
            }));
        }
    }

    // ==================== Terminal Events ====================

    /**
     * Track terminal command execution
     * @param {string} command - Command executed
     * @param {boolean} success - Whether command succeeded
     */
    trackTerminalCommand(command, success = true) {
        this.track('terminal-command', { 
            command, 
            success 
        });
    }

    /**
     * Track terminal opened
     */
    trackTerminalOpen() {
        this.track('terminal-open');
    }

    /**
     * Track terminal session duration
     * @param {number} duration - Session duration in seconds
     */
    trackTerminalSession(duration) {
        this.track('terminal-session-end', { 
            duration_seconds: duration 
        });
    }

    // ==================== Application Events ====================

    /**
     * Track app launch from dock or launchpad
     * @param {string} appId - App identifier
     * @param {string} appName - App display name
     * @param {string} launchMethod - 'dock', 'launchpad', 'finder', or 'spotlight'
     */
    trackAppLaunch(appId, appName, launchMethod = 'dock') {
        this.track('app-launch', { 
            app_id: appId, 
            app_name: appName,
            launch_method: launchMethod 
        });
    }

    /**
     * Track app closed
     * @param {string} appId - App identifier
     * @param {number} duration - Time app was open in seconds
     */
    trackAppClose(appId, duration) {
        this.track('app-close', { 
            app_id: appId, 
            duration_seconds: duration 
        });
    }

    // ==================== Desktop Events ====================

    /**
     * Track wallpaper change
     * @param {string} wallpaperId - Wallpaper identifier
     * @param {string} changeMethod - 'manual', 'auto', or 'time-based'
     */
    trackWallpaperChange(wallpaperId, changeMethod = 'manual') {
        this.track('wallpaper-change', { 
            wallpaper_id: wallpaperId,
            change_method: changeMethod 
        });
    }

    /**
     * Track desktop boot/startup
     * @param {number} bootTime - Boot time in milliseconds
     */
    trackDesktopBoot(bootTime) {
        this.track('desktop-boot', { 
            boot_time_ms: bootTime 
        });
    }

    // ==================== Portfolio Events ====================

    /**
     * Track portfolio project view
     * @param {string} projectId - Project identifier
     * @param {string} projectTitle - Project title
     */
    trackProjectView(projectId, projectTitle) {
        this.track('project-view', { 
            project_id: projectId,
            project_title: projectTitle 
        });
    }

    /**
     * Track project link click (GitHub, demo, etc.)
     * @param {string} projectId - Project identifier
     * @param {string} linkType - 'github', 'demo', 'docs', etc.
     */
    trackProjectLinkClick(projectId, linkType) {
        this.track('project-link-click', { 
            project_id: projectId,
            link_type: linkType 
        });
    }

    // ==================== Preferences Events ====================

    /**
     * Track preference change
     * @param {string} category - Preference category (e.g., 'appearance')
     * @param {string} setting - Setting name (e.g., 'theme')
     * @param {any} value - New value
     */
    trackPreferenceChange(category, setting, value) {
        this.track('preference-change', { 
            category, 
            setting,
            value: String(value) // Convert to string for tracking
        });
    }

    /**
     * Track preferences panel opened
     * @param {string} tab - Tab opened (e.g., 'appearance', 'dock')
     */
    trackPreferencesOpen(tab) {
        this.track('preferences-open', { tab });
    }

    // ==================== Contact Events ====================

    /**
     * Track contact form submission
     * @param {string} method - 'email', 'github', 'linkedin', etc.
     */
    trackContactAttempt(method) {
        this.track('contact-attempt', { method });
    }

    /**
     * Track social link click
     * @param {string} platform - 'github', 'linkedin', 'twitter', etc.
     */
    trackSocialClick(platform) {
        this.track('social-click', { platform });
    }

    // ==================== Download Events ====================

    /**
     * Track file download (e.g., resume, documents)
     * @param {string} fileName - File name
     * @param {string} fileType - File type (e.g., 'pdf', 'docx')
     */
    trackDownload(fileName, fileType) {
        this.track('file-download', { 
            file_name: fileName,
            file_type: fileType 
        });
    }

    // ==================== Search Events ====================

    /**
     * Track Spotlight search
     * @param {string} query - Search query
     * @param {number} resultsCount - Number of results
     */
    trackSpotlightSearch(query, resultsCount) {
        this.track('spotlight-search', { 
            query,
            results_count: resultsCount 
        });
    }

    // ==================== Error Events ====================

    /**
     * Track error occurrence
     * @param {string} errorType - Error type/category
     * @param {string} errorMessage - Error message
     */
    trackError(errorType, errorMessage) {
        this.track('error', { 
            error_type: errorType,
            error_message: errorMessage 
        });
    }

    // ==================== Utility Methods ====================

    /**
     * Check if Umami is loaded and tracking
     * @returns {boolean}
     */
    isEnabled() {
        return this.enabled;
    }

    /**
     * Get current session ID (if available)
     * @returns {string|null}
     */
    getSessionId() {
        // Umami doesn't expose session ID directly
        // You could implement your own session tracking
        return sessionStorage.getItem('umami-session-id') || null;
    }
}

// Export singleton instance
const umamiService = new UmamiService();
export default umamiService;

// Also export class for testing
export { UmamiService };
