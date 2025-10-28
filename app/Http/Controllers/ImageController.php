<?php

namespace App\Http\Controllers;

use App\Services\SupabaseStorageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * ImageController - Serves images from Supabase Storage with local fallback
 * 
 * Handles:
 * - Wallpaper images
 * - Project screenshots
 * - Profile/asset images
 * - Automatic fallback to local files
 * - Metadata tracking
 */
class ImageController extends Controller
{
    protected SupabaseStorageService $storageService;
    
    public function __construct(SupabaseStorageService $storageService)
    {
        $this->storageService = $storageService;
    }
    
    /**
     * Get wallpaper image URL
     * 
     * @param string $id Wallpaper ID
     * @return JsonResponse
     */
    public function wallpaper(string $id): JsonResponse
    {
        try {
            $imageData = $this->storageService->getImageUrl(
                "wallpapers/{$id}",
                'portfolio-wallpapers',
                true // Generate thumbnail
            );
            
            return response()->json([
                'success' => true,
                'data' => $imageData
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to load wallpaper',
                'message' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }
    
    /**
     * Get project images
     * 
     * @param string $projectId Project identifier
     * @return JsonResponse
     */
    public function projectImages(string $projectId): JsonResponse
    {
        try {
            $imagesData = $this->storageService->getProjectImages($projectId);
            
            return response()->json([
                'success' => true,
                'data' => $imagesData
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to load project images',
                'message' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }
    
    /**
     * Get generic asset image
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function asset(Request $request): JsonResponse
    {
        try {
            $path = $request->input('path');
            
            if (!$path) {
                return response()->json([
                    'success' => false,
                    'error' => 'Path parameter required'
                ], 400);
            }
            
            $imageData = $this->storageService->getImageUrl(
                $path,
                'portfolio-assets'
            );
            
            return response()->json([
                'success' => true,
                'data' => $imageData
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to load asset',
                'message' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }
    
    /**
     * Get storage statistics
     * 
     * @return JsonResponse
     */
    public function statistics(): JsonResponse
    {
        try {
            $stats = $this->storageService->getStatistics();
            
            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to load statistics'
            ], 500);
        }
    }
    
    /**
     * Clear image cache
     * 
     * @return JsonResponse
     */
    public function clearCache(): JsonResponse
    {
        try {
            $result = $this->storageService->clearCache();
            
            return response()->json([
                'success' => $result,
                'message' => $result ? 'Cache cleared successfully' : 'Failed to clear cache'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to clear cache',
                'message' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }
}
