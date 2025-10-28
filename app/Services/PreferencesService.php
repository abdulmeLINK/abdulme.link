<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Log;

/**
 * PreferencesService - User settings validation and persistence  
 * Handles desktop preferences, themes, and user customization
 */
class PreferencesService
{
    private DataService $dataService;
    private const DEFAULTS_FILE = 'preferences-defaults';
    private const USER_PREFERENCES_FILE = 'user-preferences';
    
    public function __construct(DataService $dataService)
    {
        $this->dataService = $dataService;
    }
    
    /**
     * Get all user preferences merged with defaults
     * 
     * @return array Complete preferences with user overrides and metadata
     */
    public function getAllPreferences(): array
    {
        try {
            $defaults = $this->getDefaultPreferences();
            $userPrefs = $this->dataService->read(self::USER_PREFERENCES_FILE, []);
            
            // Deep merge user preferences with defaults
            $merged = $this->mergePreferences($defaults, $userPrefs);
            
            // Ensure _metadata exists
            if (!isset($merged['_metadata'])) {
                $merged['_metadata'] = [
                    'version' => '1.0.0',
                    'lastUpdated' => now()->toIso8601String(),
                    'source' => 'preferences',
                    'hasCustomizations' => !empty($userPrefs)
                ];
            }
            
            return $merged;
            
        } catch (Exception $e) {
            Log::error("Failed to get all preferences: " . $e->getMessage());
            return $this->getDefaultPreferences();
        }
    }
    
    /**
     * Get boot-specific preferences
     * 
     * @return array Boot configuration preferences
     */
    public function getBootPreferences(): array
    {
        try {
            $allPrefs = $this->getAllPreferences();
            
            return [
                'boot_duration' => $allPrefs['performance']['boot_duration'] ?? 4000,
                'return_boot_duration' => $allPrefs['performance']['return_boot_duration'] ?? 2000,
                'skip_boot_on_return' => $allPrefs['performance']['skip_boot_on_return'] ?? false,
                'quick_boot' => $allPrefs['performance']['quick_boot'] ?? false,
                'allow_boot_skip' => $allPrefs['performance']['allow_boot_skip'] ?? true,
                'boot_theme' => $allPrefs['appearance']['boot_theme'] ?? 'dark',
                'enable_animations' => $allPrefs['performance']['enable_animations'] ?? true,
                'show_loading_details' => $allPrefs['performance']['show_loading_details'] ?? true,
                'preload_wallpapers' => $allPrefs['performance']['preload_wallpapers'] ?? true
            ];
            
        } catch (Exception $e) {
            Log::error("Failed to get boot preferences: " . $e->getMessage());
            return $this->getDefaultBootPreferences();
        }
    }
    
    /**
     * Get default boot preferences
     * 
     * @return array Default boot configuration
     */
    private function getDefaultBootPreferences(): array
    {
        return [
            'boot_duration' => 4000,
            'return_boot_duration' => 2000,
            'skip_boot_on_return' => false,
            'quick_boot' => false,
            'allow_boot_skip' => true,
            'boot_theme' => 'dark',
            'enable_animations' => true,
            'show_loading_details' => true,
            'preload_wallpapers' => true
        ];
    }
    
