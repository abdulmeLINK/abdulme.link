<?php

namespace App\Services;

use App\Contracts\DataServiceInterface;
use App\Exceptions\DataServiceException;
use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\File;

/**
 * DataService - JSON file management and validation
 * Handles all JSON data operations with validation and error handling
 */
class DataService implements DataServiceInterface
{
    /**
     * Get the full path to the data storage directory
     */
    private function getStoragePath(): string
    {
        return storage_path('data');
    }

    /**
     * Get the full path to the backup directory
     */
    private function getBackupPath(): string
    {
        return storage_path('data/backups');
    }
    
    /**
     * Read JSON data from storage with validation
     * Supports Supabase Storage fallback for Docker deployments
     * 
     * @param string $filename JSON file name (without .json extension)
     * @param array $defaultData Default data if file doesn't exist
     * @return array Parsed JSON data with metadata
     */
    public function read(string $filename, array $defaultData = []): array
    {
        // Try Supabase Storage first if enabled
        if (env('USE_SUPABASE_STORAGE', false)) {
            $data = $this->readFromSupabaseStorage($filename);
            if ($data !== null) {
                // Add metadata to indicate data source
                $data['_metadata'] = [
                    'source' => 'supabase',
                    'timestamp' => now()->toIso8601String(),
                    'cached' => false
                ];
                return $data;
            }
            // If Supabase fails, fall through to local files
            Log::info("Supabase Storage unavailable, falling back to local files");
        }

        // Read from local files
        try {
            $filePath = $this->getStoragePath() . '/' . $filename . '.json';
            
            if (!File::exists($filePath)) {
                Log::info("JSON file not found: {$filePath}, returning defaults");
                return $defaultData;
            }
            
            $content = File::get($filePath);
            $data = json_decode($content, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new Exception("Invalid JSON in {$filePath}: " . json_last_error_msg());
            }
            
            // Add metadata to indicate data source
            $data['_metadata'] = [
                'source' => 'local',
                'timestamp' => now()->toIso8601String(),
                'file_path' => $filePath
            ];
            
            return $data;
            
        } catch (Exception $e) {
            Log::error("Failed to read JSON file {$filename}: " . $e->getMessage());
            return $defaultData;
        }
    }

    /**
     * Read JSON data from Supabase Storage
     * 
     * @param string $filename JSON file name (without .json extension)
     * @return array|null Parsed JSON data or null on failure
     */
    private function readFromSupabaseStorage(string $filename): ?array
    {
        try {
            $supabaseUrl = env('SUPABASE_URL');
            $bucketName = env('SUPABASE_STORAGE_BUCKET', 'portfolio-data');
            
            if (!$supabaseUrl) {
                return null;
            }

            $url = "{$supabaseUrl}/storage/v1/object/public/{$bucketName}/{$filename}.json";
            
            // Try with cache first
            $cacheKey = "supabase:storage:{$filename}";
            $cached = \Illuminate\Support\Facades\Cache::get($cacheKey);
            
            if ($cached !== null) {
                // Add cached indicator to metadata
                if (is_array($cached)) {
                    $cached['_metadata']['cached'] = true;
                }
                return $cached;
            }

            // Fetch from Supabase with timeout
            $response = \Illuminate\Support\Facades\Http::timeout(5)
                ->retry(2, 100)
                ->get($url);

            if ($response->successful()) {
                // Get response body and decode manually to ensure array
                $body = $response->body();
                $data = json_decode($body, true);
                
                if (!is_array($data)) {
                    Log::error("Supabase Storage returned non-array data for {$filename}");
                    return null;
                }
                
                // Cache for 1 hour
                \Illuminate\Support\Facades\Cache::put($cacheKey, $data, 3600);
                
                Log::info("Successfully read {$filename} from Supabase Storage");
                return $data;
            }

            Log::warning("Supabase Storage returned {$response->status()} for {$filename}");
            return null;
            
        } catch (Exception $e) {
            Log::warning("Failed to read from Supabase Storage: {$e->getMessage()}");
            return null;
        }
    }
    
