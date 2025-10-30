<?php

namespace App\Http\Controllers;

use App\Contracts\PortfolioServiceInterface;
use App\Http\Resources\ProjectResource;
use App\Http\Resources\ProjectCollection;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

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

            $response = response()->json([
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

            Log::info('PortfolioController::index() - Successfully returned portfolio projects', [
                'total_projects' => $data['totalProjects'] ?? 0,
                'response_size' => strlen($response->getContent())
            ]);

            return $response;

        } catch (\Exception $e) {
            Log::error('PortfolioController::index() - Failed to load portfolio projects', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'query_params' => $request->query()
            ]);

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
                Log::warning('PortfolioController::show() - Project not found', [
                    'project_id' => $id,
                    'available_project_ids' => collect($projects['projects'] ?? [])->pluck('id')->toArray()
                ]);

                return response()->json([
                    'success' => false,
                    'error' => 'Project not found'
                ], 404);
            }

            $response = response()->json([
                'success' => true,
                'data' => new ProjectResource($project)
            ]);

            Log::info('PortfolioController::show() - Successfully returned single project', [
                'project_id' => $id,
                'project_title' => $project['title'] ?? 'N/A',
                'response_size' => strlen($response->getContent())
            ]);

            return $response;

        } catch (\Exception $e) {
            Log::error('PortfolioController::show() - Failed to load project', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'project_id' => $id
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to load project',
                'message' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }
}