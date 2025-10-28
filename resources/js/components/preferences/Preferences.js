/**
 * Preferences Component - System Settings Manager
 * Handles 6 categories: Appearance, Desktop, Dock, Terminal, Performance, Privacy
 * Features: Live preview, instant application, localStorage persistence
 * @module Preferences
 */

import EventBus from '../EventBus.js';
import TERMINAL_THEMES from '../terminal/themes/TerminalThemes.js';
import LinkOS_COLORS from '../../config/ColorConstants.js';

export default class Preferences {
    constructor() {
        this.currentTab = 'appearance';
        this.preferences = null;
        this.unsavedChanges = false;
        this.previewTimeout = null;
        
        this.tabs = [
            { id: 'appearance', name: 'Appearance', icon: '🎨' },
            { id: 'desktop', name: 'Desktop', icon: '🖥️' },
            { id: 'dock', name: 'Dock', icon: '📱' },
            { id: 'terminal', name: 'Terminal', icon: '💻' },
            { id: 'performance', name: 'Performance', icon: '⚡' },
            { id: 'privacy', name: 'Privacy', icon: '🔒' }
        ];
    }

    /**
     * Initialize preferences component
     * @returns {Promise<HTMLElement>} The preferences container
     */
    async init() {
        try {
            await this.loadPreferences();
            const container = this.render();
            this.attachEventListeners(container);
            this.applyStoredPreferences();
            return container;
        } catch (error) {
            console.error('Failed to initialize preferences:', error);
            return this.renderError();
        }
    }

    /**
     * Load preferences from API and localStorage
     */
    async loadPreferences() {
        try {
            // Try localStorage first
            const stored = localStorage.getItem('userPreferences');
            if (stored) {
                this.preferences = JSON.parse(stored);
            }

            // Fetch from API for defaults/validation
            const response = await fetch('/api/preferences');
            if (response.ok) {
                const defaults = await response.json();
                // Merge with stored preferences
                this.preferences = this.mergePreferences(defaults, this.preferences || {});
            }
        } catch (error) {
            console.error('Failed to load preferences:', error);
            this.preferences = this.getDefaultPreferences();
        }
    }

    /**
     * Merge user preferences with defaults
     */
    mergePreferences(defaults, user) {
        return {
            ...defaults,
            ...user,
            appearance: { ...defaults.appearance, ...user.appearance },
            desktop: { ...defaults.desktop, ...user.desktop },
            dock: { ...defaults.dock, ...user.dock },
            terminal: { ...defaults.terminal, ...user.terminal },
            performance: { ...defaults.performance, ...user.performance },
            privacy: { ...defaults.privacy, ...user.privacy }
        };
    }

    /**
     * Render preferences interface
     */
    render() {
        const container = document.createElement('div');
        container.className = 'preferences-container';
        container.innerHTML = `
            <div class="preferences-sidebar">
                ${this.renderSidebar()}
            </div>
            <div class="preferences-content">
                ${this.renderContent()}
            </div>
        `;
        return container;
    }

    /**
     * Render sidebar with category tabs
     */
    renderSidebar() {
        return this.tabs.map(tab => `
            <button 
                class="preferences-tab ${tab.id === this.currentTab ? 'active' : ''}"
                data-tab="${tab.id}"
            >
                <span class="tab-icon">${tab.icon}</span>
                <span class="tab-name">${tab.name}</span>
            </button>
        `).join('');
    }

    /**
     * Render content area based on active tab
     */
    renderContent() {
        switch (this.currentTab) {
            case 'appearance': return this.renderAppearanceTab();
            case 'desktop': return this.renderDesktopTab();
            case 'dock': return this.renderDockTab();
            case 'terminal': return this.renderTerminalTab();
            case 'performance': return this.renderPerformanceTab();
            case 'privacy': return this.renderPrivacyTab();
            default: return '<div>Select a category</div>';
        }
    }

