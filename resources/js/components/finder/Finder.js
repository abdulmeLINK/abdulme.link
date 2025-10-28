/**
 * Finder - LinkOS-style file browser
 * Displays files and folders from FileSystemService
 */

import FileSystemService from '../../services/FileSystemService.js';
import EventBus from '../EventBus.js';
import FINDER_CONFIG from '../../config/FinderConfig.js';

class Finder {
    constructor() {
        this.container = null;
        this.currentPath = '/';
        this.viewMode = FINDER_CONFIG.DEFAULTS.viewMode;
        this.sortBy = FINDER_CONFIG.DEFAULTS.sortBy;
        this.sortOrder = FINDER_CONFIG.DEFAULTS.sortOrder;
        this.selectedItems = [];
        this.history = ['/'];
        this.historyIndex = 0;
        this.searchQuery = '';
        this.sidebarCollapsed = false;
    }

    /**
     * Initialize Finder
     */
    async init(container) {
        this.container = container;
        console.log('📁 Finder: Initializing...');

        try {
            // Load filesystem
            await FileSystemService.loadFileSystem();
            
            // Render UI
            this.render();
            
            // Setup event listeners
            this.setupEventListeners();
            
            console.log('📁 Finder: Initialized successfully');
            EventBus.emit('finder:ready');
        } catch (error) {
            console.error('Finder: Initialization failed', error);
            this.renderError(error);
        }
    }

    /**
     * Render Finder UI
     */
    render() {
        const html = `
            <div class="finder-container">
                <div class="finder-window">
                    ${this.renderToolbar()}
                    <div class="finder-body">
                        ${this.renderSidebar()}
                        ${this.renderContent()}
                    </div>
                </div>
            </div>
        `;
        this.container.innerHTML = html;
        console.log('📁 Finder: Rendered HTML, container has', this.container.children.length, 'children');
        console.log('📁 Finder: Container dimensions:', this.container.offsetWidth, 'x', this.container.offsetHeight);
    }

    /**
     * Render toolbar
     */
    renderToolbar() {
        const canGoBack = this.historyIndex > 0;
        const canGoForward = this.historyIndex < this.history.length - 1;

        return `
            <div class="finder-toolbar">
                <div class="finder-nav-buttons">
                    <button class="finder-btn finder-btn-back" ${!canGoBack ? 'disabled' : ''} data-action="back">
                        <span>◀</span>
                    </button>
                    <button class="finder-btn finder-btn-forward" ${!canGoForward ? 'disabled' : ''} data-action="forward">
                        <span>▶</span>
                    </button>
                </div>
                
                <div class="finder-breadcrumb">
                    ${this.renderBreadcrumb()}
                </div>
                
                <div class="finder-view-controls">
                    <button class="finder-btn ${this.viewMode === 'grid' ? 'active' : ''}" data-action="view-grid" title="Grid View">
                        <span>⊞</span>
                    </button>
                    <button class="finder-btn ${this.viewMode === 'list' ? 'active' : ''}" data-action="view-list" title="List View">
                        <span>☰</span>
                    </button>
                    <button class="finder-btn ${this.viewMode === 'column' ? 'active' : ''}" data-action="view-column" title="Column View">
                        <span>⊡</span>
                    </button>
                </div>
                
                <div class="finder-search">
                    <input type="text" placeholder="Search" class="finder-search-input" value="${this.searchQuery}" />
                </div>
            </div>
        `;
    }

    /**
     * Render breadcrumb navigation
     */
    renderBreadcrumb() {
        const parts = this.currentPath.split('/').filter(p => p);
        let crumbs = '<span class="breadcrumb-item" data-path="/">Root</span>';
        
        let path = '';
        parts.forEach(part => {
            path += '/' + part;
            crumbs += ` <span class="breadcrumb-sep">›</span> <span class="breadcrumb-item" data-path="${path}">${part}</span>`;
        });
        
        return crumbs;
    }

