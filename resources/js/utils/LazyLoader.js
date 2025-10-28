/**
 * LazyLoader - Dynamic component loading utility
 * 
 * Loads components on-demand to reduce initial bundle size
 * and improve performance
 */
class LazyLoader {
    constructor() {
        this.loadedComponents = new Map();
        this.loadingComponents = new Map();
        this.observers = new Map();
    }

    /**
     * Load component dynamically
     * 
     * @param {string} componentName - Name of component to load
     * @param {string} path - Path to component module
     * @returns {Promise<any>} Loaded component
     */
    async loadComponent(componentName, path) {
        // Return if already loaded
        if (this.loadedComponents.has(componentName)) {
            return this.loadedComponents.get(componentName);
        }

        // Return existing promise if currently loading
        if (this.loadingComponents.has(componentName)) {
            return this.loadingComponents.get(componentName);
        }

        // Create loading promise
        const loadingPromise = this.importComponent(path, componentName);
        this.loadingComponents.set(componentName, loadingPromise);

        try {
            const component = await loadingPromise;
            this.loadedComponents.set(componentName, component);
            this.loadingComponents.delete(componentName);
            return component;
        } catch (error) {
            this.loadingComponents.delete(componentName);
            console.error(`Failed to load component: ${componentName}`, error);
            throw error;
        }
    }

    /**
     * Import component module
     */
    async importComponent(path, componentName) {
        try {
            const module = await import(path);
            return module.default || module[componentName];
        } catch (error) {
            throw new Error(`Component import failed: ${path}`);
        }
    }

    /**
     * Preload component (load but don't instantiate)
     * 
     * @param {string} componentName - Component name
     * @param {string} path - Module path
     */
    preload(componentName, path) {
        if (this.loadedComponents.has(componentName)) {
            return;
        }

        // Use <link rel="prefetch"> for better performance
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = path;
        link.as = 'script';
        document.head.appendChild(link);
    }

    /**
     * Lazy load images with Intersection Observer
     * 
     * @param {string} selector - CSS selector for images
     * @param {Object} options - Intersection Observer options
     */
    lazyLoadImages(selector = '[data-lazy]', options = {}) {
        const defaultOptions = {
            root: null,
            rootMargin: '50px',
            threshold: 0.01
        };

        const observerOptions = { ...defaultOptions, ...options };

        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    this.loadImage(img);
                    observer.unobserve(img);
                }
            });
        }, observerOptions);

        // Observe all lazy images
        document.querySelectorAll(selector).forEach(img => {
            imageObserver.observe(img);
        });

        this.observers.set(selector, imageObserver);
    }

    /**
     * Load individual image
     */
    loadImage(img) {
        const src = img.dataset.src;
        const srcset = img.dataset.srcset;

        if (!src && !srcset) return;

        // Create temporary image to test loading
        const tempImg = new Image();

        tempImg.onload = () => {
            if (srcset) img.srcset = srcset;
            if (src) img.src = src;
            img.classList.add('loaded');
            img.removeAttribute('data-src');
            img.removeAttribute('data-srcset');
        };

        tempImg.onerror = () => {
            console.error('Failed to load image:', src);
            img.classList.add('error');
        };

        tempImg.src = src;
    }

    /**
     * Lazy load CSS
     * 
     * @param {string} href - CSS file path
     * @param {string} id - Unique identifier
     */
    loadCSS(href, id) {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (document.getElementById(id)) {
                resolve();
                return;
            }

            const link = document.createElement('link');
            link.id = id;
            link.rel = 'stylesheet';
            link.href = href;

            link.onload = () => resolve();
            link.onerror = () => reject(new Error(`Failed to load CSS: ${href}`));

            document.head.appendChild(link);
        });
    }

    /**
     * Disconnect all observers
     */
    disconnectAll() {
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
    }

    /**
     * Clear loaded components cache
     */
    clearCache() {
        this.loadedComponents.clear();
        this.loadingComponents.clear();
    }
}

// Export singleton instance
export default new LazyLoader();