    /**
     * Render Appearance tab
     */
    renderAppearanceTab() {
        const prefs = this.preferences?.appearance || {};
        return `
            <div class="preferences-tab-content" data-tab="appearance">
                <h2>Appearance</h2>
                
                <div class="preference-group">
                    <label>Theme</label>
                    <div class="theme-selector">
                        ${this.renderThemeOptions(prefs.theme || 'auto')}
                    </div>
                </div>

                <div class="preference-group">
                    <label>Accent Color</label>
                    <input 
                        type="color" 
                        class="color-picker" 
                        data-pref="appearance.accent_color"
                        value="${prefs.accent_color || LinkOS_COLORS.SYSTEM_BLUE}"
                    />
                </div>

                <div class="preference-group">
                    <label>Transparency <span class="value-label">${Math.round((prefs.transparency || 0.8) * 100)}%</span></label>
                    <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value="${(prefs.transparency || 0.8) * 100}"
                        class="slider"
                        data-pref="appearance.transparency"
                    />
                </div>
            </div>
        `;
    }

    /**
     * Render Desktop tab
     */
    renderDesktopTab() {
        const prefs = this.preferences?.desktop || {};
        const wallpaper = prefs.wallpaper || {};
        
        return `
            <div class="preferences-tab-content" data-tab="desktop">
                <h2>Desktop & Wallpaper</h2>
                
                <div class="preference-group">
                    <label>
                        <input 
                            type="checkbox" 
                            data-pref="desktop.wallpaper.auto_rotation"
                            ${wallpaper.auto_rotation ? 'checked' : ''}
                        />
                        Auto-rotate wallpaper
                    </label>
                </div>

                <div class="preference-group">
                    <label>Rotation Interval</label>
                    <select data-pref="desktop.wallpaper.rotation_interval">
                        <option value="900000" ${wallpaper.rotation_interval === 900000 ? 'selected' : ''}>15 minutes</option>
                        <option value="1800000" ${wallpaper.rotation_interval === 1800000 ? 'selected' : ''}>30 minutes</option>
                        <option value="3600000" ${wallpaper.rotation_interval === 3600000 ? 'selected' : ''}>1 hour</option>
                        <option value="21600000" ${wallpaper.rotation_interval === 21600000 ? 'selected' : ''}>6 hours</option>
                    </select>
                </div>

                <div class="preference-group">
                    <label>
                        <input 
                            type="checkbox" 
                            data-pref="desktop.wallpaper.time_based_switching"
                            ${wallpaper.time_based_switching ? 'checked' : ''}
                        />
                        Time-based light/dark switching
                    </label>
                </div>

                <div class="preference-group wallpaper-gallery-group">
                    <label>Choose Wallpaper</label>
                    <div class="wallpaper-gallery-note">Click to select your preferred wallpaper</div>
                    <div id="wallpaper-gallery-container">
                        <div class="wallpaper-loading">Loading wallpapers...</div>
                    </div>
                </div>

                <div class="preference-group">
                    <label>Icon Size</label>
                    <div class="icon-size-preview">
                        ${['small', 'medium', 'large'].map(size => `
                            <button 
                                class="icon-size-btn ${(prefs.icons?.size || 'medium') === size ? 'active' : ''}"
                                data-pref="desktop.icons.size"
                                data-value="${size}"
                            >
                                ${size.charAt(0).toUpperCase() + size.slice(1)}
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render Dock tab
     */
    renderDockTab() {
        const prefs = this.preferences?.dock || {};
        
        return `
            <div class="preferences-tab-content" data-tab="dock">
                <h2>Dock Settings</h2>
                
                <div class="preference-group">
                    <label>Position</label>
                    <div class="dock-position-selector">
                        ${['bottom', 'left', 'right'].map(pos => `
                            <button 
                                class="position-btn ${(prefs.position || 'bottom') === pos ? 'active' : ''}"
                                data-pref="dock.position"
                                data-value="${pos}"
                            >
                                ${pos.charAt(0).toUpperCase() + pos.slice(1)}
                            </button>
                        `).join('')}
                    </div>
                </div>

                <div class="preference-group">
                    <label>Size <span class="value-label">${prefs.size || 64}px</span></label>
                    <input 
                        type="range" 
                        min="44" 
                        max="96" 
                        value="${prefs.size || 64}"
                        class="slider"
                        data-pref="dock.size"
                    />
                </div>

                <div class="preference-group">
                    <label>
                        <input 
                            type="checkbox" 
                            data-pref="dock.magnification.enabled"
                            ${prefs.magnification?.enabled ? 'checked' : ''}
                        />
                        Enable magnification
                    </label>
                </div>

                ${prefs.magnification?.enabled ? `
                    <div class="preference-group">
                        <label>Magnification Scale <span class="value-label">${prefs.magnification?.scale || 1.5}x</span></label>
                        <input 
                            type="range" 
                            min="1.2" 
                            max="2.0" 
                            step="0.1"
                            value="${prefs.magnification?.scale || 1.5}"
                            class="slider"
                            data-pref="dock.magnification.scale"
                        />
                    </div>
                ` : ''}

                <div class="preference-group">
                    <label>
                        <input 
                            type="checkbox" 
                            data-pref="dock.auto_hide"
                            ${prefs.auto_hide ? 'checked' : ''}
                        />
                        Auto-hide dock
                    </label>
                </div>
            </div>
        `;
    }

    /**
     * Render Terminal tab (Part 1 - appearance/theme)
     */
    renderTerminalTab() {
        const prefs = this.preferences?.terminal || {};
        const appearance = prefs.appearance || {};
        const behavior = prefs.behavior || {};
        
        // Get current theme
        const currentTheme = appearance.theme || 'default';
        const currentThemeData = TERMINAL_THEMES[currentTheme];
        
        // Generate theme options from TERMINAL_THEMES
        const themeOptions = Object.entries(TERMINAL_THEMES).map(([key, theme]) => {
            const selected = currentTheme === key ? 'selected' : '';
            return `<option value="${key}" ${selected}>${theme.name}</option>`;
        }).join('');
        
        return `
            <div class="preferences-tab-content" data-tab="terminal">
                <h2>Terminal Settings</h2>
                
                <div class="preference-group">
                    <label>Current Theme</label>
                    <div class="current-theme-display">
                        <div class="theme-preview" style="
                            background: ${currentThemeData.background};
                            color: ${currentThemeData.foreground};
                            border: 1px solid var(--pref-border);
                            border-radius: 6px;
                            padding: 12px;
                            font-family: monospace;
                            font-size: 11px;
                            margin-bottom: 8px;
                        ">
                            <div>${currentThemeData.name}</div>
                            <div style="opacity: 0.7; font-size: 10px;">${currentThemeData.description || 'Terminal theme'}</div>
                        </div>
                    </div>
                </div>
                
                <div class="preference-group">
                    <label>Theme</label>
                    <select data-pref="terminal.appearance.theme">
                        ${themeOptions}
                    </select>
                </div>

                <div class="preference-group">
                    <label>Font Family</label>
                    <select data-pref="terminal.appearance.font_family">
                        <option value="Menlo" ${appearance.font_family === 'Menlo' ? 'selected' : ''}>Menlo (Default)</option>
                        <option value="Monaco" ${appearance.font_family === 'Monaco' ? 'selected' : ''}>Monaco</option>
                        <option value="Fira Code" ${appearance.font_family === 'Fira Code' ? 'selected' : ''}>Fira Code (Ligatures)</option>
                        <option value="JetBrains Mono" ${appearance.font_family === 'JetBrains Mono' ? 'selected' : ''}>JetBrains Mono</option>
                        <option value="Cascadia Code" ${appearance.font_family === 'Cascadia Code' ? 'selected' : ''}>Cascadia Code</option>
                        <option value="Source Code Pro" ${appearance.font_family === 'Source Code Pro' ? 'selected' : ''}>Source Code Pro</option>
                        <option value="Hack" ${appearance.font_family === 'Hack' ? 'selected' : ''}>Hack</option>
                        <option value="IBM Plex Mono" ${appearance.font_family === 'IBM Plex Mono' ? 'selected' : ''}>IBM Plex Mono</option>
                        <option value="Inconsolata" ${appearance.font_family === 'Inconsolata' ? 'selected' : ''}>Inconsolata</option>
                        <option value="Roboto Mono" ${appearance.font_family === 'Roboto Mono' ? 'selected' : ''}>Roboto Mono</option>
                        <option value="Ubuntu Mono" ${appearance.font_family === 'Ubuntu Mono' ? 'selected' : ''}>Ubuntu Mono</option>
                        <option value="Courier New" ${appearance.font_family === 'Courier New' ? 'selected' : ''}>Courier New</option>
                        <option value="Consolas" ${appearance.font_family === 'Consolas' ? 'selected' : ''}>Consolas</option>
                        <option value="SF Mono" ${appearance.font_family === 'SF Mono' ? 'selected' : ''}>SF Mono</option>
                    </select>
                </div>

                <div class="preference-group">
                    <label>Font Size <span class="value-label">${appearance.font_size || 11}px</span></label>
                    <input 
                        type="range" 
                        min="8" 
                        max="24" 
                        value="${appearance.font_size || 11}"
                        class="slider"
                        data-pref="terminal.appearance.font_size"
                    />
                </div>

                <div class="preference-group">
                    <label>Line Height <span class="value-label">${appearance.line_height || 1.2}</span></label>
                    <input 
                        type="range" 
                        min="1.0" 
                        max="2.0" 
                        step="0.1"
                        value="${appearance.line_height || 1.2}"
                        class="slider"
                        data-pref="terminal.appearance.line_height"
                    />
                </div>

                <div class="preference-group">
                    <label>Cursor Style</label>
                    <select data-pref="terminal.appearance.cursor_style">
                        <option value="block" ${appearance.cursor_style === 'block' ? 'selected' : ''}>Block</option>
                        <option value="underline" ${appearance.cursor_style === 'underline' ? 'selected' : ''}>Underline</option>
                        <option value="bar" ${appearance.cursor_style === 'bar' ? 'selected' : ''}>Bar</option>
                    </select>
                </div>

                <div class="preference-group">
                    <label>
                        <input 
                            type="checkbox" 
                            data-pref="terminal.appearance.cursor_blink"
                            ${appearance.cursor_blink !== false ? 'checked' : ''}
                        />
                        Blinking Cursor
                    </label>
                </div>

                <div class="preference-group">
                    <label>History Size <span class="value-label">${behavior.history_size || 1000}</span></label>
                    <input 
                        type="range" 
                        min="100" 
                        max="10000" 
                        step="100"
                        value="${behavior.history_size || 1000}"
                        class="slider"
                        data-pref="terminal.behavior.history_size"
                    />
                </div>

                <div class="preference-group">
                    <label>
                        <input 
                            type="checkbox" 
                            data-pref="terminal.behavior.bell_sound"
                            ${behavior.bell_sound !== false ? 'checked' : ''}
                        />
                        Bell Sound
                    </label>
                </div>
            </div>
        `;
    }

    /**
     * Render Performance tab
     */
    renderPerformanceTab() {
        const prefs = this.preferences?.performance || {};
        const boot = this.preferences?.boot || {};
        const animations = this.preferences?.animations || {};
        
        return `
            <div class="preferences-tab-content" data-tab="performance">
                <h2>Performance Settings</h2>
                
                <div class="preference-group">
                    <label>
                        <input 
                            type="checkbox" 
                            data-pref="boot.animation_enabled"
                            ${boot.animation_enabled !== false ? 'checked' : ''}
                        />
                        Enable boot animation
                    </label>
                </div>

                <div class="preference-group">
                    <label>
                        <input 
                            type="checkbox" 
                            data-pref="boot.skip_after_session"
                            ${boot.skip_after_session ? 'checked' : ''}
                        />
                        Skip boot after session
                    </label>
                </div>

                <div class="preference-group">
                    <label>Animation Speed</label>
                    <select data-pref="animations.speed">
                        <option value="slow" ${animations.speed === 'slow' ? 'selected' : ''}>Slow</option>
                        <option value="normal" ${animations.speed === 'normal' || !animations.speed ? 'selected' : ''}>Normal</option>
                        <option value="fast" ${animations.speed === 'fast' ? 'selected' : ''}>Fast</option>
                        <option value="off" ${animations.speed === 'off' ? 'selected' : ''}>Off</option>
                    </select>
                </div>

                <div class="preference-group">
                    <label>
                        <input 
                            type="checkbox" 
                            data-pref="animations.reduced_motion"
                            ${animations.reduced_motion ? 'checked' : ''}
                        />
                        Reduce motion (accessibility)
                    </label>
                </div>

                <div class="preference-group">
                    <button class="btn-secondary" data-action="clear-cache">Clear Cache</button>
                </div>
            </div>
        `;
    }

    /**
     * Render Privacy tab
     */
    renderPrivacyTab() {
        const prefs = this.preferences?.privacy || {};
        
        return `
            <div class="preferences-tab-content" data-tab="privacy">
                <h2>Privacy Settings</h2>
                
                <div class="preference-group">
                    <label>
                        <input 
                            type="checkbox" 
                            data-pref="privacy.remember_session"
                            ${prefs.remember_session !== false ? 'checked' : ''}
                        />
                        Remember session
                    </label>
                </div>

                <div class="preference-group">
                    <label>
                        <input 
                            type="checkbox" 
                            data-pref="privacy.restore_windows"
                            ${prefs.restore_windows ? 'checked' : ''}
                        />
                        Restore window positions
                    </label>
                </div>

                <div class="preference-group">
                    <label>
                        <input 
                            type="checkbox" 
                            data-pref="privacy.analytics"
                            ${prefs.analytics ? 'checked' : ''}
                        />
                        Enable analytics
                    </label>
                </div>

                <div class="preference-group">
                    <button class="btn-secondary" data-action="export-settings">Export Settings</button>
                    <button class="btn-secondary" data-action="import-settings">Import Settings</button>
                </div>

                <div class="preference-group">
                    <button class="btn-danger" data-action="reset-all">Reset to Defaults</button>
                </div>
            </div>
        `;
    }

    /**
     * Render theme options
     */
    renderThemeOptions(currentTheme) {
        const themes = ['light', 'dark', 'auto'];
        return themes.map(theme => `
            <button 
                class="theme-btn ${currentTheme === theme ? 'active' : ''}"
                data-pref="appearance.theme"
                data-value="${theme}"
            >
                ${theme.charAt(0).toUpperCase() + theme.slice(1)}
            </button>
        `).join('');
    }

    /**
     * Attach event listeners
     */
    attachEventListeners(container) {
        // Tab switching
        this.attachTabListeners(container);

        // Preference changes
        this.attachPreferenceListeners(container);

        // Action buttons
        this.attachActionListeners(container);
    }

    /**
     * Attach preference change listeners
     */
    attachPreferenceListeners(container) {
        // Text inputs, selects, color pickers
        container.addEventListener('change', (e) => {
            const pref = e.target.dataset.pref;
            if (!pref) return;

            let value = e.target.value;
            
            // Handle checkboxes
            if (e.target.type === 'checkbox') {
                value = e.target.checked;
            }
            
            // Handle ranges
            if (e.target.type === 'range') {
                value = parseFloat(value);
                // Convert percentage to decimal for transparency
                if (pref === 'appearance.transparency') {
                    value = value / 100;
                }
            }

            this.updatePreference(pref, value);
        });

        // Range sliders - update value label
        container.addEventListener('input', (e) => {
            if (e.target.type === 'range') {
                const label = e.target.parentElement.querySelector('.value-label');
                if (label) {
                    let displayValue = e.target.value;
                    if (e.target.dataset.pref === 'appearance.transparency') {
                        displayValue = displayValue + '%';
                    } else if (e.target.dataset.pref?.includes('scale')) {
                        displayValue = (parseFloat(displayValue)).toFixed(1) + 'x';
                    } else {
                        displayValue = displayValue + (e.target.dataset.pref?.includes('size') ? 'px' : '');
                    }
                    label.textContent = displayValue;
                }
            }
        });

        // Button-based preferences
        container.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-pref][data-value]');
            if (btn) {
                const pref = btn.dataset.pref;
                const value = btn.dataset.value;
                this.updatePreference(pref, value);
                
                // Update active state
                btn.parentElement.querySelectorAll('[data-pref]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            }
        });
    }