    /**
     * Write JSON data to storage with backup and validation
     * 
     * @param string $filename JSON file name (without .json extension)
     * @param array $data Data to save
     * @param bool $createBackup Whether to create backup before writing
     * @return bool Success status
     */
    public function write(string $filename, array $data, bool $createBackup = true): bool
    {
        try {
            $filePath = $this->getStoragePath() . '/' . $filename . '.json';
            
            // Create backup if file exists and backup is requested
            if ($createBackup && File::exists($filePath)) {
                $this->createBackup($filename);
            }
            
            // Validate data can be JSON encoded
            $jsonContent = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new Exception("Cannot encode data to JSON: " . json_last_error_msg());
            }
            
            // Ensure directory exists
            $directory = dirname($filePath);
            if (!File::exists($directory)) {
                File::makeDirectory($directory, 0755, true);
            }
            
            File::put($filePath, $jsonContent);
            
            Log::info("Successfully saved JSON file: {$filePath}");
            return true;
            
        } catch (Exception $e) {
            Log::error("Failed to write JSON file {$filename}: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Create backup of existing JSON file
     * 
     * @param string $filename JSON file name (without .json extension)
     * @return bool Success status
     */
    private function createBackup(string $filename): bool
    {
        try {
            $originalPath = $this->getStoragePath() . '/' . $filename . '.json';
            $backupPath = $this->getBackupPath() . '/' . $filename . '_' . date('Y-m-d_H-i-s') . '.json';
            
            if (!File::exists($originalPath)) {
                return false;
            }
            
            // Ensure backup directory exists
            $backupDir = dirname($backupPath);
            if (!File::exists($backupDir)) {
                File::makeDirectory($backupDir, 0755, true);
            }
            
            File::copy($originalPath, $backupPath);
            
            // Keep only last 5 backups
            $this->cleanupBackups($filename);
            
            return true;
            
        } catch (Exception $e) {
            Log::error("Failed to create backup for {$filename}: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Clean up old backup files, keeping only the latest 5
     * 
     * @param string $filename JSON file name (without .json extension)
     */
    private function cleanupBackups(string $filename): void
    {
        try {
            $backupDir = $this->getBackupPath();
            
            if (!File::exists($backupDir)) {
                return;
            }
            
            $backupFiles = File::files($backupDir);
            $relevantBackups = array_filter($backupFiles, function($file) use ($filename) {
                return str_contains($file->getFilename(), $filename . '_');
            });
            
            if (count($relevantBackups) > 5) {
                // Sort by modification time
                usort($relevantBackups, function($a, $b) {
                    return $b->getMTime() - $a->getMTime();
                });
                
                $filesToDelete = array_slice($relevantBackups, 5);
                
                foreach ($filesToDelete as $file) {
                    File::delete($file->getPathname());
                }
            }
            
        } catch (Exception $e) {
            Log::error("Failed to cleanup backups for {$filename}: " . $e->getMessage());
        }
    }
    
    /**
     * Validate data structure against schema
     * 
     * @param array $data Data to validate
     * @param array $schema Schema definition
     * @return bool Validation result
     */
    public function validateSchema(array $data, array $schema): bool
    {
        try {
            foreach ($schema as $key => $requirements) {
                if (isset($requirements['required']) && $requirements['required']) {
                    if (!array_key_exists($key, $data)) {
                        Log::warning("Missing required field: {$key}");
                        return false;
                    }
                }
                
                if (array_key_exists($key, $data) && isset($requirements['type'])) {
                    $actualType = gettype($data[$key]);
                    if ($actualType !== $requirements['type']) {
                        Log::warning("Invalid type for {$key}: expected {$requirements['type']}, got {$actualType}");
                        return false;
                    }
                }
            }
            
            return true;
            
        } catch (Exception $e) {
            Log::error("Schema validation failed: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Get file modification timestamp
     * 
     * @param string $filename JSON file name (without .json extension)
     * @return int|null Unix timestamp or null if file doesn't exist
     */
    public function getLastModified(string $filename): ?int
    {
        try {
            $filePath = $this->getStoragePath() . '/' . $filename . '.json';
            return File::exists($filePath) ? File::lastModified($filePath) : null;
        } catch (Exception $e) {
            Log::error("Failed to get last modified time for {$filename}: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Validate JSON data structure
     * 
     * @param array $data Data to validate
     * @param array $rules Validation rules
     * @return bool True if valid, false otherwise
     */
    public function validate(array $data, array $rules): bool
    {
        try {
            foreach ($rules as $field => $rule) {
                // Check required fields
                if (isset($rule['required']) && $rule['required'] && !isset($data[$field])) {
                    Log::warning("Validation failed: Missing required field '{$field}'");
                    return false;
                }

                // Skip validation if field is not present and not required
                if (!isset($data[$field])) {
                    continue;
                }

                // Type validation
                if (isset($rule['type'])) {
                    $actualType = gettype($data[$field]);
                    $expectedType = $rule['type'];
                    
                    if ($actualType !== $expectedType) {
                        Log::warning("Validation failed: Field '{$field}' expected {$expectedType}, got {$actualType}");
                        return false;
                    }
                }

                // Length validation
                if (isset($rule['max_length']) && is_string($data[$field])) {
                    if (strlen($data[$field]) > $rule['max_length']) {
                        Log::warning("Validation failed: Field '{$field}' exceeds max length of {$rule['max_length']}");
                        return false;
                    }
                }

                // Array validation
                if (isset($rule['array_type']) && is_array($data[$field])) {
                    foreach ($data[$field] as $item) {
                        if (gettype($item) !== $rule['array_type']) {
                            Log::warning("Validation failed: Array field '{$field}' contains invalid type");
                            return false;
                        }
                    }
                }
            }

            return true;

        } catch (Exception $e) {
            Log::error("Validation error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Create backup of existing file before writing
     * 
     * @param string $filename JSON file name (without .json extension)
     * @return bool True if backup created or no file exists, false on error
     */
    public function backup(string $filename): bool
    {
        try {
            $filePath = $this->getStoragePath() . '/' . $filename . '.json';
            
            // If file doesn't exist, no backup needed
            if (!File::exists($filePath)) {
                return true;
            }

            $backupDir = $this->getBackupPath();
            
            // Ensure backup directory exists
            if (!File::exists($backupDir)) {
                File::makeDirectory($backupDir, 0755, true);
            }

            // Create backup filename with timestamp
            $timestamp = date('Y-m-d_H-i-s');
            $backupPath = $backupDir . '/' . $filename . '_' . $timestamp . '.json';
            
            // Copy file to backup location
            $success = File::copy($filePath, $backupPath);
            
            if ($success) {
                Log::info("Backup created: {$backupPath}");
                $this->cleanupOldBackups($filename);
            }
            
            return $success;
            
        } catch (Exception $e) {
            Log::error("Failed to create backup for {$filename}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get file statistics and metadata
     * 
     * @param string $filename JSON file name (without .json extension)
     * @return array File statistics or empty array if file doesn't exist
     */
    public function getFileStats(string $filename): array
    {
        try {
            $filePath = $this->getStoragePath() . '/' . $filename . '.json';
            
            if (!File::exists($filePath)) {
                return [];
            }

            $size = File::size($filePath);
            $lastModified = File::lastModified($filePath);
            $content = File::get($filePath);
            $data = json_decode($content, true);
            
            $stats = [
                'filename' => $filename . '.json',
                'path' => $filePath,
                'size' => $size,
                'size_human' => $this->formatBytes($size),
                'last_modified' => $lastModified,
                'last_modified_human' => date('Y-m-d H:i:s', $lastModified),
                'is_valid_json' => json_last_error() === JSON_ERROR_NONE,
                'json_error' => json_last_error_msg(),
                'record_count' => is_array($data) ? count($data) : 0
            ];

            // Add metadata if available
            if (is_array($data) && isset($data['_metadata'])) {
                $stats['metadata'] = $data['_metadata'];
            }

            return $stats;

        } catch (Exception $e) {
            Log::error("Failed to get file stats for {$filename}: " . $e->getMessage());
            return [
                'error' => $e->getMessage(),
                'filename' => $filename . '.json'
            ];
        }
    }

    /**
     * Format bytes to human readable format
     * 
     * @param int $bytes
     * @return string
     */
    private function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $factor = floor((strlen($bytes) - 1) / 3);
        return sprintf("%.2f %s", $bytes / pow(1024, $factor), $units[$factor]);
    }

    /**
     * Clean up old backup files, keeping only the latest 5
     * 
     * @param string $filename
     * @return void
     */
    private function cleanupOldBackups(string $filename): void
    {
        try {
            $backupDir = $this->getBackupPath();
            
            if (!File::exists($backupDir)) {
                return;
            }
            
            $backupFiles = File::files($backupDir);
            $relevantBackups = array_filter($backupFiles, function($file) use ($filename) {
                return str_contains($file->getFilename(), $filename . '_');
            });

            // Sort by modification time (newest first)
            usort($relevantBackups, function($a, $b) {
                return $b->getMTime() - $a->getMTime();
            });

            // Delete old backups (keep only latest 5)
            $backupsToDelete = array_slice($relevantBackups, 5);
            foreach ($backupsToDelete as $backup) {
                File::delete($backup->getPathname());
                Log::info("Deleted old backup: " . $backup->getFilename());
            }

        } catch (Exception $e) {
            Log::warning("Failed to cleanup old backups: " . $e->getMessage());
        }
    }
}