<?php

namespace App\Http\Controllers;

use App\Services\DataService;
use App\Services\LoadingService;
use App\Services\PreferencesService;
use App\Services\WallpaperService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\View;

/**
 * BootController - Handles the LinkOS-style boot screen
 * 
 * Provides boot configuration, loading messages, and session management
 * for the authentic LinkOS boot experience.
 */
class BootController extends Controller
{
    protected $dataService;
    protected $loadingService;
    protected $preferencesService;
    protected $wallpaperService;

    public function __construct(
        DataService $dataService,
        LoadingService $loadingService,
        PreferencesService $preferencesService,
        WallpaperService $wallpaperService
    ) {
        $this->dataService = $dataService;
        $this->loadingService = $loadingService;
        $this->preferencesService = $preferencesService;
        $this->wallpaperService = $wallpaperService;
    }

    /**
     * Display the boot screen
     */
    public function show(Request $request)
    {
        try {
            // Get user preferences for boot behavior
            $preferences = $this->preferencesService->getBootPreferences();
            
            // Determine if this is a first visit
            $isFirstVisit = !$request->session()->has('portfolio_visited');
            
            // Get boot configuration
            $bootConfig = $this->getBootConfiguration($preferences, $isFirstVisit);
            
            // Get loading messages
            $loadingMessages = $this->loadingService->getLoadingMessages();
            
            // Get current wallpaper for background
            $currentWallpaper = $this->wallpaperService->getCurrentWallpaper();
            
            // Pass configuration to view
            return view('boot', [
                'bootConfig' => $bootConfig,
                'loadingMessages' => $loadingMessages,
                'currentWallpaper' => $currentWallpaper,
                'isFirstVisit' => $isFirstVisit
            ]);
            
        } catch (\Exception $e) {
            // Fallback to desktop if boot screen fails
            return redirect('/desktop')->with('error', 'Boot screen unavailable');
        }
    }

    /**
     * API endpoint for boot status
     */
    public function status(Request $request)
    {
        try {
            $preferences = $this->preferencesService->getBootPreferences();
            $isFirstVisit = !$request->session()->has('portfolio_visited');
            
            return response()->json([
                'success' => true,
                'config' => $this->getBootConfiguration($preferences, $isFirstVisit),
                'messages' => $this->loadingService->getLoadingMessages(),
                'isFirstVisit' => $isFirstVisit,
                'timestamp' => now()->toISOString()
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to get boot status',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark session as visited (for skip boot functionality)
     */
    public function markVisited(Request $request)
    {
        try {
            $request->session()->put('portfolio_visited', true);
            
            return response()->json([
                'success' => true,
                'message' => 'Session marked as visited'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to mark session',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reset boot sequence (for testing/debugging)
     */
    public function reset(Request $request)
    {
        try {
            $request->session()->forget('portfolio_visited');
            
            return response()->json([
                'success' => true,
                'message' => 'Boot sequence reset'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to reset boot sequence',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get boot configuration based on preferences and visit status
     */
    private function getBootConfiguration(array $preferences, bool $isFirstVisit): array
    {
        $baseConfig = [
            'title' => config('app.name') . ' Portfolio',
            'version' => '1.0.0',
            'redirectUrl' => '/desktop',
            'enableKeyboardShortcuts' => true,
            'allowSkip' => false
        ];

        // First visit gets full boot experience
        if ($isFirstVisit) {
            return array_merge($baseConfig, [
                'duration' => $preferences['boot_duration'] ?? 4000,
                'skipBoot' => false,
                'showProgress' => true,
                'showMessages' => true,
                'initialMessage' => 'Welcome to LinkOS Portfolio',
                'theme' => 'dark',
                'enableAnimations' => $preferences['enable_animations'] ?? true
            ]);
        }

        // Return visitors get configured experience
        return array_merge($baseConfig, [
            'duration' => $preferences['return_boot_duration'] ?? 2000,
            'skipBoot' => $preferences['skip_boot_on_return'] ?? false,
            'showProgress' => !$preferences['quick_boot'] ?? true,
            'showMessages' => !$preferences['quick_boot'] ?? true,
            'initialMessage' => 'Resuming session...',
            'theme' => $preferences['boot_theme'] ?? 'dark',
            'enableAnimations' => $preferences['enable_animations'] ?? true,
            'allowSkip' => $preferences['allow_boot_skip'] ?? true
        ]);
    }

    /**
     * Get system status for boot screen (simulated)
     */
    public function getSystemStatus()
    {
        try {
            // Simulate system loading status
            $status = [
                'wallpapers_loaded' => $this->dataService->countWallpapers(),
                'components_ready' => 8, // Total desktop components
                'preferences_loaded' => count($this->preferencesService->getAllPreferences()),
                'cache_size' => $this->calculateCacheSize(),
                'memory_usage' => $this->getMemoryUsage(),
                'uptime' => $this->getSystemUptime()
            ];

            return response()->json([
                'success' => true,
                'status' => $status,
                'timestamp' => now()->toISOString()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to get system status',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Calculate cache size (simulated)
     */
    private function calculateCacheSize(): string
    {
        // Simulate cache calculation
        $sizeInBytes = rand(10000000, 50000000); // 10MB - 50MB
        return $this->formatBytes($sizeInBytes);
    }

    /**
     * Get memory usage (simulated)
     */
    private function getMemoryUsage(): string
    {
        return $this->formatBytes(memory_get_usage(true));
    }

    /**
     * Get system uptime (simulated)
     */
    private function getSystemUptime(): string
    {
        // Simulate uptime since session start
        $sessionStart = session('session_start', now());
        $uptime = now()->diffInSeconds($sessionStart);
        
        return $this->formatUptime($uptime);
    }

    /**
     * Format bytes to human readable format
     */
    private function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $factor = floor((strlen($bytes) - 1) / 3);
        
        return sprintf("%.1f %s", $bytes / pow(1024, $factor), $units[$factor]);
    }

    /**
     * Format uptime to human readable format
     */
    private function formatUptime(int $seconds): string
    {
        $hours = floor($seconds / 3600);
        $minutes = floor(($seconds % 3600) / 60);
        $seconds = $seconds % 60;
        
        if ($hours > 0) {
            return sprintf("%d:%02d:%02d", $hours, $minutes, $seconds);
        } else {
            return sprintf("%d:%02d", $minutes, $seconds);
        }
    }

    /**
     * Legacy boot test route (moved from routes)
     */
    public function test()
    {
        return view('boot', [
            'bootConfig' => [
                'title' => 'AbdulmeLink Portfolio',
                'duration' => 3000,
                'skipBoot' => false,
                'redirectUrl' => '/desktop',
                'initialMessage' => 'Starting LinkOS...'
            ],
            'loadingMessages' => [
                'boot_sequence' => [
                    'initial' => ['Starting LinkOS...', 'Initializing system...'],
                    'components' => ['Loading system services...', 'Starting WindowServer...'],
                    'wallpapers' => ['Loading wallpaper engine...'],
                    'finalizing' => ['System ready', 'Welcome to LinkOS']
                ],
                'return_visitor' => [
                    'quick_boot' => ['Resuming session...', 'Ready!'],
                    'skip_messages' => ['Loading...', 'Ready']
                ]
            ],
            'isFirstVisit' => true
        ]);
    }
}