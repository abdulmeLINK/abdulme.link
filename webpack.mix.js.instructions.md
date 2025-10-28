# Build & Asset Instructions

---
applyTo: "webpack.mix.js"
---

## Laravel Mix Configuration

### Required Build Setup
```javascript
const mix = require('laravel-mix');

// JavaScript compilation with code splitting
mix.js('resources/js/app.js', 'public/js')
   .js('resources/js/components/macos/index.js', 'public/js/macos.js')
   .js('resources/js/components/terminal/index.js', 'public/js/terminal.js');

// CSS compilation with PostCSS
mix.postCss('resources/css/app.css', 'public/css', [
    require('postcss-import'),
    require('postcss-nested'),
    require('autoprefixer')
]);

// Asset optimization
if (mix.inProduction()) {
    mix.version()
       .sourceMaps()
       .options({
           terser: {
               terserOptions: {
                   compress: {
                       drop_console: true
                   }
               }
           }
       });
}
```

### Asset Management Rules
- Compress all images to WebP with JPEG fallback
- Generate thumbnails for wallpapers (200x125px)
- Lazy load non-critical assets
- Bundle split by feature (macos, terminal, portfolio)
- Cache bust with versioning in production

### Performance Targets
- Initial bundle <200KB gzipped
- Individual components <50KB each
- Images optimized to <500KB each
- Total initial load <3 seconds
- 60fps animations on 8GB RAM devices

### Development Workflow
- Hot module replacement for development
- Source maps for debugging
- CSS/JS minification in production
- Automatic vendor prefixing
- Cross-browser compatibility testing