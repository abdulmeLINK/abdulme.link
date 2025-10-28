<?php

namespace App\Http\Controllers;

use App\Services\DataService;
use App\Services\LoadingService;
use App\Services\PreferencesService;
use App\Services\WallpaperService;
use App\Services\LandingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\View;

/**
 * DesktopController - Handles the main desktop view with embedded boot sequence
 * 
 * Manages smart boot logic, wallpaper preloading, and session state
 * for the authentic LinkOS desktop experience.
 */
class DesktopController extends Controller
{
    protected $dataService;
    protected $loadingService;
    protected $preferencesService;
    protected $wallpaperService;
    protected $landingService;

    public function __construct(
        DataService $dataService,
        LoadingService $loadingService,
        PreferencesService $preferencesService,
        WallpaperService $wallpaperService,
        LandingService $landingService
    ) {
        $this->dataService = $dataService;
        $this->loadingService = $loadingService;
        $this->preferencesService = $preferencesService;
        $this->wallpaperService = $wallpaperService;
        $this->landingService = $landingService;
    }

    /**
     * Display the desktop with embedded boot sequence
     */
    public function index(Request $request)
    {
        try {
            // Get smart boot configuration
            $bootConfig = $this->getSmartBootConfiguration($request);
            
            // Get current wallpaper for preloading during boot
            $currentWallpaper = $this->getCurrentWallpaperData($request);
            
            // Get loading messages for boot sequence
            $loadingMessages = $this->loadingService->getLoadingMessages();
            
            // Check if we should show embedded boot
            $shouldShowBoot = $this->shouldShowEmbeddedBoot($request);
            
            // Get profile image URL
            $profileImageUrl = $this->getProfileImageUrl();
            
            // Get stats from landing service
            $landingData = $this->landingService->getLandingData();
            
            // Prepare view data
            $viewData = [
                'title' => 'AbdulmeLink - LinkOS Desktop Portfolio',
                'description' => 'Experience an authentic LinkOS desktop with my portfolio. Built with Laravel and vanilla JavaScript featuring 60fps animations, authentic behaviors, and progressive enhancement.',
                'bootConfig' => $bootConfig,
                'currentWallpaper' => $currentWallpaper,
                'loadingMessages' => $loadingMessages,
                'shouldShowBoot' => $shouldShowBoot,
                'isFirstVisit' => $this->isFirstVisit($request),
                'profileImageUrl' => $profileImageUrl,
                'stats' => $landingData['stats'] ?? []
            ];
            
            // Update session state
            $this->updateSessionState($request);
            
            Log::info('Desktop loaded', [
                'shouldShowBoot' => $shouldShowBoot,
                'isFirstVisit' => $viewData['isFirstVisit'],
                'bootDuration' => $bootConfig['duration'] ?? 'default'
            ]);
            
            return view('desktop', $viewData);
            
        } catch (\Exception $e) {
            Log::error('Failed to load desktop: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            
            // Fallback view with minimal data
            return view('desktop', [
                'title' => 'AbdulmeLink Portfolio',
                'description' => 'LinkOS Portfolio Experience',
                'bootConfig' => $this->getDefaultBootConfig(),
                'currentWallpaper' => null,
                'loadingMessages' => $this->getDefaultLoadingMessages(),
                'shouldShowBoot' => true,
                'isFirstVisit' => true,
                'profileImageUrl' => $this->getProfileImageUrl()
            ]);
        }
    }

    /**
     * Get smart boot configuration based on visit history
     */
    private function getSmartBootConfiguration(Request $request): array
    {
        $isFirstVisit = $this->isFirstVisit($request);
        $preferences = $this->getBootPreferences();
        
        return [
            'embedded' => true,
            'smartDuration' => true,
            'preloadWallpaper' => true,
            'duration' => $isFirstVisit ? 4500 : 1200, // 4.5s first visit, 1.2s return
            'showProgress' => true,
            'showMessages' => true,
            'allowSkip' => true,
            'fadeOutDuration' => 800,
            'redirectUrl' => null, // Stay on same page since boot is embedded
            'skipBoot' => $preferences['skipBoot'] ?? false
        ];
    }

    /**
     * Get current wallpaper data for preloading using smart selection
     */
    private function getCurrentWallpaperData(Request $request = null): ?array
    {
        try {
            // Generate user fingerprint for consistent selection
            $userFingerprint = $this->generateUserFingerprint($request);
            
            // Check if this is a first visit
            $isFirstVisit = $this->isFirstVisit($request ?: request());
            
            // Get current hour for time-based selection
            $currentHour = now()->hour;
            
            Log::info('Smart wallpaper selection for boot', [
                'isFirstVisit' => $isFirstVisit,
                'hour' => $currentHour,
                'fingerprint' => substr($userFingerprint, 0, 8) . '...'
            ]);
            
            // Use smart wallpaper selection
            $wallpaper = $this->wallpaperService->getSmartWallpaper(
                $currentHour,
                $userFingerprint,
                $isFirstVisit
            );
            
            if ($wallpaper) {
                Log::info('Selected wallpaper for boot screen', [
                    'name' => $wallpaper['name'] ?? 'Unknown',
                    'type' => $wallpaper['type'] ?? 'mixed',
                    'method' => $isFirstVisit ? 'random' : 'time-based',
                    'saved_to_session' => true
                ]);
                
                // Ensure it's saved as current wallpaper for the session
                $this->wallpaperService->setCurrentWallpaper($wallpaper);
            }
            
            return $wallpaper;
            
        } catch (\Exception $e) {
            Log::error('Failed to load smart wallpaper for boot preloading: ' . $e->getMessage());
            
            // Fallback to default wallpaper service
            try {
                return $this->wallpaperService->getCurrentWallpaper();
            } catch (\Exception $fallbackError) {
                Log::debug('Fallback wallpaper also failed: ' . $fallbackError->getMessage());
                return null;
            }
        }
    }

    /**
     * Check if embedded boot sequence should be shown
     */
    private function shouldShowEmbeddedBoot(Request $request): bool
    {
        // Check session for recent boot
        $lastBootTime = $request->session()->get('last_boot_time', 0);
        $thirtyMinutesAgo = time() - (30 * 60);
        
        // Show boot if first visit or if last boot was more than 30 minutes ago
        $isFirstVisit = $this->isFirstVisit($request);
        $shouldShowBoot = $isFirstVisit || $lastBootTime < $thirtyMinutesAgo;
        
        // Check user preferences
        $preferences = $this->getBootPreferences();
        if (isset($preferences['alwaysSkip']) && $preferences['alwaysSkip']) {
            return false;
        }
        
        if (isset($preferences['alwaysShow']) && $preferences['alwaysShow']) {
            return true;
        }
        
        return $shouldShowBoot;
    }

    /**
     * Check if this is a first visit
     */
    private function isFirstVisit(Request $request): bool
    {
        return !$request->session()->has('portfolio_visited');
    }

    /**
     * Generate a user fingerprint for consistent wallpaper selection
     */
    private function generateUserFingerprint(Request $request = null): string
    {
        $request = $request ?: request();
        
        $components = [
            $request->userAgent() ?? 'unknown',
            $request->getClientIp() ?? 'unknown',
            $request->header('Accept-Language', 'unknown'),
            $request->header('Accept-Encoding', 'unknown'),
            session()->getId()
        ];
        
        return base64_encode(implode('|', $components));
    }

    /**
     * Update session state after desktop load
     */
    private function updateSessionState(Request $request): void
    {
        // Don't mark as visited here - let WallpaperService handle this after wallpaper selection
        $request->session()->put('last_desktop_load', time());
        
        // Only update boot time if we're showing boot
        if ($this->shouldShowEmbeddedBoot($request)) {
            $request->session()->put('last_boot_time', time());
        }
    }

    /**
     * Get boot preferences from preferences service
     */
    private function getBootPreferences(): array
    {
        try {
            return $this->preferencesService->get('performance.boot', []);
        } catch (\Exception $e) {
            Log::debug('Could not load boot preferences: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Get default boot configuration for fallback
     */
    private function getDefaultBootConfig(): array
    {
        return [
            'embedded' => true,
            'duration' => 3000,
            'showProgress' => true,
            'showMessages' => true,
            'allowSkip' => true,
            'skipBoot' => false
        ];
    }

    /**
     * Get default loading messages for fallback
     */
    private function getDefaultLoadingMessages(): array
    {
        return [
            'boot_sequence' => [
                'initial' => ['Starting LinkOS...', 'Loading system services...'],
                'components' => ['Initializing desktop...', 'Loading preferences...'],
                'finalizing' => ['Welcome to AbdulmeLink Portfolio']
            ]
        ];
    }

    /**
     * Get profile image URL
     */
    private function getProfileImageUrl(): string
    {
        return asset('images/abdulmelik_saylan.jpg');
    }

    /**
     * API endpoint to check boot status
     */
    public function bootStatus(Request $request)
    {
        try {
            return response()->json([
                'success' => true,
                'shouldShowBoot' => $this->shouldShowEmbeddedBoot($request),
                'isFirstVisit' => $this->isFirstVisit($request),
                'bootConfig' => $this->getSmartBootConfiguration($request),
                'currentWallpaper' => $this->getCurrentWallpaperData($request),
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
     * API endpoint to skip boot sequence
     */
    public function skipBoot(Request $request)
    {
        try {
            $request->session()->put('portfolio_visited', true);
            $request->session()->put('last_boot_time', time());
            
            return response()->json([
                'success' => true,
                'message' => 'Boot sequence skipped'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to skip boot sequence'
            ], 500);
        }
    }

    /**
     * API endpoint to reset boot sequence (for testing)
     */
    public function resetBoot(Request $request)
    {
        try {
            $request->session()->forget(['portfolio_visited', 'last_boot_time', 'last_desktop_load']);
            
            return response()->json([
                'success' => true,
                'message' => 'Boot sequence reset - next visit will show full boot'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to reset boot sequence'
            ], 500);
        }
    }

    /**
     * API endpoint to get current wallpaper (moved from routes)
     */
    public function getCurrentWallpaper()
    {
        try {
            $currentWallpaper = $this->wallpaperService->getCurrentWallpaper();
            
            return response()->json([
                'success' => true,
                'wallpaper' => $currentWallpaper
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * API endpoint to get loading sequence (moved from routes)
     */
    public function getLoadingSequence()
    {
        try {
            $sequence = $this->loadingService->getLoadingSequence();
            
            return response()->json([
                'success' => true,
                'data' => $sequence
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get desktop applications data
     */
    public function getDesktopApps()
    {
        try {
            $data = $this->dataService->read('desktop-apps', []);
            
            return response()->json([
                'success' => true,
                'data' => $data
            ])->header('Cache-Control', 'public, max-age=3600');
            
        } catch (\Exception $e) {
            Log::error('Failed to load desktop apps: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'error' => 'Failed to load desktop applications'
            ], 500);
        }
    }

    /**
     * Get loading messages for boot screen
     */
    public function getLoadingMessages()
    {
        try {
            $data = $this->dataService->read('loading-messages', []);
            
            return response()->json([
                'success' => true,
                'data' => $data
            ])->header('Cache-Control', 'public, max-age=3600');
            
        } catch (\Exception $e) {
            Log::error('Failed to load loading messages: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'error' => 'Failed to load loading messages'
            ], 500);
        }
    }

    /**
     * Get filesystem data (for Finder and Terminal)
     */
    public function getFileSystem()
    {
        try {
            $data = $this->dataService->read('filesystem', []);
            
            return response()->json([
                'success' => true,
                'data' => $data,
                '_metadata' => $data['_metadata'] ?? ['source' => 'unknown']
            ])->header('Cache-Control', 'public, max-age=3600');
            
        } catch (\Exception $e) {
            Log::error('Failed to load filesystem: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'error' => 'Failed to load filesystem'
            ], 500);
        }
    }
}