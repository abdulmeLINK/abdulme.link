/**
 * Service Worker for AbdulmeLink Portfolio
 * 
 * Provides offline functionality and optimized caching
 * for the LinkOS desktop experience
 */

const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `abdulme-portfolio-${CACHE_VERSION}`;

// Assets to cache immediately on install
const CRITICAL_ASSETS = [
    '/',
    '/css/app.css',
    '/css/boot-screen.css',
    '/js/app.js',
    '/js/components/BootScreen.js',
    '/data/desktop-apps.json',
    '/data/loading-messages.json',
    '/images/profile.jpg'
];

// Cache strategies
const CACHE_STRATEGIES = {
    // Cache first, fallback to network
    CACHE_FIRST: 'cache-first',
    // Network first, fallback to cache
    NETWORK_FIRST: 'network-first',
    // Network only
    NETWORK_ONLY: 'network-only',
    // Cache only
    CACHE_ONLY: 'cache-only'
};

/**
 * Install event - Cache critical assets
 */
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Caching critical assets');
                return cache.addAll(CRITICAL_ASSETS);
            })
            .then(() => self.skipWaiting())
            .catch(error => {
                console.error('[SW] Installation failed:', error);
            })
    );
});

/**
 * Activate event - Clean up old caches
 */
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(cacheName => cacheName !== CACHE_NAME)
                        .map(cacheName => {
                            console.log('[SW] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        })
                );
            })
            .then(() => self.clients.claim())
    );
});

/**
 * Fetch event - Intercept network requests
 */
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Determine caching strategy based on URL
    const strategy = getCacheStrategy(url);
    
    event.respondWith(
        handleRequest(request, strategy)
    );
});

/**
 * Determine cache strategy based on URL
 */
function getCacheStrategy(url) {
    // API calls - network first
    if (url.pathname.startsWith('/api/')) {
        return CACHE_STRATEGIES.NETWORK_FIRST;
    }
    
    // Static assets - cache first
    if (url.pathname.match(/\.(css|js|jpg|jpeg|png|gif|webp|svg|woff|woff2|ttf|eot)$/)) {
        return CACHE_STRATEGIES.CACHE_FIRST;
    }
    
    // HTML pages - network first
    if (url.pathname.endsWith('.html') || url.pathname === '/') {
        return CACHE_STRATEGIES.NETWORK_FIRST;
    }
    
    // Default: cache first
    return CACHE_STRATEGIES.CACHE_FIRST;
}

/**
 * Handle request with specified strategy
 */
async function handleRequest(request, strategy) {
    switch (strategy) {
        case CACHE_STRATEGIES.CACHE_FIRST:
            return cacheFirst(request);
        
        case CACHE_STRATEGIES.NETWORK_FIRST:
            return networkFirst(request);
        
        case CACHE_STRATEGIES.NETWORK_ONLY:
            return fetch(request);
        
        case CACHE_STRATEGIES.CACHE_ONLY:
            return caches.match(request);
        
        default:
            return cacheFirst(request);
    }
}

/**
 * Cache first strategy
 */
async function cacheFirst(request) {
    const cached = await caches.match(request);
    
    if (cached) {
        // Return cached version and update in background
        updateCache(request);
        return cached;
    }
    
    // Not in cache, fetch from network
    return fetchAndCache(request);
}

/**
 * Network first strategy
 */
async function networkFirst(request) {
    try {
        const response = await fetch(request);
        
        // Cache successful responses
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        
        return response;
    } catch (error) {
        // Network failed, try cache
        const cached = await caches.match(request);
        
        if (cached) {
            console.log('[SW] Network failed, serving from cache:', request.url);
            return cached;
        }
        
        // No cache either, return error
        throw error;
    }
}

/**
 * Fetch from network and cache response
 */
async function fetchAndCache(request) {
    try {
        const response = await fetch(request);
        
        // Only cache successful responses
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        
        return response;
    } catch (error) {
        console.error('[SW] Fetch failed:', error);
        throw error;
    }
}

/**
 * Update cache in background
 */
async function updateCache(request) {
    try {
        const response = await fetch(request);
        
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response);
        }
    } catch (error) {
        // Silently fail, user already has cached version
    }
}

/**
 * Message event - Handle commands from main thread
 */
self.addEventListener('message', (event) => {
    const { type, data } = event.data;
    
    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
        
        case 'CLEAR_CACHE':
            caches.delete(CACHE_NAME)
                .then(() => {
                    event.ports[0].postMessage({ success: true });
                });
            break;
        
        case 'CACHE_URLS':
            caches.open(CACHE_NAME)
                .then(cache => cache.addAll(data.urls))
                .then(() => {
                    event.ports[0].postMessage({ success: true });
                });
            break;
    }
});
