import EventBus from '../EventBus.js';

/**
 * Window - LinkOS window management system
 * Handles draggable windows, traffic light controls, and authentic LinkOS behavior
 */
class Window {
    constructor(config = {}) {
        // Required configuration
        this.id = config.id || this.generateId();
        this.title = config.title || 'Untitled';
        this.content = config.content || '';
        this.appId = config.appId || 'unknown';
        
        // Window properties
        this.position = config.position || { x: 100, y: 100 };
        this.size = config.size || { width: 800, height: 600 };
        this.minSize = config.minSize || { width: 300, height: 200 };
        this.maxSize = config.maxSize || { width: window.innerWidth, height: window.innerHeight };
        
        // Window state
        this.isVisible = false;
        this.isMinimized = false;
        this.isMaximized = false;
        this.isResizing = false;
        this.isDragging = false;
        this.isFocused = false;
        this.zIndex = Window.getNextZIndex();
        
        // DOM elements
        this.element = null;
        this.titleBar = null;
        this.contentArea = null;
        this.trafficLights = {};
        this.resizeHandles = {};
        
        // Event handlers
        this.dragState = { isDragging: false, startX: 0, startY: 0, startPosX: 0, startPosY: 0 };
        this.resizeState = { isResizing: false, direction: '', startX: 0, startY: 0, startWidth: 0, startHeight: 0 };
        
        // Configuration
        this.config = {
            titleBarHeight: 28,
            trafficLightSize: 12,
            resizeHandleSize: 10,
            shadowBlur: 20,
            borderRadius: 8,
            animationDuration: 300,
            snapThreshold: 10,
            ...config.windowConfig
        };
        
        this.init();
    }

    /**
     * Initialize window
     */
    init() {
        this.createElement();
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
        
        // Register window with manager
        EventBus.emit('window:created', {
            windowId: this.id,
            appId: this.appId,
            window: this
        });
        
        console.log(`Window created: ${this.title} (${this.id})`);
    }

    /**
     * Create window DOM element
     */
    createElement() {
        // Main window container
        this.element = document.createElement('div');
        this.element.className = 'LinkOS-window';
        this.element.id = `window-${this.id}`;
        this.element.style.cssText = `
            position: fixed;
            left: ${this.position.x}px;
            top: ${this.position.y}px;
            width: ${this.size.width}px;
            height: ${this.size.height}px;
            z-index: ${this.zIndex};
            border-radius: ${this.config.borderRadius}px;
            overflow: hidden;
            transition: transform ${this.config.animationDuration}ms cubic-bezier(0.4, 0, 0.2, 1);
            transform: scale(0.9) translateY(20px);
            opacity: 0;
        `;

        // Title bar
        this.createTitleBar();
        
        // Content area
        this.createContentArea();
        
        // Resize handles
        this.createResizeHandles();
        
        // Add to DOM
        document.body.appendChild(this.element);
        
        // Listen for theme changes
        EventBus.on('theme:changed', this.handleThemeChanged.bind(this));
    }

    /**
     * Create title bar with traffic lights
     */
    createTitleBar() {
        this.titleBar = document.createElement('div');
        this.titleBar.className = 'window-titlebar';
        this.titleBar.style.cssText = `
            height: ${this.config.titleBarHeight}px;
            display: flex;
            align-items: center;
            padding: 0 12px;
            cursor: move;
            user-select: none;
        `;

        // Traffic lights container
        const trafficLightsContainer = document.createElement('div');
        trafficLightsContainer.className = 'traffic-lights';
        trafficLightsContainer.style.cssText = `
            display: flex;
            gap: 8px;
            margin-right: 12px;
        `;

        // Create traffic light buttons
        this.createTrafficLights(trafficLightsContainer);

        // Window title
        const titleElement = document.createElement('div');
        titleElement.className = 'window-title';
        titleElement.textContent = this.title;
        titleElement.style.cssText = `
            flex: 1;
            text-align: center;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            font-size: 13px;
            font-weight: 500;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        `;

        this.titleBar.appendChild(trafficLightsContainer);
        this.titleBar.appendChild(titleElement);
        this.element.appendChild(this.titleBar);
    }

