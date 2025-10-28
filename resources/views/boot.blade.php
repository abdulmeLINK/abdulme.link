@if(!isset($embedded) || !$embedded)
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>LinkOS</title>
    
    <!-- Boot Screen CSS -->
    <link rel="stylesheet" href="{{ asset('css/boot-screen.css') }}">
</head>
<body class="boot-screen-standalone">
@endif

<!-- Boot Screen Container -->
<div class="boot-screen-container">
    <!-- Moving lights background (fades to wallpaper) -->
    <div class="moving-lights-background" id="movingLightsBackground">
        <div class="light-orb orb-1"></div>
        <div class="light-orb orb-2"></div>
        <div class="light-orb orb-3"></div>
        <div class="light-orb orb-4"></div>
        <div class="light-orb orb-5"></div>
    </div>
    
    <!-- Blurred wallpaper background (hidden initially) -->
    <div class="wallpaper-background" id="wallpaperBackground" style="opacity: 0;"></div>
    
    <div class="boot-screen" id="bootScreen">
        <div class="boot-content-container">
            <!-- Profile photo section -->
            <div class="profile-section">
                <div class="profile-image-container">
                    <img src="{{ $profileImageUrl ?? asset('images/abdulmelik_saylan.jpg') }}" 
                         alt="Profile" 
                         class="profile-image" 
                         id="profileImage" 
                         onerror="this.onerror=null; this.src='{{ asset('images/profile.jpg') }}';">
                    <div class="profile-glow"></div>
                </div>
            </div>
            
            <!-- Stats section (shows during boot) -->
            <div class="boot-stats-section" id="bootStats">
                <div class="stat-card-mini">
                    <div class="stat-value-mini">{{ $stats['years_experience'] ?? '6' }}+</div>
                    <div class="stat-label-mini">Years Exp</div>
                </div>
                <div class="stat-card-mini">
                    <div class="stat-value-mini">{{ $stats['projects_completed'] ?? '8' }}+</div>
                    <div class="stat-label-mini">Projects</div>
                </div>
                <div class="stat-card-mini">
                    <div class="stat-value-mini">{{ $stats['technologies'] ?? '20' }}+</div>
                    <div class="stat-label-mini">Tech Stack</div>
                </div>
            </div>
            
            <!-- Boot progress section -->
            <div class="boot-progress-section" id="bootProgressSection">
                <div class="boot-progress-bar" id="bootProgressBar">
                    <div class="boot-progress-fill" id="progressFill"></div>
                </div>
                
                <div class="boot-message" id="bootMessage">LinkOS</div>
            </div>
            
            <!-- Enter Desktop Button (hidden initially, shows after boot) -->
            <div class="boot-complete-section" id="bootCompleteSection" style="display: none;">
                <button class="enter-desktop-btn" id="enterDesktopBtn">
                    <span class="btn-text">Enter Desktop</span>
                    <span class="btn-icon">→</span>
                </button>
                <p class="boot-complete-hint">Press Enter or click to continue</p>
            </div>
        </div>
    </div>
</div>

@if(!isset($embedded) || !$embedded)
<!-- Boot Screen JavaScript for standalone mode -->
<script src="{{ asset('js/components/BootScreen.js') }}"></script>
<script>
    // Configuration for standalone mode
    window.BootScreenConfig = {
        embedded: false,
        isFirstVisit: {{ json_encode($isFirstVisit ?? true) }},
        bootConfig: @json($bootConfig ?? []),
        loadingMessages: @json($loadingMessages ?? []),
        currentWallpaper: @json($currentWallpaper ?? null),
        container: document.querySelector('.boot-screen-container')
    };
</script>
</body>
</html>
@else
<!-- Embedded mode - JavaScript will be loaded by parent page -->
<script>
    // Configuration for embedded mode
    console.log('🔍 Boot screen embedded mode initializing...');
    console.log('🔍 LinkOSBootScreen available:', typeof LinkOSBootScreen);
    console.log('🔍 DOM readyState:', document.readyState);
    
    document.addEventListener('DOMContentLoaded', function() {
        console.log('🔍 DOMContentLoaded fired');
        console.log('🔍 LinkOSBootScreen available NOW:', typeof LinkOSBootScreen);
        console.log('🔍 window.AbdulmeApp:', typeof window.AbdulmeApp);
        
        if (typeof LinkOSBootScreen !== 'undefined') {
            console.log('✅ Starting LinkOSBootScreen');
            new LinkOSBootScreen({
                embedded: true,
                isFirstVisit: {{ json_encode($isFirstVisit ?? true) }},
                bootConfig: @json($bootConfig ?? []),
                loadingMessages: @json($loadingMessages ?? []),
                currentWallpaper: @json($currentWallpaper ?? null),
                container: document.querySelector('.boot-screen-container')
            });
        } else {
            console.error('❌ LinkOSBootScreen class not loaded');
            console.error('Available on window:', Object.keys(window).filter(k => k.includes('Boot') || k.includes('App')));
        }
    });
</script>
@endif