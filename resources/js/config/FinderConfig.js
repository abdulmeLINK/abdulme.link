/**
 * FinderConfig - Constants and defaults for Finder component
 */

export const FINDER_CONFIG = {
    // View modes
    VIEW_MODES: {
        GRID: 'grid',
        LIST: 'list',
        COLUMN: 'column'
    },

    // Sort options
    SORT_OPTIONS: {
        NAME: 'name',
        DATE: 'date',
        SIZE: 'size',
        KIND: 'kind'
    },

    // Default settings
    DEFAULTS: {
        viewMode: 'grid',
        sortBy: 'name',
        sortOrder: 'asc',
        showHiddenFiles: false,
        sidebarWidth: 180,
        gridIconSize: 64
    },

    // UI dimensions
    DIMENSIONS: {
        SIDEBAR_WIDTH: 180,
        SIDEBAR_COLLAPSED: 40,
        TOOLBAR_HEIGHT: 52,
        GRID_ITEM_WIDTH: 80,
        GRID_ITEM_HEIGHT: 100,
        LIST_ROW_HEIGHT: 24,
        COLUMN_WIDTH: 200
    },

    // File type icons (emoji)
    FILE_ICONS: {
        directory: '📁',
        file: '📄',
        txt: '📄',
        md: '📝',
        json: '📋',
        js: '📜',
        py: '🐍',
        php: '🐘',
        html: '🌐',
        css: '🎨',
        jpg: '🖼️',
        png: '🖼️',
        svg: '🎨',
        pdf: '📕',
        zip: '📦',
        tar: '📦'
    },

    // Default favorites (from centralized filesystem.json)
    DEFAULT_FAVORITES: [
        { name: 'Home', path: '/home/abdulmelik', icon: '🏠' },
        { name: 'Projects', path: '/home/abdulmelik/projects', icon: '💼' },
        { name: 'Documents', path: '/home/abdulmelik/documents', icon: '📄' },
        { name: 'Skills', path: '/home/abdulmelik/skills', icon: '⚡' }
    ],

    // System locations
    SYSTEM_LOCATIONS: [
        { name: 'Root', path: '/', icon: '💾' },
        { name: 'Home Directory', path: '/home', icon: '🏡' }
    ]
};

export default FINDER_CONFIG;
