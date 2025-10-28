<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * WallpaperService - Asset management and wallpaper operations
 * Handles wallpaper loading, thumbnails, and time-based switching
 * Integrates with Supabase Storage for primary delivery and local fallback
 */
class WallpaperService
{
    private DataService $dataService;
    private ?SupabaseStorageService $storageService;
    private const WALLPAPER_PATH = 'images/wallpapers';
    private const MANIFEST_FILE = 'wallpapers-manifest';
    
    public function __construct(DataService $dataService, SupabaseStorageService $storageService = null)
    {
        $this->dataService = $dataService;
        $this->storageService = $storageService ?? app(SupabaseStorageService::class);
    }
    
    /**
     * Get all available wallpapers with metadata
     * Uses Supabase Storage with local fallback
     * 
     * @return array Wallpaper collection with thumbnails and metadata
     */
    public function getAllWallpapers(): array
    {
        try {
            // Use Supabase Storage Service if available
            if ($this->storageService && $this->storageService->isAvailable()) {
                $wallpapersData = $this->storageService->getWallpapers();
                
                if (!empty($wallpapersData['wallpapers'])) {
                    return $wallpapersData;
                }
                
                Log::info('Supabase Storage returned empty, falling back to local');
            }
            
            // Fallback to local manifest
            $manifest = $this->getManifest();
            $wallpapers = [];
            
            foreach ($manifest['wallpapers'] as $wallpaper) {
                $wallpapers[] = [
                    'id' => $wallpaper['id'],
                    'name' => $wallpaper['name'],
                    'category' => $wallpaper['category'], // System, Classic, Art
                    'type' => $wallpaper['type'] ?? 'mixed', // light, dark, mixed
                    'version' => $wallpaper['version'] ?? 'Unknown',
                    'thumbnail' => $this->getThumbnailUrl($wallpaper['id']),
                    'fullImage' => $this->getFullImageUrl($wallpaper['id']),
                    'colors' => $wallpaper['colors'] ?? [], // dominant colors for UI theming
                    'resolution' => $wallpaper['resolution'] ?? '2560x1600',
                    'fileSize' => $wallpaper['fileSize'] ?? 0,
                    'source' => 'local'
                ];
            }
            
            return [
                'wallpapers' => $wallpapers,
                '_metadata' => [
                    'version' => $manifest['_metadata']['version'] ?? '1.0.0',
                    'lastUpdated' => $manifest['_metadata']['lastUpdated'] ?? now()->toIso8601String(),
                    'totalWallpapers' => count($wallpapers),
                    'source' => 'local-manifest',
                    'supabaseAvailable' => false
                ]
            ];
            
        } catch (Exception $e) {
            Log::error("Failed to get wallpapers: " . $e->getMessage());
            return $this->getDefaultWallpapers();
        }
    }
    
