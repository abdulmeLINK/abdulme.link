# Webpack Build Optimization Instructions

## Overview
This file documents the Phase 7 build optimizations implemented for the AbdulmeLink Portfolio project.

## Code Splitting Configuration

### Automatic Vendor Splitting
```javascript
vendor: {
    test: /[\\/]node_modules[\\/]/,
    name: 'vendor',
    priority: 10
}
```
All third-party libraries (node_modules) are split into a separate `vendor.js` bundle.

### Feature-Based Splitting
Application code is split into feature bundles:
- **macos.js** - Desktop, Dock, Window components
- **terminal.js** - Terminal application and commands
- **portfolio.js** - Portfolio grid and project display
- **preferences.js** - System preferences application

### Common Code Extraction
```javascript
common: {
    minChunks: 2,
    name: 'common',
    priority: 5,
    reuseExistingChunk: true
}
```
Code used in 2+ modules is extracted to `common.js`.

## CSS Optimization

### PostCSS Pipeline
1. **postcss-import** - Inline @import statements
2. **postcss-nested** - Unwrap nested selectors
3. **autoprefixer** - Add vendor prefixes
4. **cssnano** - Minify CSS (production only)

### Component CSS Splitting
Each major component has its own CSS file loaded on-demand:
- `preferences.css` - Loaded only when Preferences app opens
- `terminal.css` - Loaded with Terminal application
- `portfolio.css` - Loaded with Portfolio application

## JavaScript Optimization

### Production Build
```javascript
terser: {
    compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
        passes: 2
    },
    mangle: { safari10: true }
}
```

### Babel Transpilation
ES6+ code is transpiled for older browsers while maintaining modern syntax for capable browsers.

## Image Optimization

### Supported Formats
- **JPEG** - Progressive encoding, 85% quality
- **PNG** - Quantization with pngquant (80-90% quality)
- **WebP** - Automatic generation for supported browsers

### Lazy Loading
Images use Intersection Observer API:
```html
<img data-src="image.jpg" alt="Description" />
```

## Service Worker Caching

### Cache Strategies

#### Cache First (Static Assets)
1. Check cache
2. Return if found
3. Fetch from network if not
4. Update cache in background

#### Network First (API Calls)
1. Try network first
2. Cache successful responses
3. Fallback to cache if network fails

### Critical Assets
Cached on service worker installation:
- Core CSS and JS files
- Boot screen assets
- Desktop app data
- Profile images

## Performance Monitoring

### Metrics Tracked
- **FPS (Frames Per Second)** - Target: 60fps desktop, 30fps mobile
- **Memory Usage** - JavaScript heap size
- **Load Times** - TTFB, DOM Interactive, Full Load
- **User Interactions** - Click, keydown, scroll timing

### Usage
```javascript
import PerformanceMonitor from '@/utils/PerformanceMonitor';

// Start monitoring
PerformanceMonitor.start();

// Get report
const report = PerformanceMonitor.getReport();
console.log(report);

// Get optimization suggestions
const suggestions = PerformanceMonitor.getOptimizationSuggestions();
```

## Lazy Loading

### Component Lazy Loading
```javascript
import LazyLoader from '@/utils/LazyLoader';

// Load component on demand
const Terminal = await LazyLoader.loadComponent(
    'Terminal',
    '@terminal/Terminal.js'
);

// Preload for faster access
LazyLoader.preload('Preferences', '@preferences/Preferences.js');
```

### Image Lazy Loading
```javascript
// Auto-detect and lazy load images
LazyLoader.lazyLoadImages('[data-lazy]', {
    rootMargin: '50px',
    threshold: 0.01
});
```

### CSS Lazy Loading
```javascript
// Load CSS on demand
await LazyLoader.loadCSS('/css/components/preferences.css', 'preferences-css');
```

## Build Commands

### Development
```bash
npm run dev      # Single build
npm run watch    # Watch mode with auto-rebuild
```

### Production
```bash
npm run prod     # Optimized production build
npm run build    # Alias for prod
```

### Analysis
```bash
ANALYZE=true npm run prod  # Generate bundle size report
```

## Performance Targets

### Initial Load (First Visit)
- **Total Size**: <500KB (gzipped)
- **Time to Interactive**: <3 seconds
- **First Contentful Paint**: <1.5 seconds

### Subsequent Loads (Cached)
- **Total Size**: <200KB (differential)
- **Time to Interactive**: <1 second
- **First Contentful Paint**: <0.5 seconds

### Runtime Performance
- **Desktop FPS**: 60fps minimum
- **Mobile FPS**: 30fps minimum
- **Memory Usage**: <100MB
- **Interaction Response**: <100ms

## Cache Management

### Manual Cache Control
```javascript
// Clear all caches
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.controller.postMessage({
        type: 'CLEAR_CACHE'
    });
}

// Cache specific URLs
navigator.serviceWorker.controller.postMessage({
    type: 'CACHE_URLS',
    data: { urls: ['/api/portfolio', '/api/about'] }
});
```

### Cache Versioning
Service worker cache version is managed via `CACHE_VERSION` constant.
On version change, old caches are automatically deleted.

## Best Practices

1. **Code Splitting**: Keep bundles <200KB each
2. **Lazy Loading**: Load components only when needed
3. **Image Optimization**: Use WebP with JPEG fallback
4. **Critical CSS**: Inline critical styles in HTML
5. **Service Worker**: Cache strategically based on content type
6. **Performance Monitoring**: Track and optimize bottlenecks
7. **Bundle Analysis**: Regularly check bundle sizes

## Troubleshooting

### Large Bundle Sizes
1. Run `ANALYZE=true npm run prod`
2. Identify large dependencies
3. Consider code splitting or lazy loading
4. Use lighter alternatives if available

### Slow Load Times
1. Check Performance Monitor metrics
2. Optimize images (compress, use WebP)
3. Enable lazy loading for non-critical assets
4. Review network waterfall in DevTools

### Low FPS
1. Reduce animation complexity
2. Use CSS transforms instead of position changes
3. Enable hardware acceleration with `will-change`
4. Debounce scroll/resize handlers

## Future Enhancements

- [ ] HTTP/2 Server Push for critical assets
- [ ] Progressive Web App (PWA) full support
- [ ] WebP with AVIF format support
- [ ] Brotli compression in addition to gzip
- [ ] Advanced caching with Workbox
- [ ] Resource hints (preload, prefetch, preconnect)
