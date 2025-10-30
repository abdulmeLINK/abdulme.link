<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

/**
 * SupabaseStorageService - Manages image assets with Supabase Storage
 * 
 * Features:
 * - Supabase Storage as primary source
 * - Local filesystem as fallback
 * - Automatic metadata tracking
 * - CDN URL generation
 * - Cache management
 * 
 * Bucket Structure:
 * - portfolio-assets: All images (wallpapers, profile, icons, etc.)
 * - portfolio-projects: Project screenshots and demos
 */
class SupabaseStorageService
{
    private string $supabaseUrl;
    private string $supabaseKey;
    private int $cacheTime = 3600; // 1 hour
    
    // Bucket names - wallpapers now in assets bucket
    private const BUCKET_WALLPAPERS = 'portfolio-assets';
    private const BUCKET_PROJECTS = 'portfolio-projects';
    private const BUCKET_ASSETS = 'portfolio-assets';
    
    public function __construct()
    {
        $this->supabaseUrl = env('SUPABASE_URL');
        $this->supabaseKey = env('SUPABASE_SERVICE_KEY');

        Log::debug('SupabaseStorageService: Initializing', [
            'url_configured' => !empty($this->supabaseUrl),
            'key_configured' => !empty($this->supabaseKey),
            'bucket' => $this->bucketName
        ]);

        if (!$this->supabaseUrl || !$this->supabaseKey) {
            Log::warning('SupabaseStorageService: Credentials not configured', [
                'missing_url' => empty($this->supabaseUrl),
                'missing_key' => empty($this->supabaseKey),
                'will_use_local_fallback' => true
            ]);
        } else {
            Log::info('SupabaseStorageService: Credentials configured, Supabase Storage available');
        }
    }

    /**
     * Check if Supabase Storage is available
     */
    public function isAvailable(): bool
    {
        $available = !empty($this->supabaseUrl) && !empty($this->supabaseKey);

        Log::debug('SupabaseStorageService: Availability check', [
            'available' => $this->available
        ]);

        return $available;
    }
    
    /**
     * Get image URL with Supabase primary and local fallback
     * 
     * @param string $path Image path (e.g., "wallpapers/Sonoma-Light.jpg")
     * @param string $bucket Bucket name
     * @param bool $generateThumbnail Whether to generate thumbnail version
     * @return array Image URLs and metadata
     */
    public function getImageUrl(string $path, string $bucket = self::BUCKET_WALLPAPERS, bool $generateThumbnail = false): array
    {
        $cacheKey = "supabase:image:{$bucket}:{$path}";

        Log::debug('SupabaseStorageService: Getting image URL', [
            'path' => $path,
            'bucket' => $bucket,
            'generate_thumbnail' => $generateThumbnail,
            'cache_key' => $cacheKey,
            'supabase_available' => $this->isAvailable()
        ]);

        return Cache::remember($cacheKey, $this->cacheTime, function () use ($path, $bucket, $generateThumbnail) {
            $result = [
                'url' => null,
                'thumbnail' => null,
                'source' => 'none',
                'exists' => false,
                '_metadata' => [
                    'timestamp' => now()->toIso8601String(),
                    'cached' => false,
                    'bucket' => $bucket,
                    'path' => $path
                ]
            ];

            // Try Supabase first
            if ($this->isAvailable()) {
                $supabaseUrl = $this->getSupabasePublicUrl($bucket, $path);

                Log::debug('SupabaseStorageService: Checking Supabase URL', [
                    'supabase_url' => $supabaseUrl,
                    'bucket' => $bucket,
                    'path' => $path
                ]);

                if ($this->checkUrlExists($supabaseUrl)) {
                    $result['url'] = $supabaseUrl;
                    $result['source'] = 'supabase';
                    $result['exists'] = true;

                    // Generate thumbnail URL if requested
                    if ($generateThumbnail) {
                        $thumbnailPath = $this->getThumbnailPath($path);
                        $result['thumbnail'] = $this->getSupabasePublicUrl($bucket, $thumbnailPath);
                    }

                    Log::info("SupabaseStorageService: Serving image from Supabase", [
                        'path' => $path,
                        'bucket' => $bucket,
                        'url' => $supabaseUrl
                    ]);
                    return $result;
                } else {
                    // Supabase URL check failed, fall back to local
                }
            } else {
                // Supabase not available, use local fallback
            }

            // Fallback to local filesystem
            $localPath = $this->getLocalPath($bucket, $path);

            if (file_exists(public_path($localPath))) {
                $result['url'] = asset($localPath);
                $result['source'] = 'local';
                $result['exists'] = true;

                // Local thumbnail
                if ($generateThumbnail) {
                    $localThumbnailPath = $this->getLocalThumbnailPath($localPath);
                    if (file_exists(public_path($localThumbnailPath))) {
                        $result['thumbnail'] = asset($localThumbnailPath);
                    }
                }

                Log::info("SupabaseStorageService: Serving image from local filesystem", [
                    'path' => $path,
                    'local_path' => $localPath,
                    'url' => $result['url']
                ]);
                return $result;
            }

            Log::warning("SupabaseStorageService: Image not found in Supabase or local filesystem", [
                'path' => $path,
                'bucket' => $bucket,
                'supabase_url' => $supabaseUrl ?? 'not checked',
                'local_path' => $localPath
            ]);
            return $result;
        });
    }
    
