<!DOCTYPE html>
<html lang="en" prefix="og: https://ogp.me/ns#">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    
    <!-- Primary Meta Tags -->
    <title>{{ $title ?? config('seo.meta.title') }}</title>
    <meta name="title" content="{{ $title ?? config('seo.meta.title') }}">
    <meta name="description" content="{{ $description ?? config('seo.meta.description') }}">
    <meta name="keywords" content="{{ config('seo.meta.keywords') }}">
    <meta name="author" content="{{ config('seo.meta.author') }}">
    @php
        $robotsContent = [];
        if (config('seo.robots.index')) $robotsContent[] = 'index';
        else $robotsContent[] = 'noindex';
        if (config('seo.robots.follow')) $robotsContent[] = 'follow';
        else $robotsContent[] = 'nofollow';
        $robotsContent[] = 'max-image-preview:' . config('seo.robots.max_image_preview');
        $robotsContent[] = 'max-snippet:' . config('seo.robots.max_snippet');
        $robotsContent[] = 'max-video-preview:' . config('seo.robots.max_video_preview');
    @endphp
    <meta name="robots" content="{{ implode(', ', $robotsContent) }}">
    <meta name="googlebot" content="{{ config('seo.robots.index') ? 'index' : 'noindex' }}, {{ config('seo.robots.follow') ? 'follow' : 'nofollow' }}">
    <meta name="language" content="English">
    <link rel="canonical" href="{{ url()->current() }}">
    
    <!-- Open Graph / Facebook -->
        <!-- Open Graph / Facebook -->
    <meta property="og:type" content="{{ config('seo.og.type') }}">
    <meta property="og:site_name" content="{{ config('seo.site_name') }}">
    <meta property="og:url" content="{{ url()->current() }}">
    <meta property="og:title" content="{{ $title ?? config('seo.meta.title') }}">
    <meta property="og:description" content="{{ $description ?? config('seo.meta.description') }}">
    <meta property="og:image" content="{{ asset(config('seo.og.image')) }}">
    <meta property="og:image:secure_url" content="{{ secure_asset(config('seo.og.image')) }}">
    <meta property="og:image:width" content="{{ config('seo.og.image_width') }}">
    <meta property="og:image:height" content="{{ config('seo.og.image_height') }}">
    <meta property="og:image:alt" content="{{ config('seo.name') }} - {{ config('seo.job_title') }}">
    <meta property="og:locale" content="{{ config('seo.og.locale') }}">
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="{{ config('seo.twitter.card') }}">
    <meta name="twitter:site" content="{{ config('seo.twitter.site') }}">
    <meta name="twitter:creator" content="{{ config('seo.twitter.creator') }}">
    <meta name="twitter:url" content="{{ url()->current() }}">
    <meta name="twitter:title" content="{{ $title ?? config('seo.meta.title') }}">
    <meta name="twitter:description" content="{{ $description ?? config('seo.meta.description') }}">
    <meta name="twitter:image" content="{{ asset(config('seo.og.image')) }}">
    <meta name="twitter:image:alt" content="{{ config('seo.name') }} Portfolio Screenshot">
    
    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="{{ asset('favicon.ico') }}">
    <link rel="apple-touch-icon" sizes="180x180" href="{{ asset('images/apple-touch-icon.png') }}">
    <link rel="icon" type="image/png" sizes="32x32" href="{{ asset('images/favicon-32x32.png') }}">
    <link rel="icon" type="image/png" sizes="16x16" href="{{ asset('images/favicon-16x16.png') }}">
    <link rel="manifest" href="{{ asset('site.webmanifest') }}">
    <meta name="msapplication-TileColor" content="#000000">
    <meta name="theme-color" content="#000000">
    
    <!-- Preload Critical Assets -->
    <link rel="preload" href="{{ asset(config('seo.profile_image')) }}" as="image">
    <link rel="preload" href="/api/wallpapers/time-based" as="fetch" crossorigin>
    <link rel="preload" href="/api/preferences" as="fetch" crossorigin>
    
    <!-- DNS Prefetch for External Resources -->
    <link rel="dns-prefetch" href="//fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    
    <!-- Structured Data / JSON-LD -->
    @if(config('seo.structured_data.enable_person'))
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "Person",
        "name": "{{ config('seo.name') }}",
        "alternateName": "{{ config('seo.alternate_name') }}",
        "url": "{{ url('/') }}",
        "image": "{{ asset(config('seo.profile_image')) }}",
        "jobTitle": "{{ config('seo.job_title') }}",
        "description": "{{ config('seo.bio') }}",
        "worksFor": {
            "@type": "Organization",
            "name": "Freelance"
        },
        "address": {
            "@type": "PostalAddress",
            "addressLocality": "{{ explode(', ', config('seo.location'))[0] ?? 'Istanbul' }}",
            "addressCountry": "{{ explode(', ', config('seo.location'))[1] ?? 'TR' }}"
        },
        "sameAs": [
            "{{ config('seo.social.github') }}",
            "{{ config('seo.social.linkedin') }}",
            "{{ config('seo.social.twitter') }}"
        ],
        "knowsAbout": @json(config('seo.skills')),
        "alumniOf": {
            "@type": "EducationalOrganization",
            "name": "Software Engineering"
        }
    }
    </script>
    @endif
    
    @if(config('seo.structured_data.enable_website'))
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "{{ config('seo.site_name') }}",
        "url": "{{ url('/') }}",
        "description": "{{ config('seo.meta.description') }}",
        "author": {
            "@type": "Person",
            "name": "{{ config('seo.name') }}"
        },
        "potentialAction": {
            "@type": "SearchAction",
            "target": "{{ url('/') }}?q={search_term_string}",
            "query-input": "required name=search_term_string"
        }
    }
    </script>
    @endif
    
    <!-- Component Styles -->
    <link rel="stylesheet" href="{{ mix('css/app.css') }}">
    <link rel="stylesheet" href="{{ asset('css/vendor/xterm.css') }}">
    
    <!-- font -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" integrity="sha512-..." crossorigin="anonymous" referrerpolicy="no-referrer" />
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
            data-domains="{{ config('seo.site_domain') }}"></script>
    @endif
</body>
</html>