/**
 * ColorConstants.js - Centralized color definitions for LinkOS portfolio
 * All color values should reference these constants
 */

export const LinkOS_COLORS = {
    // System Accent Colors
    SYSTEM_BLUE: '#007AFF',
    SYSTEM_BLUE_ALT: '#007aff', // Lowercase variant for compatibility
    
    // Window Control Colors
    WINDOW_CLOSE: '#ff5f57',
    WINDOW_CLOSE_HOVER: '#ff4743',
    WINDOW_MINIMIZE: '#ffbd2e',
    WINDOW_MINIMIZE_HOVER: '#ffab00',
    WINDOW_MAXIMIZE: '#28ca42',
    WINDOW_MAXIMIZE_HOVER: '#1fb934',
    
    // Text Colors
    TEXT_PRIMARY: '#1d1d1f',
    TEXT_SECONDARY: '#86868b',
    TEXT_TERTIARY: '#6e6e73',
    
    // Background Colors
    BG_PRIMARY: '#ffffff',
    BG_SECONDARY: '#f5f5f7',
    BG_TERTIARY: '#fafafa',
    
    // Dock Colors
    DOCK_TEXT: '#333',
    DOCK_SHADOW: 'rgba(0, 0, 0, 0.3)',
    
    // Border Colors
    BORDER_LIGHT: '#d2d2d7',
    BORDER_DARK: '#1d1d1f',
    
    // Transparent
    TRANSPARENT: 'transparent'
};

// Terminal color themes are in /components/terminal/themes/TerminalThemes.js
// DO NOT duplicate them here

export default LinkOS_COLORS;