    /**
     * Create traffic light buttons (close, minimize, maximize)
     */
    createTrafficLights(container) {
        const buttons = [
            { type: 'close', color: '#ff5f57', hoverColor: '#ff4743', symbol: '×' },
            { type: 'minimize', color: '#ffbd2e', hoverColor: '#ffab00', symbol: '−' },
            { type: 'maximize', color: '#28ca42', hoverColor: '#1fb934', symbol: '⌃' }
        ];

        buttons.forEach(({ type, color, hoverColor, symbol }) => {
            const button = document.createElement('button');
            button.className = `traffic-light traffic-light-${type}`;
            button.style.cssText = `
                width: ${this.config.trafficLightSize}px;
                height: ${this.config.trafficLightSize}px;
                border-radius: 50%;
                border: none;
                background: ${color};
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 9px;
                font-weight: bold;
                color: rgba(0, 0, 0, 0.6);
                transition: all 150ms ease;
                opacity: 0.8;
            `;

            // Add symbol on hover
            button.addEventListener('mouseenter', () => {
                button.textContent = symbol;
                button.style.background = hoverColor;
                button.style.opacity = '1';
            });

            button.addEventListener('mouseleave', () => {
                button.textContent = '';
                button.style.background = color;
                button.style.opacity = '0.8';
            });

            // Button functionality
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleTrafficLightClick(type);
            });

            this.trafficLights[type] = button;
            container.appendChild(button);
        });
    }

    /**
     * Create content area
     */
    createContentArea() {
        this.contentArea = document.createElement('div');
        this.contentArea.className = 'window-content';
        this.contentArea.style.cssText = `
            height: calc(100% - ${this.config.titleBarHeight}px);
            overflow: auto;
        `;

        // Set content
        if (typeof this.content === 'string') {
            this.contentArea.innerHTML = this.content;
        } else if (this.content instanceof HTMLElement) {
            this.contentArea.appendChild(this.content);
        }

        this.element.appendChild(this.contentArea);
    }

    /**
     * Handle theme changed event
     * @param {object} data - Theme data
     */
    handleThemeChanged(data) {
        console.log(`🎨 Window ${this.title}: Theme changed to ${data.effectiveTheme}`);
        // CSS variables handle the visual changes automatically
        // This is here for any JS-specific theme logic if needed
    }

    /**
     * Create resize handles
     */
    createResizeHandles() {
        const handles = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
        
        handles.forEach(direction => {
            const handle = document.createElement('div');
            handle.className = `resize-handle resize-${direction}`;
            handle.style.cssText = this.getResizeHandleStyles(direction);
            
            handle.addEventListener('mousedown', (e) => {
                this.startResize(e, direction);
            });
            
            this.resizeHandles[direction] = handle;
            this.element.appendChild(handle);
        });
    }

    /**
     * Get resize handle styles based on direction
     */
    getResizeHandleStyles(direction) {
        const size = this.config.resizeHandleSize;
        
        const styles = {
            position: 'absolute',
            background: 'transparent',
            'z-index': '10'
        };

        switch (direction) {
            case 'n':
                return `${this.objectToCSS({...styles, top: '0', left: `${size}px`, right: `${size}px`, height: `${size}px`, cursor: 'n-resize'})}`;
            case 'ne':
                return `${this.objectToCSS({...styles, top: '0', right: '0', width: `${size}px`, height: `${size}px`, cursor: 'ne-resize'})}`;
            case 'e':
                return `${this.objectToCSS({...styles, top: `${size}px`, right: '0', bottom: `${size}px`, width: `${size}px`, cursor: 'e-resize'})}`;
            case 'se':
                return `${this.objectToCSS({...styles, bottom: '0', right: '0', width: `${size}px`, height: `${size}px`, cursor: 'se-resize'})}`;
            case 's':
                return `${this.objectToCSS({...styles, bottom: '0', left: `${size}px`, right: `${size}px`, height: `${size}px`, cursor: 's-resize'})}`;
            case 'sw':
                return `${this.objectToCSS({...styles, bottom: '0', left: '0', width: `${size}px`, height: `${size}px`, cursor: 'sw-resize'})}`;
            case 'w':
                return `${this.objectToCSS({...styles, top: `${size}px`, left: '0', bottom: `${size}px`, width: `${size}px`, cursor: 'w-resize'})}`;
            case 'nw':
                return `${this.objectToCSS({...styles, top: '0', left: '0', width: `${size}px`, height: `${size}px`, cursor: 'nw-resize'})}`;
        }
    }

    /**
     * Convert object to CSS string
     */
    objectToCSS(obj) {
        return Object.entries(obj).map(([key, value]) => `${key}: ${value}`).join('; ');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Title bar dragging
        this.titleBar.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('traffic-light')) return;
            this.startDrag(e);
        });

        // Window focus
        this.element.addEventListener('mousedown', () => {
            this.focus();
        });

        // Global mouse events for dragging and resizing
        document.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                this.handleDrag(e);
            } else if (this.isResizing) {
                this.handleResize(e);
            }
        });

        document.addEventListener('mouseup', () => {
            this.stopDrag();
            this.stopResize();
        });

        // Double-click to maximize
        this.titleBar.addEventListener('dblclick', () => {
            this.toggleMaximize();
        });
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (!this.isFocused) return;

            // Command+M - Minimize
            if (e.metaKey && e.key === 'm') {
                e.preventDefault();
                this.minimize();
            }
            
            // Command+W - Close
            if (e.metaKey && e.key === 'w') {
                e.preventDefault();
                this.close();
            }
        });
    }

    /**
     * Show window with animation
     */
    show() {
        if (this.isVisible) return;
        
        this.isVisible = true;
        this.element.style.display = 'block';
        
        // Animate in
        requestAnimationFrame(() => {
            this.element.style.transform = 'scale(1) translateY(0)';
            this.element.style.opacity = '1';
        });
        
        this.focus();
        
        EventBus.emit('window:shown', {
            windowId: this.id,
            appId: this.appId
        });
    }

    /**
     * Hide window
     */
    hide() {
        if (!this.isVisible) return;
        
        this.isVisible = false;
        
        // Animate out
        this.element.style.transform = 'scale(0.9) translateY(20px)';
        this.element.style.opacity = '0';
        
        setTimeout(() => {
            this.element.style.display = 'none';
        }, this.config.animationDuration);
        
        EventBus.emit('window:hidden', {
            windowId: this.id,
            appId: this.appId
        });
    }

    /**
     * Focus window (bring to front)
     */
    focus() {
        this.isFocused = true;
        this.zIndex = Window.getNextZIndex();
        this.element.style.zIndex = this.zIndex;
        
        // Update visual state
        this.element.classList.add('focused');
        
        EventBus.emit('window:focused', {
            windowId: this.id,
            appId: this.appId,
            zIndex: this.zIndex
        });
    }

    /**
     * Remove focus from window
     */
    blur() {
        this.isFocused = false;
        this.element.classList.remove('focused');
        
        EventBus.emit('window:blurred', {
            windowId: this.id,
            appId: this.appId
        });
    }

    /**
     * Handle traffic light button clicks
     */
    handleTrafficLightClick(type) {
        switch (type) {
            case 'close':
                this.close();
                break;
            case 'minimize':
                this.minimize();
                break;
            case 'maximize':
                this.toggleMaximize();
                break;
        }
    }

    /**
     * Close window
     */
    close() {
        EventBus.emit('window:closing', {
            windowId: this.id,
            appId: this.appId
        });
        
        // Animate out
        this.element.style.transform = 'scale(0.9) translateY(20px)';
        this.element.style.opacity = '0';
        
        setTimeout(() => {
            this.destroy();
        }, this.config.animationDuration);
    }

    /**
     * Minimize window
     */
    minimize() {
        if (this.isMinimized) return;
        
        this.isMinimized = true;
        this.isVisible = false;
        
        // Animate to dock
        const dockRect = document.querySelector('.dock')?.getBoundingClientRect();
        const targetX = dockRect ? dockRect.left + (dockRect.width / 2) : window.innerWidth / 2;
        const targetY = dockRect ? dockRect.top : window.innerHeight - 100;
        
        this.element.style.transform = `scale(0.1) translate(${targetX - this.position.x}px, ${targetY - this.position.y}px)`;
        this.element.style.opacity = '0';
        
        setTimeout(() => {
            this.element.style.display = 'none';
        }, this.config.animationDuration);
        
        EventBus.emit('window:minimized', {
            windowId: this.id,
            appId: this.appId
        });
    }

    /**
     * Restore minimized window
     */
    restore() {
        if (!this.isMinimized) return;
        
        this.isMinimized = false;
        this.element.style.display = 'block';
        
        // Animate back to position
        requestAnimationFrame(() => {
            this.element.style.transform = 'scale(1) translate(0, 0)';
            this.element.style.opacity = '1';
        });
        
        this.show();
        
        EventBus.emit('window:restored', {
            windowId: this.id,
            appId: this.appId
        });
    }

    /**
     * Toggle maximize state
     */
    toggleMaximize() {
        if (this.isMaximized) {
            this.unmaximize();
        } else {
            this.maximize();
        }
    }

    /**
     * Maximize window
     */
    maximize() {
        if (this.isMaximized) return;
        
        // Store original position and size
        this.originalPosition = { ...this.position };
        this.originalSize = { ...this.size };
        
        this.isMaximized = true;
        
        // Animate to full screen
        this.setPosition(0, 0);
        this.setSize(window.innerWidth, window.innerHeight);
        
        EventBus.emit('window:maximized', {
            windowId: this.id,
            appId: this.appId
        });
    }

    /**
     * Unmaximize window
     */
    unmaximize() {
        if (!this.isMaximized) return;
        
        this.isMaximized = false;
        
        // Restore original position and size
        this.setPosition(this.originalPosition.x, this.originalPosition.y);
        this.setSize(this.originalSize.width, this.originalSize.height);
        
        EventBus.emit('window:unmaximized', {
            windowId: this.id,
            appId: this.appId
        });
    }

    /**
     * Start window dragging
     */
    startDrag(e) {
        if (this.isMaximized) return;
        
        this.isDragging = true;
        this.dragState = {
            isDragging: true,
            startX: e.clientX,
            startY: e.clientY,
            startPosX: this.position.x,
            startPosY: this.position.y
        };
        
        this.element.style.cursor = 'move';
        document.body.style.userSelect = 'none';
    }

    /**
     * Handle window dragging
     */
    handleDrag(e) {
        if (!this.isDragging) return;
        
        const deltaX = e.clientX - this.dragState.startX;
        const deltaY = e.clientY - this.dragState.startY;
        
        const newX = this.dragState.startPosX + deltaX;
        const newY = this.dragState.startPosY + deltaY;
        
        // Constrain to screen bounds
        const constrainedX = Math.max(0, Math.min(newX, window.innerWidth - this.size.width));
        const constrainedY = Math.max(0, Math.min(newY, window.innerHeight - this.size.height));
        
        this.setPosition(constrainedX, constrainedY);
    }

    /**
     * Stop window dragging
     */
    stopDrag() {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        this.dragState.isDragging = false;
        
        this.element.style.cursor = '';
        document.body.style.userSelect = '';
    }

    /**
     * Start window resizing
     */
    startResize(e, direction) {
        if (this.isMaximized) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        this.isResizing = true;
        this.resizeState = {
            isResizing: true,
            direction,
            startX: e.clientX,
            startY: e.clientY,
            startWidth: this.size.width,
            startHeight: this.size.height,
            startPosX: this.position.x,
            startPosY: this.position.y
        };
        
        document.body.style.userSelect = 'none';
    }

    /**
     * Handle window resizing
     */
    handleResize(e) {
        if (!this.isResizing) return;
        
        const deltaX = e.clientX - this.resizeState.startX;
        const deltaY = e.clientY - this.resizeState.startY;
        const direction = this.resizeState.direction;
        
        let newWidth = this.resizeState.startWidth;
        let newHeight = this.resizeState.startHeight;
        let newX = this.position.x;
        let newY = this.position.y;
        
        // Calculate new dimensions based on resize direction
        if (direction.includes('e')) {
            newWidth = Math.max(this.minSize.width, Math.min(this.maxSize.width, this.resizeState.startWidth + deltaX));
        }
        if (direction.includes('w')) {
            newWidth = Math.max(this.minSize.width, Math.min(this.maxSize.width, this.resizeState.startWidth - deltaX));
            newX = this.resizeState.startPosX + (this.resizeState.startWidth - newWidth);
        }
        if (direction.includes('s')) {
            newHeight = Math.max(this.minSize.height, Math.min(this.maxSize.height, this.resizeState.startHeight + deltaY));
        }
        if (direction.includes('n')) {
            newHeight = Math.max(this.minSize.height, Math.min(this.maxSize.height, this.resizeState.startHeight - deltaY));
            newY = this.resizeState.startPosY + (this.resizeState.startHeight - newHeight);
        }
        
        this.setSize(newWidth, newHeight);
        this.setPosition(newX, newY);
    }

    /**
     * Stop window resizing
     */
    stopResize() {
        if (!this.isResizing) return;
        
        this.isResizing = false;
        this.resizeState.isResizing = false;
        
        document.body.style.userSelect = '';
    }

    /**
     * Set window position
     */
    setPosition(x, y) {
        this.position.x = x;
        this.position.y = y;
        
        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;
    }

    /**
     * Set window size
     */
    setSize(width, height) {
        this.size.width = width;
        this.size.height = height;
        
        this.element.style.width = `${width}px`;
        this.element.style.height = `${height}px`;
    }

    /**
     * Update window title
     */
    setTitle(title) {
        this.title = title;
        const titleElement = this.element.querySelector('.window-title');
        if (titleElement) {
            titleElement.textContent = title;
        }
    }

    /**
     * Update window content
     */
    setContent(content) {
        this.content = content;
        
        if (typeof content === 'string') {
            this.contentArea.innerHTML = content;
        } else if (content instanceof HTMLElement) {
            this.contentArea.innerHTML = '';
            this.contentArea.appendChild(content);
        }
    }

    /**
     * Destroy window and clean up
     */
    destroy() {
        EventBus.emit('window:destroyed', {
            windowId: this.id,
            appId: this.appId
        });
        
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        
        // Clean up references
        this.element = null;
        this.titleBar = null;
        this.contentArea = null;
        this.trafficLights = {};
        this.resizeHandles = {};
    }

    /**
     * Generate unique window ID
     */
    generateId() {
        return 'window_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Get next z-index for window stacking
     */
    static getNextZIndex() {
        Window.currentZIndex = (Window.currentZIndex || 1000) + 1;
        return Window.currentZIndex;
    }
}

export default Window;