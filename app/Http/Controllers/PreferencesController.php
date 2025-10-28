<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdatePreferencesRequest;
use App\Services\PreferencesService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

/**
 * Preferences Controller - User settings management
 * Handles 6 categories: Appearance, Desktop, Dock, Terminal, Performance, Privacy
 */
class PreferencesController extends Controller
{
    protected PreferencesService $preferencesService;

    public function __construct(PreferencesService $preferencesService)
    {
        $this->preferencesService = $preferencesService;
    }

    /**
     * Get all user preferences
     */
    public function show(): JsonResponse
    {
        try {
            $preferences = $this->preferencesService->getAllPreferences();
            
            return response()->json([
                'success' => true,
                'data' => $preferences
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to load preferences',
                'message' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Update user preferences
     */
    public function update(UpdatePreferencesRequest $request): JsonResponse
    {
        try {
            $validated = $request->validated();
            
            if (isset($validated['preferences'])) {
                // Bulk update
                $updated = $this->preferencesService->updatePreferences($validated['preferences']);
            } else {
                // Single setting update
                $updated = $this->preferencesService->updatePreference(
                    $validated['category'],
                    $validated['key'],
                    $validated['value']
                );
            }
            
            return response()->json([
                'success' => true,
                'data' => $updated,
                'message' => 'Preferences updated successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to update preferences',
                'message' => config('app.debug') ? $e->getMessage() : null
            ], 400);
        }
    }

    /**
     * Reset preferences to defaults
     */
    public function reset(): JsonResponse
    {
        try {
            $defaults = $this->preferencesService->resetToDefaults();
            
            return response()->json([
                'success' => true,
                'data' => $defaults,
                'message' => 'Preferences reset to defaults'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to reset preferences',
                'message' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }
}