    /**
     * Get preferences for specific category
     * 
     * @param string $category Preference category (desktop, dock, terminal, etc.)
     * @return array Category-specific preferences
     */
    public function getCategoryPreferences(string $category): array
    {
        try {
            $allPreferences = $this->getAllPreferences();
            
            if (!isset($allPreferences[$category])) {
                Log::warning("Preference category '{$category}' not found");
                return [];
            }
            
            return $allPreferences[$category];
            
        } catch (Exception $e) {
            Log::error("Failed to get category preferences for {$category}: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Update specific preference value with validation
     * 
     * @param string $category Preference category
     * @param string $key Preference key
     * @param mixed $value New preference value
     * @return bool Success status
     */
    public function updatePreference(string $category, string $key, $value): bool
    {
        try {
            // Validate the preference exists in defaults
            if (!$this->isValidPreference($category, $key)) {
                Log::warning("Invalid preference: {$category}.{$key}");
                return false;
            }
            
            // Validate the value
            if (!$this->isValidPreferenceValue($category, $key, $value)) {
                Log::warning("Invalid value for {$category}.{$key}: " . json_encode($value));
                return false;
            }
            
            $userPrefs = $this->dataService->read(self::USER_PREFERENCES_FILE, []);
            
            // Ensure category exists
            if (!isset($userPrefs[$category])) {
                $userPrefs[$category] = [];
            }
            
            // Update the preference
            $userPrefs[$category][$key] = $value;
            
            // Add metadata
            $userPrefs['_metadata'] = [
                'lastUpdated' => now()->toISOString(),
                'version' => '1.0.0'
            ];
            
            return $this->dataService->write(self::USER_PREFERENCES_FILE, $userPrefs);
            
        } catch (Exception $e) {
            Log::error("Failed to update preference {$category}.{$key}: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Update multiple preferences at once
     * 
     * @param array $preferences Associative array of category.key => value
     * @return array Results with success status for each preference
     */
    public function updateMultiplePreferences(array $preferences): array
    {
        $results = [];
        
        try {
            foreach ($preferences as $path => $value) {
                $parts = explode('.', $path, 2);
                
                if (count($parts) !== 2) {
                    $results[$path] = ['success' => false, 'error' => 'Invalid preference path'];
                    continue;
                }
                
                [$category, $key] = $parts;
                $success = $this->updatePreference($category, $key, $value);
                
                $results[$path] = [
                    'success' => $success,
                    'error' => $success ? null : 'Update failed'
                ];
            }
            
            return $results;
            
        } catch (Exception $e) {
            Log::error("Failed to update multiple preferences: " . $e->getMessage());
            
            // Return error for all preferences
            foreach (array_keys($preferences) as $path) {
                $results[$path] = ['success' => false, 'error' => $e->getMessage()];
            }
            
            return $results;
        }
    }
    
    /**
     * Reset preferences to defaults for specific category
     * 
     * @param string $category Category to reset
     * @return bool Success status
     */
    public function resetCategoryToDefaults(string $category): bool
    {
        try {
            $userPrefs = $this->dataService->read(self::USER_PREFERENCES_FILE, []);
            
            // Remove the category from user preferences
            unset($userPrefs[$category]);
            
            // Update metadata
            $userPrefs['_metadata'] = [
                'lastUpdated' => now()->toISOString(),
                'version' => '1.0.0',
                'resetCategories' => array_merge(
                    $userPrefs['_metadata']['resetCategories'] ?? [],
                    [$category => now()->toISOString()]
                )
            ];
            
            return $this->dataService->write(self::USER_PREFERENCES_FILE, $userPrefs);
            
        } catch (Exception $e) {
            Log::error("Failed to reset category {$category} to defaults: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Get default preferences from JSON file
     * 
     * @return array Default preferences structure
     */
    private function getDefaultPreferences(): array
    {
        return $this->dataService->read(self::DEFAULTS_FILE, [
            'desktop' => [
                'wallpaper' => 'big-sur',
                'showIconLabels' => true,
                'autoRotateWallpaper' => true,
                'rotationInterval' => 30
            ],
            'dock' => [
                'position' => 'bottom',
                'size' => 'medium',
                'magnification' => true,
                'autohide' => false
            ],
            'terminal' => [
                'theme' => 'matrix',
                'fontSize' => 14,
                'fontFamily' => 'Menlo, Monaco, monospace'
            ]
        ]);
    }
    
    /**
     * Validate if preference exists in defaults
     * 
     * @param string $category Preference category
     * @param string $key Preference key
     * @return bool Whether preference is valid
     */
    private function isValidPreference(string $category, string $key): bool
    {
        $defaults = $this->getDefaultPreferences();
        return isset($defaults[$category][$key]);
    }
    
    /**
     * Validate preference value against expected type and constraints
     * 
     * @param string $category Preference category
     * @param string $key Preference key
     * @param mixed $value Value to validate
     * @return bool Whether value is valid
     */
    private function isValidPreferenceValue(string $category, string $key, $value): bool
    {
        try {
            $defaults = $this->getDefaultPreferences();
            $defaultValue = $defaults[$category][$key] ?? null;
            
            if ($defaultValue === null) {
                return false;
            }
            
            // Type validation
            $expectedType = gettype($defaultValue);
            $actualType = gettype($value);
            
            if ($expectedType !== $actualType) {
                return false;
            }
            
            // Additional validation based on preference
            return $this->validateSpecificPreference($category, $key, $value);
            
        } catch (Exception $e) {
            Log::error("Failed to validate preference value: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Specific validation rules for certain preferences
     * 
     * @param string $category Preference category
     * @param string $key Preference key
     * @param mixed $value Value to validate
     * @return bool Whether value passes specific validation
     */
    private function validateSpecificPreference(string $category, string $key, $value): bool
    {
        // Dock position validation
        if ($category === 'dock' && $key === 'position') {
            return in_array($value, ['bottom', 'left', 'right']);
        }
        
        // Dock size validation
        if ($category === 'dock' && $key === 'size') {
            return in_array($value, ['small', 'medium', 'large']);
        }
        
        // Terminal font size validation
        if ($category === 'terminal' && $key === 'fontSize') {
            return is_integer($value) && $value >= 10 && $value <= 24;
        }
        
        // Wallpaper rotation interval validation
        if ($category === 'desktop' && $key === 'rotationInterval') {
            return is_integer($value) && $value >= 5 && $value <= 120;
        }
        
        return true;
    }
    
    /**
     * Deep merge user preferences with defaults
     * 
     * @param array $defaults Default preferences
     * @param array $userPrefs User preferences
     * @return array Merged preferences
     */
    private function mergePreferences(array $defaults, array $userPrefs): array
    {
        $merged = $defaults;
        
        foreach ($userPrefs as $category => $preferences) {
            if ($category === '_metadata') {
                continue; // Skip metadata
            }
            
            if (isset($merged[$category]) && is_array($preferences)) {
                foreach ($preferences as $key => $value) {
                    if (isset($merged[$category][$key])) {
                        $merged[$category][$key] = $value;
                    }
                }
            }
        }
        
        return $merged;
    }
    
    /**
     * Get a specific preference value using dot notation
     * 
     * @param string $key Dot notation key (e.g. 'desktop.wallpaper.current_id')
     * @param mixed $default Default value if key not found
     * @return mixed Preference value or default
     */
    public function get(string $key, $default = null)
    {
        try {
            $allPreferences = $this->getAllPreferences();
            
            // Handle dot notation
            $keys = explode('.', $key);
            $value = $allPreferences;
            
            foreach ($keys as $segment) {
                if (is_array($value) && array_key_exists($segment, $value)) {
                    $value = $value[$segment];
                } else {
                    return $default;
                }
            }
            
            return $value;
            
        } catch (Exception $e) {
            Log::error("Failed to get preference '{$key}': " . $e->getMessage());
            return $default;
        }
    }
    
    /**
     * Set a specific preference value using dot notation
     * 
     * @param string $key Dot notation key (e.g. 'desktop.wallpaper.current_id')
     * @param mixed $value Value to set
     * @return bool Success status
     */
    public function set(string $key, $value): bool
    {
        try {
            $userPrefs = $this->dataService->read(self::USER_PREFERENCES_FILE, []);
            
            // Handle dot notation for setting nested values
            $keys = explode('.', $key);
            $current = &$userPrefs;
            
            // Navigate to the parent of the final key
            for ($i = 0; $i < count($keys) - 1; $i++) {
                $segment = $keys[$i];
                if (!isset($current[$segment]) || !is_array($current[$segment])) {
                    $current[$segment] = [];
                }
                $current = &$current[$segment];
            }
            
            // Set the final value
            $finalKey = end($keys);
            $current[$finalKey] = $value;
            
            // Save the updated preferences
            $success = $this->dataService->write(self::USER_PREFERENCES_FILE, $userPrefs);
            
            if ($success) {
                Log::info("Preference set: {$key} = " . json_encode($value));
            }
            
            return $success;
            
        } catch (Exception $e) {
            Log::error("Failed to set preference '{$key}': " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Check if a preference key exists
     * 
     * @param string $key Dot notation key
     * @return bool True if key exists
     */
    public function has(string $key): bool
    {
        try {
            $allPreferences = $this->getAllPreferences();
            
            $keys = explode('.', $key);
            $value = $allPreferences;
            
            foreach ($keys as $segment) {
                if (is_array($value) && array_key_exists($segment, $value)) {
                    $value = $value[$segment];
                } else {
                    return false;
                }
            }
            
            return true;
            
        } catch (Exception $e) {
            return false;
        }
    }
}