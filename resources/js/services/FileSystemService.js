/**
 * FileSystemService - Centralized filesystem management
 * Shared between Terminal and Finder components
 * Loads and manages virtual filesystem from filesystem.json
 */

class FileSystemService {
    static instance = null;
    static fileSystem = null;
    static loading = false;
    static loadPromise = null;

    /**
     * Load filesystem from JSON file
     * @returns {Promise<Object>} Filesystem data
     */
    static async loadFileSystem() {
        // Return cached instance if already loaded
        if (this.fileSystem) {
            return this.fileSystem;
        }

        // Return existing promise if loading
        if (this.loading && this.loadPromise) {
            return this.loadPromise;
        }

        // Start loading
        this.loading = true;
        this.loadPromise = this._fetchFileSystem();

        try {
            this.fileSystem = await this.loadPromise;
            console.log('📁 FileSystemService: Loaded filesystem', {
                rootKeys: Object.keys(this.fileSystem),
                homeContents: Object.keys(this.fileSystem.home?.contents || {})
            });
            return this.fileSystem;
        } finally {
            this.loading = false;
            this.loadPromise = null;
        }
    }

    /**
     * Fetch filesystem from server (centralized storage/data/filesystem.json)
     * @private
     */
    static async _fetchFileSystem() {
        try {
            const response = await fetch('/api/filesystem');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const json = await response.json();
            
            // Extract data from API response wrapper
            const data = json.success && json.data ? json.data : json;
            
            // Validate structure
            if (data.home && data.home.contents) {
                console.log('✅ FileSystemService: Loaded from API', {
                    source: data._metadata?.source || 'unknown',
                    rootKeys: Object.keys(data).filter(k => k !== '_metadata')
                });
                return data;
            } else {
                console.warn('FileSystemService: Invalid filesystem structure', data);
                return this._getDefaultFileSystem();
            }
        } catch (error) {
            console.error('FileSystemService: Failed to load filesystem.json', error);
            return this._getDefaultFileSystem();
        }
    }

    /**
     * Get folder contents at path
     * @param {string} path - Path like '/home/abdulmelik' or '~/projects'
     * @returns {Object|null} Folder contents or null if not found
     */
    static getFolderContents(path) {
        if (!this.fileSystem) {
            console.warn('FileSystemService: Filesystem not loaded');
            return null;
        }

        const normalizedPath = this._normalizePath(path);
        const node = this._navigateToNode(normalizedPath);

        if (!node) {
            console.warn(`FileSystemService: Path not found: ${path}`);
            return null;
        }

        if (node.type !== 'directory') {
            console.warn(`FileSystemService: Not a directory: ${path}`);
            return null;
        }

        return node.contents || {};
    }

    /**
     * Get info about a file or folder
     * @param {string} path - Path to file/folder
     * @returns {Object|null} Node info or null
     */
    static getNodeInfo(path) {
        if (!this.fileSystem) return null;

        const normalizedPath = this._normalizePath(path);
        return this._navigateToNode(normalizedPath);
    }

    /**
     * Check if path exists
     * @param {string} path - Path to check
     * @returns {boolean}
     */
    static pathExists(path) {
        return this.getNodeInfo(path) !== null;
    }

    /**
     * Get parent directory path
     * @param {string} path - Current path
     * @returns {string} Parent path
     */
    static getParentPath(path) {
        const normalizedPath = this._normalizePath(path);
        const parts = normalizedPath.split('/').filter(p => p);
        
        if (parts.length <= 1) {
            return '/';
        }

        parts.pop();
        return '/' + parts.join('/');
    }

    /**
     * Search files and folders
     * @param {string} query - Search query
     * @param {string} searchPath - Path to search in (optional)
     * @returns {Array} Array of matching items
     */
    static searchFiles(query, searchPath = '/home/abdulmelik') {
        if (!query || !this.fileSystem) return [];

        const results = [];
        const lowerQuery = query.toLowerCase();
        const startNode = this.getNodeInfo(searchPath);

        if (!startNode || !startNode.contents) return [];

        this._searchRecursive(startNode.contents, searchPath, lowerQuery, results);
        return results;
    }

    /**
     * Recursive search helper
     * @private
     */
    static _searchRecursive(contents, currentPath, query, results) {
        for (const [name, node] of Object.entries(contents)) {
            if (name.toLowerCase().includes(query)) {
                results.push({
                    name,
                    path: `${currentPath}/${name}`,
                    type: node.type,
                    size: node.size,
                    modified: node.modified
                });
            }

            if (node.type === 'directory' && node.contents) {
                this._searchRecursive(node.contents, `${currentPath}/${name}`, query, results);
            }
        }
    }

    /**
     * Normalize path (resolve ~, .., .)
     * @private
     */
    static _normalizePath(path) {
        // Handle ~ as home directory
        if (path.startsWith('~')) {
            path = '/home/abdulmelik' + path.slice(1);
        }

        // Handle relative paths
        if (!path.startsWith('/')) {
            path = '/home/abdulmelik/' + path;
        }

        // Remove trailing slash
        if (path.length > 1 && path.endsWith('/')) {
            path = path.slice(0, -1);
        }

        return path;
    }

    /**
     * Navigate to node in filesystem tree
     * @private
     */
    static _navigateToNode(path) {
        const parts = path.split('/').filter(p => p);
        
        // Handle root path - return virtual root with proper structure
        if (parts.length === 0) {
            return {
                type: 'directory',
                modified: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
                size: 4096,
                contents: this.fileSystem
            };
        }
        
        let current = this.fileSystem;

        for (const part of parts) {
            if (!current) {
                return null;
            }
            
            // Navigate into contents if it's a directory
            if (current.contents && current.contents[part]) {
                current = current.contents[part];
            } else if (current[part]) {
                current = current[part];
            } else {
                return null;
            }
        }

        return current;
    }

    /**
     * Get default/fallback filesystem
     * @private
     */
    static _getDefaultFileSystem() {
        return {
            home: {
                type: 'directory',
                modified: 'Oct 19 12:00',
                size: 4096,
                contents: {
                    abdulmelik: {
                        type: 'directory',
                        modified: 'Oct 19 12:00',
                        size: 4096,
                        contents: {
                            'README.md': {
                                type: 'file',
                                modified: 'Oct 19 12:00',
                                size: 128,
                                content: '# Welcome to Finder!\n\nThis is a LinkOS-style file browser.'
                            }
                        }
                    }
                }
            }
        };
    }

    /**
     * Clear cache (for testing)
     */
    static clearCache() {
        this.fileSystem = null;
        this.loading = false;
        this.loadPromise = null;
        console.log('📁 FileSystemService: Cache cleared');
    }
}

export default FileSystemService;