    /**
     * Render sidebar
     */
    renderSidebar() {
        return `
            <div class="finder-sidebar ${this.sidebarCollapsed ? 'collapsed' : ''}">
                <div class="sidebar-section">
                    <div class="sidebar-header">Favorites</div>
                    ${FINDER_CONFIG.DEFAULT_FAVORITES.map(fav => `
                        <div class="sidebar-item ${this.currentPath === fav.path ? 'active' : ''}" data-path="${fav.path}">
                            <span class="sidebar-icon">${fav.icon}</span>
                            <span class="sidebar-label">${fav.name}</span>
                        </div>
                    `).join('')}
                </div>
                
                <div class="sidebar-section">
                    <div class="sidebar-header">Locations</div>
                    ${FINDER_CONFIG.SYSTEM_LOCATIONS.map(loc => `
                        <div class="sidebar-item ${this.currentPath === loc.path ? 'active' : ''}" data-path="${loc.path}">
                            <span class="sidebar-icon">${loc.icon}</span>
                            <span class="sidebar-label">${loc.name}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render content area
     */
    renderContent() {
        const contents = FileSystemService.getFolderContents(this.currentPath);
        
        if (!contents) {
            return '<div class="finder-content"><div class="finder-error">Folder not found</div></div>';
        }

        let items = Object.entries(contents).map(([name, node]) => ({
            name,
            ...node
        }));

        // Filter by search query if exists
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            items = items.filter(item => item.name.toLowerCase().includes(query));
        }

        // Sort items
        const sortedItems = this.sortItems(items);

        return `
            <div class="finder-content finder-view-${this.viewMode}">
                ${sortedItems.length === 0 ? 
                    `<div class="finder-empty">${this.searchQuery ? 'No items match your search' : 'This folder is empty'}</div>` 
                    : ''}
                ${this.viewMode === 'grid' ? this.renderGridView(sortedItems) : ''}
                ${this.viewMode === 'list' ? this.renderListView(sortedItems) : ''}
                ${this.viewMode === 'column' ? this.renderColumnView(sortedItems) : ''}
            </div>
        `;
    }

