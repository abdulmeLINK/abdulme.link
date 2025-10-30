<?php

namespace App\Http\Controllers;

use App\Services\WallpaperService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

/**
 * Wallpaper Controller - Asset management, thumbnail generation
 * Handles 27 LinkOS wallpapers with progressive loading
 */
class WallpaperController extends Controller
{
    protected WallpaperService $wallpaperService;

    public function __construct(WallpaperService $wallpaperService)
    {
        $this->wallpaperService = $wallpaperService;
    }

    /**
     * Get wallpaper manifest with metadata
     */
    public function index(): JsonResponse
    {
        try {
            $data = $this->wallpaperService->getAllWallpapers();
            $wallpapers = $data['wallpapers'] ?? [];
            
            return response()->json([
                'success' => true,
                'data' => $wallpapers,
                'count' => count($wallpapers),
                '_metadata' => $data['_metadata'] ?? []
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to load wallpapers',
                'message' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Get wallpapers by category (light/dark/dynamic)
     */
    public function category(string $category): JsonResponse
    {
        try {
            $wallpapers = $this->wallpaperService->getByCategory($category);
            
            return response()->json([
                'success' => true,
                'data' => $wallpapers,
                'category' => $category,
                'count' => count($wallpapers)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to load wallpapers for category',
                'message' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Get current wallpaper based on time/preferences
     */
    public function current(): JsonResponse
    {
        try {
            $wallpaper = $this->wallpaperService->getCurrentWallpaper();
            
            return response()->json([
                'success' => true,
                'data' => $wallpaper
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to get current wallpaper',
                'message' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Get time-based wallpapers (day/night) with client hour support
     * Supports LinkOS-style time-based selection: light wallpapers 6AM-6PM, dark 6PM-6AM
     */
    public function timeBasedWallpapers(Request $request): JsonResponse
    {
        try {
            // Get client hour (0-23) and randomize flag from request
            $hour = $request->input('hour');
            $randomize = $request->boolean('random', false);
            
            // Validate hour parameter if provided
            if ($hour !== null && (!is_numeric($hour) || $hour < 0 || $hour > 23)) {
                return response()->json([
                    'success' => false,
                    'error' => 'Invalid hour parameter. Must be between 0-23.'
                ], 400);
            }
            
            $wallpapers = $this->wallpaperService->getTimeBasedWallpapers(
                $hour ? (int) $hour : null,
                $randomize
            );
            
            // Determine time period for response metadata
            $timePeriod = 'mixed';
            if ($hour !== null) {
                $timePeriod = ($hour >= 6 && $hour < 18) ? 'light' : 'dark';
            }
            
            return response()->json([
                'success' => true,
                'data' => $wallpapers,
                'count' => count($wallpapers),
                'metadata' => [
                    'hour' => $hour,
                    'timePeriod' => $timePeriod,
                    'randomized' => $randomize,
                    'description' => $hour !== null 
                        ? "Time-based wallpapers for hour {$hour} ({$timePeriod} period)"
                        : 'All time-based wallpapers'
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to get time-based wallpapers',
                'message' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Smart wallpaper selection: Random for first visit, time-based with daily persistence for returning users
     */
    public function smartSelection(Request $request): JsonResponse
    {
        try {
            $hour = $request->input('hour');
            $userFingerprint = $request->input('fingerprint');
            $isFirstVisit = $request->boolean('firstVisit', false);
            
            // Validate hour parameter if provided
            if ($hour !== null && (!is_numeric($hour) || $hour < 0 || $hour > 23)) {
                return response()->json([
                    'success' => false,
                    'error' => 'Invalid hour parameter. Must be between 0-23.'
                ], 400);
            }
            
            $wallpaper = $this->wallpaperService->getSmartWallpaper(
                $hour ? (int) $hour : null,
                $userFingerprint,
                $isFirstVisit
            );
            
            // Determine selection method
            $selectionMethod = $isFirstVisit ? 'random' : 'time-based';
            $timePeriod = 'mixed';
            if ($hour !== null && !$isFirstVisit) {
                $timePeriod = ($hour >= 6 && $hour < 18) ? 'light' : 'dark';
            }
            
            return response()->json([
                'success' => true,
                'data' => $wallpaper,
                'metadata' => [
                    'selectionMethod' => $selectionMethod,
                    'hour' => $hour,
                    'timePeriod' => $timePeriod,
                    'firstVisit' => $isFirstVisit,
                    'fingerprint' => $userFingerprint,
                    'description' => $isFirstVisit 
                        ? 'Random wallpaper selected for first visit'
                        : "Time-based wallpaper for hour {$hour} ({$timePeriod} period)"
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to get smart wallpaper selection',
                'message' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }
    
    /**
     * Get random wallpaper
     */
    public function random(): JsonResponse
    {
        try {
            $wallpaper = $this->wallpaperService->getRandomWallpaper();
            
            return response()->json([
                'success' => true,
                'data' => $wallpaper
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to get random wallpaper',
                'message' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }
    
    /**
     * Get specific wallpaper by ID
     */
    public function show(string $id): JsonResponse
    {
        try {
            $wallpaper = $this->wallpaperService->getWallpaper($id);
            
            if (!$wallpaper) {
                return response()->json([
                    'success' => false,
                    'error' => 'Wallpaper not found'
                ], 404);
            }
            
            return response()->json([
                'success' => true,
                'data' => $wallpaper
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to get wallpaper',
                'message' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }
    
    /**
     * Get wallpapers by type (light, dark, mixed)
     */
    public function byType(Request $request): JsonResponse
    {
        try {
            $type = $request->input('type');
            
            if (!$type) {
                return response()->json([
                    'success' => false,
                    'error' => 'Type parameter is required'
                ], 400);
            }
            
            if (!in_array($type, ['light', 'dark', 'mixed'])) {
                return response()->json([
                    'success' => false,
                    'error' => 'Invalid type. Must be one of: light, dark, mixed'
                ], 400);
            }
            
            $wallpapers = $this->wallpaperService->getWallpapersByType($type);
            
            return response()->json([
                'success' => true,
                'data' => $wallpapers,
                'type' => $type,
                'count' => count($wallpapers)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to get wallpapers by type',
                'message' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }
    
    /**
     * Get wallpaper statistics and metadata
     */
    public function stats(): JsonResponse
    {
        try {
            $allWallpapers = $this->wallpaperService->getAllWallpapers();
            
            $stats = [
                'total' => count($allWallpapers),
                'byType' => [
                    'light' => 0,
                    'dark' => 0,
                    'mixed' => 0
                ],
                'byCategory' => []
            ];
            
            foreach ($allWallpapers as $wallpaper) {
                // Count by type
                $type = $wallpaper['type'] ?? 'mixed';
                if (isset($stats['byType'][$type])) {
                    $stats['byType'][$type]++;
                }
                
                // Count by category
                $category = $wallpaper['category'] ?? 'Unknown';
                if (!isset($stats['byCategory'][$category])) {
                    $stats['byCategory'][$category] = 0;
                }
                $stats['byCategory'][$category]++;
            }
            
            return response()->json([
                'success' => true,
                'data' => $stats,
                'message' => 'Wallpaper statistics retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to get wallpaper statistics',
                'message' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }
}