    /**
     * Get wallpaper by ID
     * 
     * @param string $id Wallpaper identifier
     * @return array|null Wallpaper data or null if not found
     */
    public function getWallpaper(string $id): ?array
    {
        try {
            $data = $this->getAllWallpapers();
            $wallpapers = $data['wallpapers'] ?? [];
            
            foreach ($wallpapers as $wallpaper) {
                if ($wallpaper['id'] === $id) {
                    return $wallpaper;
                }
            }
            
            return null;
            
        } catch (Exception $e) {
            Log::error("Failed to get wallpaper {$id}: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Get wallpapers suitable for current time of day based on light/dark types
     * 
     * @param int|null $hour Current hour (0-23), null for system time
     * @param bool $randomize Whether to return random wallpaper from matching type
     * @return array Filtered wallpapers for time period
     */
    public function getTimeBasedWallpapers(?int $hour = null, bool $randomize = false): array
    {
        try {
            if ($hour === null) {
                $hour = (int) date('H');
            }
            
            // LinkOS-style time logic: 6 AM - 6 PM = light, 6 PM - 6 AM = dark
            $isDaytime = ($hour >= 6 && $hour < 18);
            $preferredType = $isDaytime ? 'light' : 'dark';
            
            Log::info("Time-based wallpaper selection: Hour {$hour}, Daytime: " . ($isDaytime ? 'yes' : 'no') . ", Preferred type: {$preferredType}");
            
            $data = $this->getAllWallpapers();
            $allWallpapers = $data['wallpapers'] ?? [];
            
            // Filter wallpapers by preferred type (light/dark)
            $preferredWallpapers = array_filter($allWallpapers, function($wallpaper) use ($preferredType) {
                return $wallpaper['type'] === $preferredType;
            });
            
            // If no wallpapers of preferred type, include 'mixed' type as fallback
            if (empty($preferredWallpapers)) {
                $preferredWallpapers = array_filter($allWallpapers, function($wallpaper) use ($preferredType) {
                    return in_array($wallpaper['type'], [$preferredType, 'mixed']);
                });
            }
            
            // If still no wallpapers, return all as final fallback
            if (empty($preferredWallpapers)) {
                $preferredWallpapers = $allWallpapers;
            }
            
            Log::info("Found " . count($preferredWallpapers) . " wallpapers matching type '{$preferredType}'");
            
            // Return random wallpaper if requested
            if ($randomize && !empty($preferredWallpapers)) {
                $randomIndex = array_rand($preferredWallpapers);
                return [$preferredWallpapers[$randomIndex]];
            }
            
            return array_values($preferredWallpapers);
            
        } catch (Exception $e) {
            Log::error("Failed to get time-based wallpapers: " . $e->getMessage());
            $data = $this->getAllWallpapers();
            return $data['wallpapers'] ?? [];
        }
    }
    
    /**
     * Get random wallpaper from appropriate time category
     * 
     * @param int|null $hour Current hour for time-based selection
     * @return array Random wallpaper data
     */
    public function getRandomWallpaper(?int $hour = null): array
    {
        try {
            // Get random wallpaper from time-appropriate type
            $timeBasedWallpapers = $this->getTimeBasedWallpapers($hour, true);
            
            if (!empty($timeBasedWallpapers)) {
                return $timeBasedWallpapers[0]; // Already randomized by getTimeBasedWallpapers
            }
            
            // Fallback to any available wallpaper
            $allWallpapers = $this->getAllWallpapers();
            if (!empty($allWallpapers)) {
                $randomIndex = array_rand($allWallpapers);
                return $allWallpapers[$randomIndex];
            }
            
            return $this->getDefaultWallpapers()[0];
            
        } catch (Exception $e) {
            Log::error("Failed to get random wallpaper: " . $e->getMessage());
            return $this->getDefaultWallpapers()[0];
        }
    }
    
    /**
     * Get wallpaper manifest from public storage
     * 
     * @return array Wallpaper manifest data
     */
    private function getManifest(): array
    {
        try {
            $manifestPath = public_path('wallpapers-manifest.json');
            
            if (!file_exists($manifestPath)) {
                throw new Exception("Wallpaper manifest not found");
            }
            
            $content = file_get_contents($manifestPath);
            $manifest = json_decode($content, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new Exception("Invalid JSON in manifest: " . json_last_error_msg());
            }
            
            return $manifest;
            
        } catch (Exception $e) {
            Log::error("Failed to load wallpaper manifest: " . $e->getMessage());
            return $this->getDefaultManifest();
        }
    }
    
    /**
     * Get thumbnail URL for wallpaper
     * 
     * @param string $id Wallpaper ID
     * @return string Thumbnail URL
     */
    private function getThumbnailUrl(string $id): string
    {
        try {
            $manifest = $this->getManifest();
            
            // Find wallpaper by ID in manifest
            foreach ($manifest['wallpapers'] as $wallpaper) {
                if ($wallpaper['id'] === $id) {
                    // Handle both single filename and multiple filenames (High Sierra case)
                    $filenames = [];
                    if (isset($wallpaper['filename'])) {
                        $filenames = [$wallpaper['filename']];
                    } elseif (isset($wallpaper['filenames']) && is_array($wallpaper['filenames'])) {
                        $filenames = $wallpaper['filenames'];
                    }
                    
                    // Try first available filename
                    foreach ($filenames as $filename) {
                        // URL encode filename to handle spaces
                        $encodedFilename = rawurlencode($filename);
                        
                        // Check if thumbnail exists
                        $thumbnailPath = "/images/wallpapers/thumbnails/$encodedFilename";
                        if (file_exists(public_path("images/wallpapers/thumbnails/$filename"))) {
                            return $thumbnailPath;
                        }
                        
                        // Use full image if thumbnail doesn't exist
                        $fullPath = "/images/wallpapers/$encodedFilename";
                        if (file_exists(public_path("images/wallpapers/$filename"))) {
                            return $fullPath;
                        }
                    }
                }
            }
        } catch (Exception $e) {
            Log::warning("Failed to get thumbnail for $id: " . $e->getMessage());
        }
        
        // Fallback SVG if nothing found
        return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='125'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23007aff;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%2300d4aa;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grad)' /%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='white' font-size='12'%3ELinkOS {$id}%3C/text%3E%3C/svg%3E";
    }
    
    /**
     * Get full image URL for wallpaper
     * 
     * @param string $id Wallpaper ID
     * @return string Full image URL
     */
    private function getFullImageUrl(string $id): string
    {
        try {
            $manifest = $this->getManifest();
            
            // Find wallpaper by ID in manifest
            foreach ($manifest['wallpapers'] as $wallpaper) {
                if ($wallpaper['id'] === $id) {
                    // Handle both single filename and multiple filenames (High Sierra case)
                    $filenames = [];
                    if (isset($wallpaper['filename'])) {
                        $filenames = [$wallpaper['filename']];
                    } elseif (isset($wallpaper['filenames']) && is_array($wallpaper['filenames'])) {
                        $filenames = $wallpaper['filenames'];
                    }
                    
                    // Try first available filename
                    foreach ($filenames as $filename) {
                        // URL encode filename to handle spaces
                        $encodedFilename = rawurlencode($filename);
                        $fullPath = "/images/wallpapers/$encodedFilename";
                        
                        if (file_exists(public_path("images/wallpapers/$filename"))) {
                            return $fullPath;
                        }
                    }
                }
            }
        } catch (Exception $e) {
            Log::warning("Failed to get full image for $id: " . $e->getMessage());
        }
        
        // Fallback SVG if nothing found
        return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1920' height='1080'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23007aff;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%2300d4aa;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grad)' /%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='white' font-size='48'%3ELinkOS {$id}%3C/text%3E%3C/svg%3E";
    }
    
    /**
     * Get default wallpapers if manifest fails
     * 
     * @return array Default wallpaper collection
     */
    private function getDefaultWallpapers(): array
    {
        return [
            [
                'id' => 'big-sur',
                'name' => 'Big Sur',
                'category' => 'nature',
                'thumbnail' => asset('images/wallpapers/thumbnails/big-sur_thumb.webp'),
                'fullImage' => asset('images/wallpapers/big-sur.jpg'),
                'timeCategory' => 'day',
                'colors' => ['#4A9EFF', '#87CEEB', '#98FB98'],
                'resolution' => '2560x1600',
                'fileSize' => 1024000
            ]
        ];
    }
    
    /**
     * Get default manifest structure
     * 
     * @return array Default manifest
     */
    private function getDefaultManifest(): array
    {
        return [
            'version' => '1.0.0',
            'totalWallpapers' => 1,
            'categories' => ['nature', 'abstract', 'dark', 'light'],
            'wallpapers' => [
                [
                    'id' => 'big-sur',
                    'name' => 'Big Sur',
                    'category' => 'nature',
                    'timeCategory' => 'day',
                    'colors' => ['#4A9EFF', '#87CEEB', '#98FB98'],
                    'resolution' => '2560x1600',
                    'fileSize' => 1024000
                ]
            ]
        ];
    }
    
    /**
     * Get current wallpaper from user preferences or default
     * 
     * @return array Current wallpaper data
     */
    public function getCurrentWallpaper(): array
    {
        try {
            // Try to get from user session/preferences first
            $sessionWallpaper = session('current_wallpaper');
            if ($sessionWallpaper && is_array($sessionWallpaper)) {
                return $sessionWallpaper;
            }
            
            // Try to get from preferences service if available
            try {
                $preferences = app('App\Services\PreferencesService');
                $wallpaperPrefs = $preferences->get('desktop.wallpaper', []);
                
                if (!empty($wallpaperPrefs['current_id'])) {
                    $wallpaper = $this->getWallpaper($wallpaperPrefs['current_id']);
                    if ($wallpaper) {
                        return $wallpaper;
                    }
                }
            } catch (Exception $e) {
                Log::debug("Could not load from preferences service: " . $e->getMessage());
            }
            
            // Fallback to time-based default
            $timeBasedWallpapers = $this->getTimeBasedWallpapers();
            if (!empty($timeBasedWallpapers)) {
                return $timeBasedWallpapers[0];
            }
            
            // Final fallback to first available wallpaper
            $allWallpapers = $this->getAllWallpapers();
            if (!empty($allWallpapers)) {
                return $allWallpapers[0];
            }
            
            // Absolute fallback - return default Big Sur
            return $this->getDefaultWallpapers()[0];
            
        } catch (Exception $e) {
            Log::error("Failed to get current wallpaper: " . $e->getMessage());
            return $this->getDefaultWallpapers()[0];
        }
    }
    
    /**
     * Set current wallpaper in session
     * 
     * @param array $wallpaper Wallpaper data
     * @return bool Success status
     */
    public function setCurrentWallpaper(array $wallpaper): bool
    {
        try {
            session(['current_wallpaper' => $wallpaper]);
            
            // Also try to update preferences if service is available
            try {
                $preferences = app('App\Services\PreferencesService');
                $preferences->set('desktop.wallpaper.current_id', $wallpaper['id']);
                $preferences->set('desktop.wallpaper.last_updated', now()->toISOString());
            } catch (Exception $e) {
                Log::debug("Could not save to preferences service: " . $e->getMessage());
            }
            
            Log::info("Current wallpaper set to: " . ($wallpaper['name'] ?? $wallpaper['id']));
            return true;
            
        } catch (Exception $e) {
            Log::error("Failed to set current wallpaper: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Get wallpapers by category (System, Classic, Art)
     * 
     * @param string $category Category to filter by
     * @return array Wallpapers matching the specified category
     */
    public function getByCategory(string $category): array
    {
        try {
            $allWallpapers = $this->getAllWallpapers();
            
            return array_values(array_filter($allWallpapers, function($wallpaper) use ($category) {
                return strcasecmp($wallpaper['category'], $category) === 0;
            }));
            
        } catch (Exception $e) {
            Log::error("Failed to get wallpapers by category {$category}: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Get wallpapers by type (light, dark, mixed)
     * 
     * @param string $type Type to filter by
     * @return array Filtered wallpapers
     */
    public function getWallpapersByType(string $type): array
    {
        try {
            $allWallpapers = $this->getAllWallpapers();
            
            return array_values(array_filter($allWallpapers, function($wallpaper) use ($type) {
                return ($wallpaper['type'] ?? 'mixed') === $type;
            }));
            
        } catch (Exception $e) {
            Log::error("Failed to get wallpapers by type {$type}: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Smart wallpaper selection: Random for first visit, time-based with daily persistence
     * 
     * @param int|null $hour Current hour for time-based selection
     * @param string|null $userFingerprint User identifier for session tracking
     * @param bool $isFirstVisit Whether this is the user's first visit
     * @return array Single wallpaper data
     */
    public function getSmartWallpaper(?int $hour = null, ?string $userFingerprint = null, bool $isFirstVisit = false): array
    {
        try {
            if ($hour === null) {
                $hour = (int) date('H');
            }

            $sessionKey = "smart_wallpaper_" . ($userFingerprint ?? 'default');
            $dailyKey = $sessionKey . "_" . date('Y-m-d');

            // First visit: Select random wallpaper and store for the day
            if ($isFirstVisit) {
                Log::info("First visit detected for user {$userFingerprint}, selecting random wallpaper");
                
                $randomWallpaper = $this->getRandomWallpaper($hour);
                
                // Store this wallpaper for the entire day
                session([$dailyKey => $randomWallpaper]);
                session([$sessionKey . '_last_visit' => now()->toDateTimeString()]);
                session(['portfolio_visited' => now()->toDateTimeString()]);
                
                // Also store as current wallpaper for immediate persistence
                $this->setCurrentWallpaper($randomWallpaper);
                
                Log::info("Stored random wallpaper for daily use: " . ($randomWallpaper['name'] ?? 'Unknown'));
                
                return $randomWallpaper;
            }

            // Check if we already have a wallpaper stored for today
            $dailyWallpaper = session($dailyKey);
            if ($dailyWallpaper) {
                Log::info("Using stored daily wallpaper: " . ($dailyWallpaper['name'] ?? 'Unknown'));
                return $dailyWallpaper;
            }

            // No stored wallpaper for today, select time-based wallpaper and store it
            Log::info("No daily wallpaper found, selecting time-based wallpaper for hour {$hour}");
            
            $isDaytime = ($hour >= 6 && $hour < 18);
            $preferredType = $isDaytime ? 'light' : 'dark';
            
            $timeBasedWallpapers = $this->getWallpapersByType($preferredType);
            
            // Fallback to mixed type if no wallpapers of preferred type
            if (empty($timeBasedWallpapers)) {
                $timeBasedWallpapers = $this->getWallpapersByType('mixed');
            }
            
            // Final fallback to all wallpapers
            if (empty($timeBasedWallpapers)) {
                $timeBasedWallpapers = $this->getAllWallpapers();
            }

            // Select a deterministic wallpaper based on user fingerprint and date
            $seed = crc32($userFingerprint . date('Y-m-d') . $preferredType);
            $wallpaperIndex = $seed % count($timeBasedWallpapers);
            $selectedWallpaper = $timeBasedWallpapers[$wallpaperIndex];

            // Store this wallpaper for the entire day
            session([$dailyKey => $selectedWallpaper]);
            
            // Also store as current wallpaper for persistence
            $this->setCurrentWallpaper($selectedWallpaper);
            
            Log::info("Selected and stored time-based wallpaper: " . ($selectedWallpaper['name'] ?? 'Unknown') . " (type: {$preferredType})");
            
            return $selectedWallpaper;

        } catch (Exception $e) {
            Log::error("Failed to get smart wallpaper selection: " . $e->getMessage());
            // Fallback to regular random wallpaper
            return $this->getRandomWallpaper($hour);
        }
    }
}