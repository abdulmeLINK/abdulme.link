<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Session;

/**
 * LoadingService - Boot sequence and session management
 * Handles dynamic boot animation, session persistence, and loading states
 */
class LoadingService
{
    private DataService $dataService;
    private const LOADING_MESSAGES_FILE = 'loading-messages';
    private const SESSION_KEY = 'desktop_session';
    
    public function __construct(DataService $dataService)
    {
        $this->dataService = $dataService;
    }
    
    /**
     * Get loading sequence configuration based on session state
     * 
     * @return array Loading sequence data with messages and timing
     */
    public function getLoadingSequence(): array
    {
        try {
            $sessionData = $this->getSessionData();
            $shouldShowBoot = $this->shouldShowBootSequence($sessionData);
            
            return [
                'showBoot' => $shouldShowBoot,
                'duration' => $shouldShowBoot ? 4000 : 1000, // 4s full boot, 1s quick load
                'messages' => $this->getLoadingMessages(),
                'profileImage' => $this->getProfileImageUrl(),
                'sessionId' => $sessionData['sessionId'],
                'lastVisit' => $sessionData['lastVisit'] ?? null,
                'visitCount' => $sessionData['visitCount'] ?? 1
            ];
            
        } catch (Exception $e) {
            Log::error("Failed to get loading sequence: " . $e->getMessage());
            return $this->getDefaultLoadingSequence();
        }
    }
    
    /**
     * Get contextual loading messages from JSON file
     * 
     * @return array Complete loading messages data structure
     */
    public function getLoadingMessages(): array
    {
        try {
            $messages = $this->dataService->read(self::LOADING_MESSAGES_FILE, []);
            
            // Return the complete data structure including personal_touches
            if (!empty($messages)) {
                return $messages;
            }
            
            // Fallback to default structure if file is empty
            return $this->getDefaultMessages();
            
        } catch (Exception $e) {
            Log::error("Failed to get loading messages: " . $e->getMessage());
            return $this->getDefaultMessages();
        }
    }
    
    /**
     * Update session data after successful boot
     * 
     * @return bool Success status
     */
    public function updateSessionAfterBoot(): bool
    {
        try {
            $sessionData = $this->getSessionData();
            
            $newSessionData = [
                'sessionId' => $sessionData['sessionId'],
                'lastVisit' => now()->toISOString(),
                'visitCount' => $sessionData['visitCount'] + 1,
                'hasBooted' => true,
                'bootTimestamp' => now()->timestamp
            ];
            
            Session::put(self::SESSION_KEY, $newSessionData);
            
            Log::info("Updated session after boot completion");
            return true;
            
        } catch (Exception $e) {
            Log::error("Failed to update session after boot: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Get current session data or create new session
     * 
     * @return array Session data with ID and metadata
     */
    private function getSessionData(): array
    {
        try {
            $sessionData = Session::get(self::SESSION_KEY);
            
            if (!$sessionData || !isset($sessionData['sessionId'])) {
                $sessionData = [
                    'sessionId' => $this->generateSessionId(),
                    'visitCount' => 1,
                    'hasBooted' => false,
                    'createdAt' => now()->toISOString()
                ];
                
                Session::put(self::SESSION_KEY, $sessionData);
            }
            
            return $sessionData;
            
        } catch (Exception $e) {
            Log::error("Failed to get session data: " . $e->getMessage());
            return [
                'sessionId' => $this->generateSessionId(),
                'visitCount' => 1,
                'hasBooted' => false
            ];
        }
    }
    
    /**
     * Determine if boot sequence should be shown
     * 
     * @param array $sessionData Current session data
     * @return bool Whether to show full boot sequence
     */
    private function shouldShowBootSequence(array $sessionData): bool
    {
        // Show boot on first visit or if more than 30 minutes have passed
        if (!isset($sessionData['lastVisit']) || !isset($sessionData['bootTimestamp'])) {
            return true;
        }
        
        $lastBootTime = $sessionData['bootTimestamp'] ?? 0;
        $thirtyMinutesAgo = now()->timestamp - (30 * 60);
        
        return $lastBootTime < $thirtyMinutesAgo;
    }
    
    /**
     * Generate unique session ID
     * 
     * @return string Unique session identifier
     */
    private function generateSessionId(): string
    {
        return 'desktop_' . uniqid() . '_' . now()->timestamp;
    }
    
    /**
     * Get profile image URL
     * 
     * @return string Profile image URL
     */
    private function getProfileImageUrl(): string
    {
        return asset('images/abdulmelik_saylan.jpg');
    }
    
    /**
     * Get default loading messages if file fails
     * 
     * @return array Default loading messages
     */
    private function getDefaultMessages(): array
    {
        return [
            ['text' => 'Initializing desktop...', 'delay' => 0, 'duration' => 700],
            ['text' => 'Loading wallpapers...', 'delay' => 800, 'duration' => 700],
            ['text' => 'Preparing workspace...', 'delay' => 1600, 'duration' => 700],
            ['text' => 'Almost ready...', 'delay' => 2400, 'duration' => 700],
            ['text' => 'Welcome!', 'delay' => 3200, 'duration' => 700]
        ];
    }
    
    /**
     * Get default loading sequence if everything fails
     * 
     * @return array Default loading configuration
     */
    private function getDefaultLoadingSequence(): array
    {
        return [
            'showBoot' => true,
            'duration' => 4000,
            'messages' => $this->getDefaultMessages(),
            'profileImage' => $this->getProfileImageUrl(),
            'sessionId' => $this->generateSessionId(),
            'lastVisit' => null,
            'visitCount' => 1
        ];
    }
    
    /**
     * Get loading progress based on actual asset loading
     * 
     * @param array $loadedAssets Array of loaded assets
     * @param array $totalAssets Array of all assets to load
     * @return array Progress data with percentage and current step
     */
    public function calculateLoadingProgress(array $loadedAssets, array $totalAssets): array
    {
        try {
            $totalCount = count($totalAssets);
            $loadedCount = count($loadedAssets);
            
            if ($totalCount === 0) {
                return ['percentage' => 100, 'currentStep' => 'Complete', 'loaded' => 0, 'total' => 0];
            }
            
            $percentage = min(100, round(($loadedCount / $totalCount) * 100));
            $currentStep = $this->getCurrentLoadingStep($percentage);
            
            return [
                'percentage' => $percentage,
                'currentStep' => $currentStep,
                'loaded' => $loadedCount,
                'total' => $totalCount,
                'remaining' => $totalCount - $loadedCount
            ];
            
        } catch (Exception $e) {
            Log::error("Failed to calculate loading progress: " . $e->getMessage());
            return ['percentage' => 0, 'currentStep' => 'Initializing...', 'loaded' => 0, 'total' => 1];
        }
    }
    
    /**
     * Get current loading step description based on progress
     * 
     * @param int $percentage Loading percentage (0-100)
     * @return string Current step description
     */
    private function getCurrentLoadingStep(int $percentage): string
    {
        if ($percentage < 20) return 'Initializing desktop...';
        if ($percentage < 40) return 'Loading wallpapers...';
        if ($percentage < 60) return 'Preparing components...';
        if ($percentage < 80) return 'Setting up workspace...';
        if ($percentage < 100) return 'Almost ready...';
        return 'Welcome!';
    }
}