<?php

namespace App\Http\Controllers;

use App\Contracts\PortfolioServiceInterface;
use App\Http\Resources\ProjectResource;
use App\Http\Resources\ProjectCollection;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

/**
 * Portfolio Controller - Project CRUD operations
 * Thin controller following Laravel best practices
 */
class PortfolioController extends Controller
{
    protected PortfolioServiceInterface $portfolioService;

    public function __construct(PortfolioServiceInterface $portfolioService)
    {
        $this->portfolioService = $portfolioService;
    }

    /**
     * Get all portfolio projects with optional filtering
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $data = $this->portfolioService->getAllProjects();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'data' => $data['projects'], // Direct array, not wrapped in ResourceCollection
                    'meta' => [
                        'total_projects' => $data['totalProjects'],
                        'featured_count' => $data['featuredCount'],
                        'last_updated' => $data['lastUpdated'],
                        'categories' => $data['categories']
                    ]
                ],
                '_metadata' => $data['_metadata'] ?? ['source' => 'unknown'] // Include data source metadata
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to load portfolio projects',
                'message' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Get single project by ID
     */
    public function show(string $id): JsonResponse
    {
        try {
            $projects = $this->portfolioService->getAllProjects();
            $project = collect($projects['projects'])->firstWhere('id', $id);
            
            if (!$project) {
                return response()->json([
                    'success' => false,
                    'error' => 'Project not found'
                ], 404);
            }
            
            return response()->json([
                'success' => true,
                'data' => new ProjectResource($project)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to load project',
                'message' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }
}