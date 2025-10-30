<?php

namespace App\Http\Controllers;

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
}