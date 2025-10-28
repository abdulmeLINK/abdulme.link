@extends('layouts.app')

@push('styles')
<!-- Boot Screen CSS for embedded mode -->
<link rel="stylesheet" href="{{ asset('css/boot-screen.css') }}">
<!-- Preferences Component CSS -->
<link rel="stylesheet" href="{{ asset('css/components/preferences.css') }}">
@endpush

@section('content')
<!-- Embedded Boot Screen (conditionally shown) -->
@if($shouldShowBoot)
    <div id="boot-screen-overlay" class="boot-screen-embedded">
        @include('boot', [
            'bootConfig' => $bootConfig,
            'loadingMessages' => $loadingMessages,
            'currentWallpaper' => $currentWallpaper,
            'isFirstVisit' => $isFirstVisit,
            'profileImageUrl' => $profileImageUrl,
            'embedded' => true
        ])
    </div>
@endif

<!-- Desktop Container - This will be controlled by Desktop.js -->
<div id="desktop" class="desktop-container" @if($shouldShowBoot) style="display: none;" @endif>
    <!-- Wallpaper container will be injected by JavaScript -->
    <!-- Desktop icons will be injected by JavaScript -->
    <!-- Context menu will be injected by JavaScript -->
</div>

<!-- Dock Container - Will be added in next phase -->
<div id="dock-container" style="display: none;">
    <!-- Dock component will be loaded in Phase 2 continuation -->
</div>

<!-- Window Manager Container - Will be added in next phase -->
<div id="window-manager" style="display: none;">
    <!-- Window manager will be loaded in Phase 2 continuation -->
</div>

<!-- Development Debug Info (only in debug mode) -->
@if(config('app.debug'))
<div id="debug-panel" style="
    position: fixed;
    bottom: 10px;
    left: 10px;
    background: rgba(0, 0, 0, 0.8);
    color: #00ff00;
    padding: 10px;
    border-radius: 4px;
    font-family: 'SF Mono', Menlo, Monaco, monospace;
    font-size: 11px;
    z-index: 99999;
    display: none;
">
    <div>Debug Mode: Active</div>
    <div id="debug-fps">FPS: --</div>
    <div id="debug-memory">Memory: --</div>
    <div id="debug-events">Events: --</div>
</div>
@endif
@endsection

@push('scripts')
<!-- Boot Screen JavaScript for embedded mode -->
<script src="{{ asset('js/components/BootScreen.js') }}"></script>
<script>
// Desktop-specific initialization with boot configuration
document.addEventListener('DOMContentLoaded', function() {
    // Pass boot configuration to JavaScript
    window.AbdulmeApp = window.AbdulmeApp || {};
    window.AbdulmeApp.config = {
        @if(isset($currentWallpaper))
        currentWallpaper: @json($currentWallpaper),
        @endif
        @if(isset($bootConfig))
        bootConfig: @json($bootConfig),
        @endif
        embedded: true,
        debug: @json(config('app.debug'))
    };
    
    // Set up debug panel if in debug mode
    @if(config('app.debug'))
    const debugPanel = document.getElementById('debug-panel');
    const debugFps = document.getElementById('debug-fps');
    const debugMemory = document.getElementById('debug-memory');
    const debugEvents = document.getElementById('debug-events');
    
    // Show debug panel with Ctrl+Shift+D
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
            debugPanel.style.display = debugPanel.style.display === 'none' ? 'block' : 'none';
        }
    });
    
    // Update debug info periodically
    setInterval(function() {
        if (debugPanel.style.display === 'block') {
            if (window.AbdulmeApp) {
                const status = window.AbdulmeApp.getStatus();
                debugEvents.textContent = `Events: ${Object.keys(status.activeEvents).length}`;
            }
            
            if (performance.memory) {
                const mb = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
                debugMemory.textContent = `Memory: ${mb}MB`;
            }
        }
    }, 1000);
    @endif
    
    // Desktop keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Command+Space - Spotlight (future implementation)
        if (e.metaKey && e.key === ' ') {
            e.preventDefault();
            console.log('Spotlight shortcut (not implemented yet)');
        }
        
        // Command+Tab - App switching (future implementation)
        if (e.metaKey && e.key === 'Tab') {
            e.preventDefault();
            console.log('App switching shortcut (not implemented yet)');
        }
        
        // F11 - Fullscreen toggle
        if (e.key === 'F11') {
            e.preventDefault();
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                document.documentElement.requestFullscreen();
            }
        }
    });
    
    // Desktop performance optimization
    let ticking = false;
    
    // Throttle mouse movements for better performance
    document.addEventListener('mousemove', function(e) {
        if (!ticking) {
            requestAnimationFrame(function() {
                // Update cursor position for potential icon interactions
                document.documentElement.style.setProperty('--cursor-x', e.clientX + 'px');
                document.documentElement.style.setProperty('--cursor-y', e.clientY + 'px');
                ticking = false;
            });
            ticking = true;
        }
    });
    
    // Mark app as ready
    window.AppMetrics.appReady = performance.now();
    console.log(`Desktop view loaded in ${Math.round(window.AppMetrics.appReady - window.AppMetrics.startTime)}ms`);
});

// Global desktop utilities
window.DesktopUtils = {
    /**
     * Check if device supports high performance animations
     */
    supportsHighPerformance: function() {
        return !window.AppConfig.performance.isMobile && 
               navigator.hardwareConcurrency >= 4 &&
               !window.AppConfig.performance.reducedMotion;
    },
    
    /**
     * Get optimal animation duration based on performance
     */
    getAnimationDuration: function(baseDuration) {
        if (window.AppConfig.performance.reducedMotion) return 0;
        if (window.AppConfig.performance.isMobile) return baseDuration * 0.7;
        return baseDuration;
    },
    
    /**
     * Throttle function calls
     */
    throttle: function(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    },
    
    /**
     * Debounce function calls
     */
    debounce: function(func, delay) {
        let debounceTimer;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => func.apply(context, args), delay);
        }
    }
};
</script>
@endpush