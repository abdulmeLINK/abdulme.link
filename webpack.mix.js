const mix = require('laravel-mix');
const path = require('path');

/*
 |--------------------------------------------------------------------------
 | Mix Asset Management - AbdulmeLink Portfolio
 |--------------------------------------------------------------------------
 |
 | Mix provides a clean, fluent API for defining Webpack build steps
 | for your Laravel application. Optimized for LinkOS desktop portfolio.
 |
 | Phase 7 Enhancements:
 | - Code splitting by feature
 | - Image optimization
 | - Bundle analysis and size optimization
 | - Critical CSS extraction
 | - Service Worker for offline functionality
 */

// Webpack configuration with optimization
mix.webpackConfig({
    resolve: {
        alias: {
            // Component aliases for clean imports
            '@': path.resolve(__dirname, 'resources/js'),
            '@components': path.resolve(__dirname, 'resources/js/components'),
            '@LinkOS': path.resolve(__dirname, 'resources/js/components/LinkOS'),
            '@terminal': path.resolve(__dirname, 'resources/js/components/terminal'),
            '@portfolio': path.resolve(__dirname, 'resources/js/components/portfolio'),
            '@preferences': path.resolve(__dirname, 'resources/js/components/preferences'),
            // XTerm.js aliases
            'xterm': path.resolve(__dirname, 'node_modules/xterm/lib/xterm.js'),
            'xterm-addon-fit': path.resolve(__dirname, 'node_modules/xterm-addon-fit/lib/xterm-addon-fit.js'),
            'xterm-addon-web-links': path.resolve(__dirname, 'node_modules/xterm-addon-web-links/lib/xterm-addon-web-links.js'),
        },
        extensions: ['.js', '.json']
    },
    module: {
        rules: [
            // ES6+ transpilation for older browsers
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'],
                        plugins: ['@babel/plugin-transform-runtime']
                    }
                }
            }
        ]
    },
    optimization: {
        // TEMPORARILY DISABLED - Code splitting causing runtime issues
        // Code splitting configuration
        /*
        splitChunks: {
            chunks: 'all',
            cacheGroups: {
                // Vendor code (node_modules)
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendor',
                    priority: 10
                },
                // LinkOS core components
                LinkOS: {
                    test: /[\\/]resources[\\/]js[\\/]components[\\/]LinkOS[\\/]/,
                    name: 'LinkOS',
                    priority: 20
                },
                // Terminal application
                terminal: {
                    test: /[\\/]resources[\\/]js[\\/]components[\\/]terminal[\\/]/,
                    name: 'terminal',
                    priority: 20
                },
                // Portfolio application
                portfolio: {
                    test: /[\\/]resources[\\/]js[\\/]components[\\/]portfolio[\\/]/,
                    name: 'portfolio',
                    priority: 20
                },
                // Preferences application
                preferences: {
                    test: /[\\/]resources[\\/]js[\\/]components[\\/]preferences[\\/]/,
                    name: 'preferences',
                    priority: 20
                },
                // Common shared code
                common: {
                    minChunks: 2,
                    name: 'common',
                    priority: 5,
                    reuseExistingChunk: true
                }
            }
        },
        // Runtime chunk for better caching
        runtimeChunk: 'single',
        */
        // Module IDs for deterministic builds
        moduleIds: 'deterministic'
    },
    performance: {
        // Performance hints for large bundles
        hints: mix.inProduction() ? 'warning' : false,
        maxEntrypointSize: 512000,
        maxAssetSize: 512000
    }
});

// Main application JavaScript - Entry point
mix.js('resources/js/app.js', 'public/js');

// Only extract in production to avoid complexity in development
if (mix.inProduction()) {
    mix.extract(); // Automatically extracts vendor code
}

// Boot screen component (standalone, critical path)
mix.js('resources/js/components/BootScreen.js', 'public/js/components');

// Landing page component (standalone, SEO entry point)
mix.js('resources/js/components/LandingPage.js', 'public/js');

// Main application CSS with PostCSS processing
mix.postCss('resources/css/app.css', 'public/css', [
    require('postcss-import'),
    require('postcss-nested'),
    require('autoprefixer'),
    require('cssnano')({
        preset: ['default', {
            discardComments: { removeAll: true },
            normalizeWhitespace: mix.inProduction()
        }]
    })
]);

// Component-specific CSS (lazy loaded)
mix.postCss('resources/css/components/preferences.css', 'public/css/components', [
    require('autoprefixer'),
    require('cssnano')({
        preset: ['default', {
            discardComments: { removeAll: true }
        }]
    })
]);

// Boot screen CSS (standalone, critical)
mix.postCss('resources/css/boot-screen.css', 'public/css', [
    require('autoprefixer'),
    require('cssnano')({ preset: 'default' })
]);

// Landing page CSS (standalone, SEO entry point)
mix.postCss('resources/css/components/landing.css', 'public/css', [
    require('autoprefixer'),
    require('cssnano')({ preset: 'default' })
]);

// Copy XTerm.js assets for direct loading (fallback)
mix.copy('node_modules/xterm/lib/xterm.js', 'public/js/vendor')
   .copy('node_modules/xterm/css/xterm.css', 'public/css/vendor')
   .copy('node_modules/xterm-addon-fit/lib/xterm-addon-fit.js', 'public/js/vendor')
   .copy('node_modules/xterm-addon-web-links/lib/xterm-addon-web-links.js', 'public/js/vendor');

// Copy data files to public directory
mix.copy('storage/data/desktop-apps.json', 'public/data/desktop-apps.json')
   .copy('storage/data/loading-messages.json', 'public/data/loading-messages.json')
   .copy('storage/data/preferences-defaults.json', 'public/data/preferences-defaults.json');

// Production optimizations
if (mix.inProduction()) {
    mix.version(); // Cache busting with versioning
    
    mix.options({
        // Terser optimization for JavaScript
        terser: {
            terserOptions: {
                compress: {
                    drop_console: true,
                    drop_debugger: true,
                    pure_funcs: ['console.log', 'console.info'],
                    passes: 2
                },
                mangle: {
                    safari10: true
                },
                format: {
                    comments: false
                }
            },
            extractComments: false
        },
        // PostCSS optimization
        processCssUrls: true,
        // Image optimization
        imgLoaderOptions: {
            enabled: true,
            gifsicle: { interlaced: false },
            mozjpeg: { progressive: true, quality: 85 },
            optipng: { enabled: false },
            pngquant: { quality: [0.8, 0.9], speed: 4 }
        }
    });
} else {
    // Development: Enable source maps
    mix.sourceMaps();
}

// Disable Mix notifications
mix.disableNotifications();

// Webpack Bundle Analyzer (optional, comment out for regular builds)
// if (process.env.ANALYZE) {
//     mix.webpackConfig({
//         plugins: [
//             new (require('webpack-bundle-analyzer').BundleAnalyzerPlugin)()
//         ]
//     });
// }