    /**
     * Get all wallpapers with URLs from Supabase or local
     * 
     * @return array Wallpapers with URLs and metadata
     */
    public function getWallpapers(): array
    {
        $cacheKey = 'supabase:storage:wallpapers:all';
        
        return Cache::remember($cacheKey, $this->cacheTime, function () {
            $manifestPath = public_path('wallpapers-manifest.json');
            
            if (!file_exists($manifestPath)) {
                Log::error('Wallpapers manifest not found');
                return ['wallpapers' => [], '_metadata' => ['error' => 'Manifest not found']];
            }
            
            $manifest = json_decode(file_get_contents($manifestPath), true);
            $wallpapers = [];
            
            foreach ($manifest['wallpapers'] as $wallpaper) {
                // Skip wallpapers without filename
                if (!isset($wallpaper['filename'])) {
                    Log::warning("Wallpaper {$wallpaper['id']} missing filename, skipping");
                    continue;
                }
                
                $filename = $wallpaper['filename'];
                $imageData = $this->getImageUrl("wallpapers/{$filename}", self::BUCKET_WALLPAPERS, true);
                
                $wallpapers[] = [
                    'id' => $wallpaper['id'],
                    'name' => $wallpaper['name'],
                    'version' => $wallpaper['version'],
                    'category' => $wallpaper['category'],
                    'type' => $wallpaper['type'],
                    'colors' => $wallpaper['colors'] ?? [],
                    'filename' => $wallpaper['filename'],
                    'fullImage' => $imageData['url'],
                    'thumbnail' => $imageData['thumbnail'] ?? $imageData['url'],
                    'source' => $imageData['source'],
                    'exists' => $imageData['exists']
                ];
            }
            
            return [
                'wallpapers' => $wallpapers,
                '_metadata' => [
                    'version' => '1.0.0',
                    'lastUpdated' => now()->toIso8601String(),
                    'totalWallpapers' => count($wallpapers),
                    'source' => 'supabase-storage-service',
                    'supabaseAvailable' => $this->isAvailable(),
                    'cached' => false
                ]
            ];
        });
    }
    
    /**
     * Get project images with URLs
     * 
     * @param string $projectId Project identifier
     * @return array Project image URLs
     */
    public function getProjectImages(string $projectId): array
    {
        $cacheKey = "supabase:storage:project:{$projectId}";
        
        return Cache::remember($cacheKey, $this->cacheTime, function () use ($projectId) {
            // Load from portfolio.json
            $dataService = app(DataService::class);
            $portfolioData = $dataService->read('portfolio', []);
            
            if (!isset($portfolioData['projects'])) {
                return ['images' => [], '_metadata' => ['error' => 'Portfolio data not found']];
            }
            
            $project = collect($portfolioData['projects'])->firstWhere('id', $projectId);
            
            if (!$project || !isset($project['images'])) {
                return ['images' => [], '_metadata' => ['error' => 'Project not found']];
            }
            
            $result = [
                'thumbnail' => null,
                'gallery' => [],
                '_metadata' => [
                    'projectId' => $projectId,
                    'timestamp' => now()->toIso8601String(),
                    'cached' => false
                ]
            ];
            
            // Get thumbnail
            if (isset($project['images']['thumbnail'])) {
                $thumbnailPath = str_replace('/images/projects/', '', $project['images']['thumbnail']);
                $imageData = $this->getImageUrl($thumbnailPath, self::BUCKET_PROJECTS);
                $result['thumbnail'] = $imageData['url'];
                $result['_metadata']['thumbnailSource'] = $imageData['source'];
            }
            
            // Get gallery images
            if (isset($project['images']['gallery'])) {
                foreach ($project['images']['gallery'] as $imagePath) {
                    $cleanPath = str_replace('/images/projects/', '', $imagePath);
                    $imageData = $this->getImageUrl($cleanPath, self::BUCKET_PROJECTS);
                    
                    if ($imageData['exists']) {
                        $result['gallery'][] = [
                            'url' => $imageData['url'],
                            'source' => $imageData['source']
                        ];
                    }
                }
            }
            
            return $result;
        });
    }
    
    /**
     * Get Supabase public URL for an object
     */
    private function getSupabasePublicUrl(string $bucket, string $path): string
    {
        return "{$this->supabaseUrl}/storage/v1/object/public/{$bucket}/{$path}";
    }
    
