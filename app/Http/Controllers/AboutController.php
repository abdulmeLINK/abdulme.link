<?php

namespace App\Http\Controllers;

use App\Services\AboutService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * AboutController - Handles About API endpoints
 * 
 * Thin controller for personal profile data
 */
class AboutController extends Controller
{
    protected AboutService $aboutService;

    public function __construct(AboutService $aboutService)
    {
        $this->aboutService = $aboutService;
    }

    /**
     * Get all about data
     */
    public function index(): JsonResponse
    {
        try {
            $data = $this->aboutService->getAll();
            return response()->json([
                'success' => true,
                'data' => $data,
                '_metadata' => $data['_metadata'] ?? ['source' => 'unknown'] // Include data source metadata
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load about data',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get profile summary
     */
    public function summary(): JsonResponse
    {
        try {
            $summary = $this->aboutService->getSummary();
            return response()->json([
                'success' => true,
                'data' => $summary
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load profile summary'
            ], 500);
        }
    }

    /**
     * Get skills data
     */
    public function skills(): JsonResponse
    {
        try {
            $skills = $this->aboutService->getSkills();
            return response()->json([
                'success' => true,
                'data' => $skills
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load skills'
            ], 500);
        }
    }

    /**
     * Get experience timeline
     */
    public function experience(): JsonResponse
    {
        try {
            $experience = $this->aboutService->getExperience();
            return response()->json([
                'success' => true,
                'data' => $experience
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load experience'
            ], 500);
        }
    }

    /**
     * Get education data
     */
    public function education(): JsonResponse
    {
        try {
            $education = $this->aboutService->getEducation();
            return response()->json([
                'success' => true,
                'data' => $education
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load education'
            ], 500);
        }
    }
}
