<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <!-- Component Styles -->
    <link rel="stylesheet" href="{{ mix('css/app.css') }}">
    <link rel="stylesheet" href="{{ asset('css/vendor/xterm.css') }}">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    
    <!-- Primary Meta Tags -->
    <title>{{ $title ?? 'AbdulmeLink - Full-Stack Developer Portfolio' }}</title>
    <meta name="description" content="{{ $description ?? 'Experience an authentic LinkOS desktop with my portfolio. Built with Laravel and vanilla JavaScript - 60fps performance guaranteed.' }}">
    <meta name="author" content="Abdulmelik Saylan">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="{{ url()->current() }}">
    <meta property="og:title" content="{{ $title ?? 'AbdulmeLink - Full-Stack Developer Portfolio' }}">
    <meta property="og:description" content="{{ $description ?? 'Experience an authentic LinkOS desktop with my portfolio. Built with Laravel and vanilla JavaScript - 60fps performance guaranteed.' }}">
    <meta property="og:image" content="{{ asset('images/og-image.jpg') }}">
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="{{ url()->current() }}">
    <meta property="twitter:title" content="{{ $title ?? 'AbdulmeLink - Full-Stack Developer Portfolio' }}">
    <meta property="twitter:description" content="{{ $description ?? 'Experience an authentic LinkOS desktop with my portfolio.' }}">
    <meta property="twitter:image" content="{{ asset('images/og-image.jpg') }}">
    
    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="{{ asset('favicon.ico') }}">
    <link rel="apple-touch-icon" sizes="180x180" href="{{ asset('images/apple-touch-icon.png') }}">
    <link rel="icon" type="image/png" sizes="32x32" href="{{ asset('images/favicon-32x32.png') }}">
    <link rel="icon" type="image/png" sizes="16x16" href="{{ asset('images/favicon-16x16.png') }}">
    
    <!-- Preload Critical Assets -->
    <link rel="preload" href="{{ asset('images/abdulmelik_saylan.jpg') }}" as="image">
    <link rel="preload" href="/api/wallpapers/time-based" as="fetch" crossorigin>
    <link rel="preload" href="/api/preferences" as="fetch" crossorigin>
    
    <!-- DNS Prefetch for External Resources -->
    <link rel="dns-prefetch" href="//fonts.googleapis.com">
    
    <!-- Critical CSS - Inline for Performance -->
    <style>
        /* Critical CSS for initial paint */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        html, body {
            width: 100%;
            height: 100%;
            overflow: hidden;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        
        body {
            background: #000;
            color: #fff;
            cursor: default;
        }
        
        /* Loading state */
        .app-loading {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: #000;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 99999;
        }
        
        .loading-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid rgba(255, 255, 255, 0.1);
            border-top: 3px solid #007AFF;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        /* Hide loading when app starts */
        .app-loading.hidden {
            display: none;
        }
    </style>
    
    <!-- Component Styles -->
    <link rel="stylesheet" href="{{ mix('css/app.css') }}">
    @stack('styles')
    
    <!-- Performance Hints -->
    <meta name="theme-color" content="#000000">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
</head>
<body>
    <!-- App Loading State -->
    <div id="app-loading" class="app-loading">
        <div class="loading-spinner"></div>
    </div>
    
    <!-- Main Content -->
    <div id="app">
        @yield('content')
    </div>
    
    <!-- JavaScript Configuration -->
    <script>
        window.AppConfig = {
            apiUrl: '{{ config('app.url') }}/api',
            assetsUrl: '{{ asset('') }}',
            debug: {{ config('app.debug') ? 'true' : 'false' }},
            environment: '{{ config('app.env') }}',
            csrf: '{{ csrf_token() }}',
            user: @json(auth()->user() ?? null),
            preferences: @json(session('preferences', [])),
            performance: {
                enableAnimations: true,
                enableEffects: true,
                targetFPS: {{ preg_match('/Mobi|Android/i', request()->header('User-Agent', '')) ? 30 : 60 }},
                isMobile: {{ preg_match('/Mobi|Android/i', request()->header('User-Agent', '')) ? 'true' : 'false' }},
                reducedMotion: false
            }
        };
        
        // Performance measurement
        window.AppMetrics = {
            startTime: performance.now(),
            domReady: 0,
            appReady: 0
        };
        
        // DOM Ready
        document.addEventListener('DOMContentLoaded', function() {
            window.AppMetrics.domReady = performance.now();
            
            // Hide loading spinner
            const loading = document.getElementById('app-loading');
            if (loading) {
                loading.classList.add('hidden');
            }
        });
        
        // Detect reduced motion preference
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            window.AppConfig.performance.enableAnimations = false;
            window.AppConfig.performance.enableEffects = false;
            window.AppConfig.performance.reducedMotion = true;
        }
        
        // Error tracking for development
        if (window.AppConfig.debug) {
            window.addEventListener('error', function(e) {
                console.group('JavaScript Error');
                console.error('Message:', e.message);
                console.error('File:', e.filename);
                console.error('Line:', e.lineno + ':' + e.colno);
                console.error('Stack:', e.error ? e.error.stack : 'Not available');
                console.groupEnd();
            });
        }
    </script>
    
    <!-- Application JavaScript -->
    {{-- Temporarily loading single bundle without code splitting --}}
    <script src="{{ mix('js/app.js') }}"></script>
    <script>
        console.log('⚡ app.js loaded');
        console.log('⚡ Window.AbdulmeApp:', typeof window.AbdulmeApp);
        console.log('⚡ Window.EventBus:', typeof window.EventBus);
    </script>
    @stack('scripts')
    
    <!-- Umami Analytics -->
    @if(env('UMAMI_WEBSITE_ID'))
    <script async src="{{ env('UMAMI_SCRIPT_URL', 'https://cloud.umami.is/script.js') }}" 
            data-website-id="{{ env('UMAMI_WEBSITE_ID') }}"
            data-domains="abdulme.link"></script>
    @endif
</body>
</html>