    /**
     * Render grid view
     */
    renderGridView(items) {
        return `
            <div class="finder-grid">
                ${items.map(item => `
                    <div class="grid-item ${item.type}" data-name="${item.name}" data-type="${item.type}">
                        <div class="grid-icon">${this.getFileIcon(item)}</div>
                        <div class="grid-label">${item.name}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Render list view
     */
    renderListView(items) {
        return `
            <div class="finder-list">
                <div class="list-header">
                    <div class="list-col-name">Name</div>
                    <div class="list-col-modified">Modified</div>
                    <div class="list-col-size">Size</div>
                    <div class="list-col-kind">Kind</div>
                </div>
                ${items.map(item => `
                    <div class="list-item ${item.type}" data-name="${item.name}" data-type="${item.type}">
                        <div class="list-col-name">
                            <span class="list-icon">${this.getFileIcon(item)}</span>
                            <span>${item.name}</span>
                        </div>
                        <div class="list-col-modified">${item.modified || '-'}</div>
                        <div class="list-col-size">${item.size ? this.formatSize(item.size) : '-'}</div>
                        <div class="list-col-kind">${item.type === 'directory' ? 'Folder' : 'File'}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Render column view (simplified)
     */
    renderColumnView(items) {
        return this.renderListView(items); // Simplified for now
    }

    /**
     * Get file icon based on type/extension
     */
    getFileIcon(item) {
        if (item.type === 'directory') {
            return FINDER_CONFIG.FILE_ICONS.directory;
        }
        
        const ext = item.name.split('.').pop().toLowerCase();
        return FINDER_CONFIG.FILE_ICONS[ext] || FINDER_CONFIG.FILE_ICONS.file;
    }

    /**
     * Format file size
     */
    formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    /**
     * Sort items
     */
    sortItems(items) {
        return items.sort((a, b) => {
            // Folders first
            if (a.type === 'directory' && b.type !== 'directory') return -1;
            if (a.type !== 'directory' && b.type === 'directory') return 1;

            // Then by sort criteria
            let comparison = 0;
            if (this.sortBy === 'name') {
                comparison = a.name.localeCompare(b.name);
            } else if (this.sortBy === 'size') {
                comparison = (a.size || 0) - (b.size || 0);
            } else if (this.sortBy === 'date') {
                comparison = (a.modified || '').localeCompare(b.modified || '');
            }

            return this.sortOrder === 'asc' ? comparison : -comparison;
        });
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Store bound handlers for cleanup
        this.handlers = {
            toolbarClick: (e) => {
                const action = e.target.closest('[data-action]')?.dataset.action;
                if (action === 'back') this.goBack();
                if (action === 'forward') this.goForward();
                if (action === 'view-grid') this.setViewMode('grid');
                if (action === 'view-list') this.setViewMode('list');
                if (action === 'view-column') this.setViewMode('column');
            },
            breadcrumbClick: (e) => {
                const breadcrumbItem = e.target.closest('.breadcrumb-item');
                if (breadcrumbItem) {
                    this.navigateTo(breadcrumbItem.dataset.path);
                }
            },
            sidebarClick: (e) => {
                const sidebarItem = e.target.closest('.sidebar-item');
                if (sidebarItem) {
                    this.navigateTo(sidebarItem.dataset.path);
                }
            },
            itemDoubleClick: (e) => {
                const item = e.target.closest('[data-name][data-type]');
                if (item) {
                    if (item.dataset.type === 'directory') {
                        const newPath = this.currentPath === '/' 
                            ? '/' + item.dataset.name 
                            : this.currentPath + '/' + item.dataset.name;
                        this.navigateTo(newPath);
                    } else if (item.dataset.type === 'file') {
                        // Open file viewer for text files
                        this.openFile(item.dataset.name);
                    }
                }
            },
            searchInput: (e) => {
                // Debounce search to avoid excessive re-renders
                clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(() => {
                    this.searchQuery = e.target.value;
                    this.render();
                }, 300);
            },
            finderNavigate: (data) => {
                if (data.path) this.navigateTo(data.path);
            }
        };

        // Add DOM event listeners
        this.container.addEventListener('click', this.handlers.toolbarClick);
        this.container.addEventListener('click', this.handlers.breadcrumbClick);
        this.container.addEventListener('click', this.handlers.sidebarClick);
        this.container.addEventListener('dblclick', this.handlers.itemDoubleClick);

        // Search input
        const searchInput = this.container.querySelector('.finder-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', this.handlers.searchInput);
        }

        // EventBus listeners
        EventBus.on('finder:navigate', this.handlers.finderNavigate);
    }

    /**
     * Navigate to path
     */
    navigateTo(path) {
        if (!FileSystemService.pathExists(path)) {
            console.warn('Finder: Path does not exist:', path);
            return;
        }

        this.currentPath = path;
        
        // Update history
        if (this.history[this.historyIndex] !== path) {
            this.history = this.history.slice(0, this.historyIndex + 1);
            this.history.push(path);
            this.historyIndex = this.history.length - 1;
        }

        this.render();
        EventBus.emit('finder:path-changed', { path });
    }

    /**
     * Go back in history
     */
    goBack() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.currentPath = this.history[this.historyIndex];
            this.render();
        }
    }

    /**
     * Go forward in history
     */
    goForward() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.currentPath = this.history[this.historyIndex];
            this.render();
        }
    }

    /**
     * Set view mode
     */
    setViewMode(mode) {
        this.viewMode = mode;
        this.render();
    }

    /**
     * Open file viewer
     */
    openFile(filename) {
        const filePath = this.currentPath === '/' 
            ? '/' + filename 
            : this.currentPath + '/' + filename;
        
        const fileInfo = FileSystemService.getNodeInfo(filePath);
        
        if (!fileInfo) {
            console.warn('Finder: File not found:', filePath);
            return;
        }

        if (fileInfo.type !== 'file') {
            console.warn('Finder: Not a file:', filePath);
            return;
        }

        // Emit event to open file viewer
        EventBus.emit('file:open', {
            path: filePath,
            name: filename,
            content: fileInfo.content || '',
            size: fileInfo.size,
            modified: fileInfo.modified,
            type: this.getFileType(filename)
        });

        console.log('📄 Finder: Opening file:', filename);
    }

    /**
     * Get file type from extension
     */
    getFileType(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const textExtensions = ['txt', 'md', 'json', 'js', 'py', 'php', 'html', 'css', 'xml', 'log', 'sh', 'yml', 'yaml'];
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'];
        const pdfExtensions = ['pdf'];

        if (textExtensions.includes(ext)) return 'text';
        if (imageExtensions.includes(ext)) return 'image';
        if (pdfExtensions.includes(ext)) return 'pdf';
        return 'unknown';
    }

    /**
     * Render error
     */
    renderError(error) {
        this.container.innerHTML = `
            <div class="finder-error">
                <h3>Failed to load Finder</h3>
                <p>${error.message}</p>
            </div>
        `;
    }

    /**
     * Destroy component
     */
    destroy() {
        // Clear any pending search timeout
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = null;
        }

        // Remove DOM event listeners
        if (this.container && this.handlers) {
            this.container.removeEventListener('click', this.handlers.toolbarClick);
            this.container.removeEventListener('click', this.handlers.breadcrumbClick);
            this.container.removeEventListener('click', this.handlers.sidebarClick);
            this.container.removeEventListener('dblclick', this.handlers.itemDoubleClick);
            
            const searchInput = this.container.querySelector('.finder-search-input');
            if (searchInput) {
                searchInput.removeEventListener('input', this.handlers.searchInput);
            }
        }

        // Remove EventBus listeners
        if (this.handlers && this.handlers.finderNavigate) {
            EventBus.off('finder:navigate', this.handlers.finderNavigate);
        }

        // Clear references
        this.handlers = null;
        this.container = null;
        this.selectedItems = [];
        this.history = [];
        
        console.log('📁 Finder: Destroyed and cleaned up');
    }
}

export default Finder;