    /**
     * Get local filesystem path for bucket and file
     */
    private function getLocalPath(string $bucket, string $path): string
    {
        $pathMap = [
            self::BUCKET_WALLPAPERS => 'images', // wallpapers/* paths already include wallpapers/ prefix
            self::BUCKET_PROJECTS => 'images',   // projects/* paths already include projects/ prefix
            self::BUCKET_ASSETS => 'images'      // Direct path to images folder
        ];
        
        $basePath = $pathMap[$bucket] ?? 'images';
        
        // Path already includes the subfolder (wallpapers/, projects/, etc.)
        return "{$basePath}/{$path}";
    }
    
    /**
     * Get local thumbnail path
     */
    private function getLocalThumbnailPath(string $imagePath): string
    {
        $pathInfo = pathinfo($imagePath);
        $dirname = $pathInfo['dirname'];
        $filename = $pathInfo['filename'];
        $extension = $pathInfo['extension'];
        
        return "{$dirname}/thumbnails/{$filename}.{$extension}";
    }
    
    /**
     * Get thumbnail path for Supabase
     */
    private function getThumbnailPath(string $path): string
    {
        $pathInfo = pathinfo($path);
        $dirname = $pathInfo['dirname'];
        $filename = $pathInfo['filename'];
        $extension = $pathInfo['extension'];
        
        return "{$dirname}/thumbnails/{$filename}.{$extension}";
    }
    
    /**
     * Check if URL exists (HEAD request)
     */
    private function checkUrlExists(string $url): bool
    {
        try {
            $startTime = microtime(true);
            $response = Http::timeout(3)->head($url);
            $endTime = microtime(true);
            $duration = round(($endTime - $startTime) * 1000, 2);

            $exists = $response->successful();

            return $exists;
        } catch (\Illuminate\Http\Client\RequestException $e) {
            return false;
        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            return false;
        } catch (\Exception $e) {
            return false;
        }
    }
    
    /**
     * Upload image to Supabase Storage
     * 
     * @param string $localPath Local file path
     * @param string $remotePath Remote path in bucket
     * @param string $bucket Bucket name
     * @return array Upload result with metadata
     */
    public function uploadImage(string $localPath, string $remotePath, string $bucket = self::BUCKET_WALLPAPERS): array
    {
        if (!$this->isAvailable()) {
            return [
                'success' => false,
                'error' => 'Supabase Storage not configured',
                '_metadata' => ['timestamp' => now()->toIso8601String()]
            ];
        }
        
        try {
            $fileContents = file_get_contents($localPath);
            $mimeType = mime_content_type($localPath);
            
            $response = Http::withHeaders([
                'Authorization' => "Bearer {$this->supabaseKey}",
                'Content-Type' => $mimeType,
            ])->put(
                "{$this->supabaseUrl}/storage/v1/object/{$bucket}/{$remotePath}",
                $fileContents
            );
            
            if ($response->successful()) {
                // Clear cache
                Cache::forget("supabase:image:{$bucket}:{$remotePath}");
                
                Log::info("Successfully uploaded {$remotePath} to Supabase Storage");
                
                return [
                    'success' => true,
                    'url' => $this->getSupabasePublicUrl($bucket, $remotePath),
                    '_metadata' => [
                        'timestamp' => now()->toIso8601String(),
                        'bucket' => $bucket,
                        'path' => $remotePath,
                        'size' => strlen($fileContents),
                        'mimeType' => $mimeType
                    ]
                ];
            }
            
            Log::error("Failed to upload to Supabase: " . $response->body());
            
            return [
                'success' => false,
                'error' => 'Upload failed: ' . $response->status(),
                '_metadata' => ['timestamp' => now()->toIso8601String()]
            ];
            
        } catch (\Exception $e) {
            Log::error("Supabase upload exception: " . $e->getMessage());
            
            return [
                'success' => false,
                'error' => $e->getMessage(),
                '_metadata' => ['timestamp' => now()->toIso8601String()]
            ];
        }
    }
    
    /**
     * Clear all image caches
     */
    public function clearCache(): bool
    {
        try {
            Cache::flush(); // Or use tags if available
            Log::info('Supabase Storage cache cleared');
            return true;
        } catch (\Exception $e) {
            Log::error('Failed to clear cache: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Get storage statistics
     */
    public function getStatistics(): array
    {
        return [
            'supabaseAvailable' => $this->isAvailable(),
            'cacheEnabled' => true,
            'cacheDuration' => $this->cacheTime,
            'buckets' => [
                'wallpapers' => self::BUCKET_WALLPAPERS,
                'projects' => self::BUCKET_PROJECTS,
                'assets' => self::BUCKET_ASSETS
            ],
            '_metadata' => [
                'timestamp' => now()->toIso8601String(),
                'version' => '1.0.0'
            ]
        ];
    }
}