    /**
     * Attach action button listeners
     */
    attachActionListeners(container) {
        container.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (!action) return;

            switch (action) {
                case 'clear-cache':
                    this.clearCache();
                    break;
                case 'export-settings':
                    this.exportSettings();
                    break;
                case 'import-settings':
                    this.importSettings();
                    break;
                case 'reset-all':
                    this.resetToDefaults();
                    break;
            }
        });
    }

    /**
     * Update a single preference
     */
    updatePreference(path, value) {
        console.log('💾 Updating preference:', path, '=', value);
        const keys = path.split('.');
        let current = this.preferences;
        
        // Navigate to the nested property
        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) {
                current[keys[i]] = {};
            }
            current = current[keys[i]];
        }
        
        // Set the value
        current[keys[keys.length - 1]] = value;
        
        // Save to localStorage
        this.savePreferences();
        
        // Apply the change immediately
        this.applyPreference(path, value);
        
        this.unsavedChanges = true;
    }

    /**
     * Apply a preference change immediately
     */
    applyPreference(path, value) {
        // Apply immediate UI changes for certain preferences
        if (path === 'appearance.accent_color') {
            // Update CSS variable immediately for accent color
            document.documentElement.style.setProperty('--accent-color', value);
            console.log('🎨 Applied accent color:', value);
        }
        
        // Clear previous timeout
        if (this.previewTimeout) {
            clearTimeout(this.previewTimeout);
        }

        // Debounce and emit event
        this.previewTimeout = setTimeout(() => {
            console.log('📡 Emitting preference:changed event:', path, value);
            
            // Emit singular event (new style) - per-preference granular updates
            EventBus.emit('preference:changed', { path, value, preferences: this.preferences });
            
            // Emit plural event (legacy style) - full preferences object
            EventBus.emit('preferences:changed', { data: this.preferences });
        }, 300);
    }

    /**
     * Save preferences to localStorage
     */
    savePreferences() {
        try {
            localStorage.setItem('userPreferences', JSON.stringify(this.preferences));
            console.log('Preferences saved to localStorage');
        } catch (error) {
            console.error('Failed to save preferences:', error);
        }
    }

    /**
     * Apply all stored preferences on init
     */
    applyStoredPreferences() {
        if (!this.preferences) return;
        
        // Apply accent color immediately
        if (this.preferences.appearance?.accent_color) {
            document.documentElement.style.setProperty('--accent-color', this.preferences.appearance.accent_color);
            console.log('🎨 Loaded accent color:', this.preferences.appearance.accent_color);
        }
        
        // Emit initial preferences
        EventBus.emit('preferences:loaded', this.preferences);
        
        // Load wallpapers if on desktop tab
        setTimeout(() => this.loadWallpapersIfNeeded(), 100);
    }

    /**
     * Load wallpapers if desktop tab is visible
     */
    async loadWallpapersIfNeeded() {
        const galleryContainer = document.getElementById('wallpaper-gallery-container');
        if (!galleryContainer) return;

        try {
            const response = await fetch('/api/images/wallpapers');
            const data = await response.json();
            if (data.success) {
                this.renderWallpaperGallery(galleryContainer, data.data.wallpapers || []);
            } else {
                throw new Error(data.error || 'Failed to load wallpapers');
            }
        } catch (error) {
            console.error('Failed to load wallpapers:', error);
            galleryContainer.innerHTML = '<div class="wallpaper-error">Failed to load wallpapers</div>';
        }
    }

    /**
     * Render wallpaper gallery
     */
    renderWallpaperGallery(container, wallpapers) {
        // Parse current wallpaper from localStorage (Desktop saves it as JSON object)
        let currentWallpaperId = 'sonoma-light';
        try {
            const stored = localStorage.getItem('current_wallpaper');
            console.log('🖼️ Stored wallpaper data:', stored);
            if (stored) {
                const parsed = JSON.parse(stored);
                currentWallpaperId = parsed.id || parsed;
                console.log('🎯 Current wallpaper ID:', currentWallpaperId);
            }
        } catch (e) {
            console.warn('Failed to parse wallpaper, using string:', e);
            // If parsing fails, use the string directly
            currentWallpaperId = localStorage.getItem('current_wallpaper') || 'sonoma-light';
        }
        
        const gallery = document.createElement('div');
        gallery.className = 'wallpaper-gallery';

        // Render items immediately with lightweight placeholders.
        // Each image will load asynchronously and update its state when ready.
        wallpapers.forEach(wallpaper => {
            const item = document.createElement('div');
            const isSelected = currentWallpaperId === wallpaper.id;
            item.className = `wallpaper-item ${isSelected ? 'selected' : ''}`;
            item.dataset.wallpaperId = wallpaper.id;
            item.dataset.wallpaperFilename = wallpaper.filename;

            // Image element with progressive loading behavior
            const img = document.createElement('img');
            img.alt = wallpaper.name || '';
            img.loading = 'lazy';
            img.decoding = 'async';
            img.className = 'wallpaper-thumb loading';
            img.setAttribute('aria-hidden', 'false');

            // Info block (rendered immediately)
            const info = document.createElement('div');
            info.className = 'wallpaper-info';
            info.innerHTML = `
                <div class="wallpaper-name">${wallpaper.name}</div>
                <div class="wallpaper-version">${wallpaper.version || ''}</div>
            `;

            // Append item to gallery first so the browser can start painting placeholders
            item.appendChild(img);
            item.appendChild(info);
            gallery.appendChild(item);

            // Click handler
            item.addEventListener('click', () => this.selectWallpaper(wallpaper, item));

            // Load the image asynchronously after insertion to avoid blocking layout
            // Use a small timeout to yield to the DOM thread
            setTimeout(() => {
                let src = wallpaper.thumbnail || wallpaper.fullImage || '';
                if (!src) {
                    // No image available — hide item
                    item.style.display = 'none';
                    return;
                }

                let hasFallenBack = false;

                img.onload = () => {
                    img.classList.remove('loading');
                    item.classList.add('loaded');
                };

                img.onerror = () => {
                    // Try fallback to full image if thumbnail failed
                    if (!hasFallenBack && wallpaper.fullImage && wallpaper.fullImage !== src) {
                        hasFallenBack = true;
                        src = wallpaper.fullImage;
                        img.src = src;
                        return;
                    }

                    // If still failing, remove the item after a brief grace period
                    img.classList.remove('loading');
                    img.classList.add('error');
                    setTimeout(() => { item.style.display = 'none'; }, 1200);
                };

                // Safety timeout: if image doesn't load within 8s, mark as error
                const failTimer = setTimeout(() => {
                    if (img.classList.contains('loading')) {
                        img.classList.remove('loading');
                        img.classList.add('error');
                    }
                }, 8000);

                img.onloadend = img.onloadend || function() { clearTimeout(failTimer); };

                // Kick off load
                img.src = src;
            }, 0);
        });

        container.innerHTML = '';
        container.appendChild(gallery);
    }

    /**
     * Select a wallpaper
     */
    selectWallpaper(wallpaper, element) {
        // Remove previous selection
        document.querySelectorAll('.wallpaper-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        // Mark as selected
        element.classList.add('selected');
        
        // Save to localStorage
        localStorage.setItem('current_wallpaper', wallpaper.id);
        
        // Emit event to change wallpaper immediately
        EventBus.emit('wallpaper:change', {
            id: wallpaper.id,
            filename: wallpaper.filename,
            type: wallpaper.type,
            url: wallpaper.fullImage,
            thumbnail: wallpaper.thumbnail
        });
        
        console.log('Wallpaper selected:', wallpaper.name);
    }

    /**
     * Update UI after tab switch
     */
    updateUI(container) {
        // Update sidebar
        const sidebar = container.querySelector('.preferences-sidebar');
        sidebar.innerHTML = this.renderSidebar();
        
        // Update content
        const content = container.querySelector('.preferences-content');
        content.innerHTML = this.renderContent();
        
        // Reattach ALL listeners (including tab listeners)
        this.attachTabListeners(container);
        this.attachPreferenceListeners(container);
        this.attachActionListeners(container);
        
        // Load wallpapers if desktop tab
        if (this.currentTab === 'desktop') {
            this.loadWallpapersIfNeeded();
        }
    }

    /**
     * Attach tab switching listeners
     */
    attachTabListeners(container) {
        container.querySelectorAll('.preferences-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.currentTab = e.currentTarget.dataset.tab;
                this.updateUI(container);
            });
        });
    }

    /**
     * Clear cache
     */
    clearCache() {
        if (confirm('Clear all cached data? This will reload the page.')) {
            localStorage.removeItem('wallpaperCache');
            localStorage.removeItem('portfolioCache');
            location.reload();
        }
    }

    /**
     * Export settings to JSON file
     */
    exportSettings() {
        const data = JSON.stringify(this.preferences, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'preferences-export.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Import settings from JSON file
     */
    importSettings() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const imported = JSON.parse(event.target.result);
                    this.preferences = imported;
                    this.savePreferences();
                    location.reload();
                } catch (error) {
                    alert('Invalid preferences file');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    /**
     * Reset all preferences to defaults
     */
    resetToDefaults() {
        if (confirm('Reset all preferences to defaults? This cannot be undone.')) {
            localStorage.removeItem('userPreferences');
            location.reload();
        }
    }

    /**
     * Get default preferences
     */
    getDefaultPreferences() {
        return {
            appearance: { theme: 'auto', accent_color: LinkOS_COLORS.SYSTEM_BLUE, transparency: 0.8 },
            desktop: { wallpaper: { auto_rotation: true }, icons: { size: 'medium' } },
            dock: { position: 'bottom', size: 64, magnification: { enabled: true, scale: 1.5 } },
            terminal: { appearance: { theme: 'matrix', font_size: 14 }, behavior: { history_size: 1000 } },
            performance: { },
            privacy: { remember_session: true }
        };
    }

    /**
     * Render error state
     */
    renderError() {
        const container = document.createElement('div');
        container.className = 'preferences-error';
        container.innerHTML = `
            <h2>Failed to Load Preferences</h2>
            <p>Please try again later.</p>
        `;
        return container;
    }

    /**
     * Switch to a specific tab programmatically
     * @param {string} tabId - The ID of the tab to switch to
     */
    switchTab(tabId) {
        console.log('🔄 Switching to tab:', tabId);
        
        // Validate tab exists
        const validTab = this.tabs.find(tab => tab.id === tabId);
        if (!validTab) {
            console.warn('Invalid tab ID:', tabId);
            return;
        }
        
        // Update current tab
        this.currentTab = tabId;
        
        // Find the container and update UI
        const container = document.querySelector('.preferences-container');
        if (container) {
            this.updateUI(container);
            
            // Make sure the tab button is visually active
            container.querySelectorAll('.preferences-tab').forEach(tab => {
                if (tab.dataset.tab === tabId) {
                    tab.classList.add('active');
                    // Scroll tab into view if needed
                    tab.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                } else {
                    tab.classList.remove('active');
                }
            });
            
            console.log('✅ Tab switched to:', tabId);
        } else {
            console.warn('Preferences container not found in DOM');
        }
    }

    /**
     * Destroy component and cleanup
     */
    destroy() {
        if (this.previewTimeout) {
            clearTimeout(this.previewTimeout);
        }
    }
}
