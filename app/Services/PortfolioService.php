<?php

namespace App\Services;

use App\Contracts\PortfolioServiceInterface;
use Exception;
use Illuminate\Support\Facades\Log;

/**
 * PortfolioService - Project data management and filtering
 * Handles portfolio projects, categories, and search functionality
 */
class PortfolioService implements PortfolioServiceInterface
{
    private DataService $dataService;
    private const PORTFOLIO_FILE = 'portfolio';
    
    public function __construct(DataService $dataService)
    {
        $this->dataService = $dataService;
    }
    
    /**
     * Get all portfolio projects with metadata
     * 
     * @return array Complete portfolio data with projects and categories
     */
    public function getAllProjects(): array
    {
        try {
            $portfolioData = $this->dataService->read(self::PORTFOLIO_FILE, []);
            
            if (!isset($portfolioData['projects'])) {
                return $this->getDefaultPortfolioData();
            }
            
            // Sort projects by featured status, then by date
            $projects = $portfolioData['projects'];
            usort($projects, function($a, $b) {
                if ($a['featured'] !== $b['featured']) {
                    return $b['featured'] ? 1 : -1; // Featured first
                }
                return strtotime($b['publishedAt']) - strtotime($a['publishedAt']); // Newest first
            });
            
            return [
                'projects' => $projects,
                'categories' => $portfolioData['categories'] ?? $this->getDefaultCategories(),
                'totalProjects' => count($projects),
                'featuredCount' => count(array_filter($projects, fn($p) => $p['featured'])),
                'lastUpdated' => $portfolioData['_metadata']['lastUpdated'] ?? null,
                '_metadata' => $portfolioData['_metadata'] ?? ['source' => 'unknown'] // Pass through metadata from DataService
            ];
            
        } catch (Exception $e) {
            Log::error("Failed to get all projects: " . $e->getMessage());
            return $this->getDefaultPortfolioData();
        }
    }
    
    /**
     * Get projects filtered by category
     * 
     * @param string $category Category to filter by
     * @return array Filtered projects
     */
    public function getProjectsByCategory(string $category): array
    {
        try {
            $allData = $this->getAllProjects();
            
            if ($category === 'all' || empty($category)) {
                return $allData['projects'];
            }
            
            return array_filter($allData['projects'], function($project) use ($category) {
                return $project['category'] === $category;
            });
            
        } catch (Exception $e) {
            Log::error("Failed to get projects by category {$category}: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Get featured projects only
     * 
     * @param int $limit Maximum number of featured projects to return
     * @return array Featured projects
     */
    public function getFeaturedProjects(int $limit = null): array
    {
        try {
            $allData = $this->getAllProjects();
            $featuredProjects = array_filter($allData['projects'], fn($p) => $p['featured']);
            
            if ($limit !== null && $limit > 0) {
                return array_slice($featuredProjects, 0, $limit);
            }
            
            return $featuredProjects;
            
        } catch (Exception $e) {
            Log::error("Failed to get featured projects: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Search projects by title, description, or technologies
     * 
     * @param string $searchTerm Search query
     * @param array $categories Optional category filter
     * @return array Matching projects
     */
    public function searchProjects(string $searchTerm, array $categories = []): array
    {
        try {
            $allData = $this->getAllProjects();
            $searchTerm = strtolower(trim($searchTerm));
            
            if (empty($searchTerm)) {
                $projects = $allData['projects'];
            } else {
                $projects = array_filter($allData['projects'], function($project) use ($searchTerm) {
                    // Search in title
                    if (str_contains(strtolower($project['title']), $searchTerm)) {
                        return true;
                    }
                    
                    // Search in description
                    if (str_contains(strtolower($project['description']), $searchTerm)) {
                        return true;
                    }
                    
                    // Search in technologies
                    $techString = implode(' ', $project['technologies']);
                    if (str_contains(strtolower($techString), $searchTerm)) {
                        return true;
                    }
                    
                    return false;
                });
            }
            
            // Apply category filter if provided
            if (!empty($categories)) {
                $projects = array_filter($projects, function($project) use ($categories) {
                    return in_array($project['category'], $categories);
                });
            }
            
            return array_values($projects); // Re-index array
            
        } catch (Exception $e) {
            Log::error("Failed to search projects with term '{$searchTerm}': " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Get single project by ID
     * 
     * @param string $projectId Project identifier
     * @return array|null Project data or null if not found
     */
    public function getProjectById(string $projectId): ?array
    {
        try {
            $allData = $this->getAllProjects();
            
            foreach ($allData['projects'] as $project) {
                if ($project['id'] === $projectId) {
                    return $project;
                }
            }
            
            return null;
            
        } catch (Exception $e) {
            Log::error("Failed to get project by ID {$projectId}: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Get available project categories
     * 
     * @return array Category definitions with metadata
     */
    public function getCategories(): array
    {
        try {
            $allData = $this->getAllProjects();
            return $allData['categories'];
            
        } catch (Exception $e) {
            Log::error("Failed to get categories: " . $e->getMessage());
            return $this->getDefaultCategories();
        }
    }
    
    /**
     * Get projects statistics
     * 
     * @return array Statistics about portfolio projects
     */
    public function getStatistics(): array
    {
        try {
            $allData = $this->getAllProjects();
            $projects = $allData['projects'];
            
            $categoryStats = [];
            $technologyStats = [];
            
            foreach ($projects as $project) {
                // Count by category
                $category = $project['category'];
                $categoryStats[$category] = ($categoryStats[$category] ?? 0) + 1;
                
                // Count by technology
                foreach ($project['technologies'] as $tech) {
                    $technologyStats[$tech] = ($technologyStats[$tech] ?? 0) + 1;
                }
            }
            
            // Sort technologies by usage
            arsort($technologyStats);
            
            return [
                'totalProjects' => count($projects),
                'featuredProjects' => count(array_filter($projects, fn($p) => $p['featured'])),
                'categoryCounts' => $categoryStats,
                'topTechnologies' => array_slice($technologyStats, 0, 10, true),
                'latestProject' => $projects[0] ?? null // First project (sorted by date)
            ];
            
        } catch (Exception $e) {
            Log::error("Failed to get portfolio statistics: " . $e->getMessage());
            return ['totalProjects' => 0, 'featuredProjects' => 0];
        }
    }
    
    /**
     * Get default portfolio data structure
     * 
     * @return array Default portfolio data
     */
    private function getDefaultPortfolioData(): array
    {
        return [
            'projects' => [],
            'categories' => $this->getDefaultCategories(),
            'totalProjects' => 0,
            'featuredCount' => 0,
            'lastUpdated' => null
        ];
    }
    
    /**
     * Get default category definitions
     * 
     * @return array Default categories with metadata
     */
    private function getDefaultCategories(): array
    {
        return [
            'web' => [
                'id' => 'web',
                'name' => 'Web Development',
                'description' => 'Full-stack web applications and websites',
                'color' => '#3B82F6',
                'icon' => 'globe'
            ],
            'mobile' => [
                'id' => 'mobile',
                'name' => 'Mobile Development',
                'description' => 'iOS and Android applications',
                'color' => '#10B981',
                'icon' => 'device-phone-mobile'
            ],
            'ai' => [
                'id' => 'ai',
                'name' => 'AI & Machine Learning',
                'description' => 'Artificial intelligence and ML projects',
                'color' => '#8B5CF6',
                'icon' => 'cpu-chip'
            ],
            'games' => [
                'id' => 'games',
                'name' => 'Game Development',
                'description' => 'Interactive games and simulations',
                'color' => '#F59E0B',
                'icon' => 'puzzle-piece'
            ],
            'tools' => [
                'id' => 'tools',
                'name' => 'Developer Tools',
                'description' => 'Development utilities and automation',
                'color' => '#EF4444',
                'icon' => 'wrench-screwdriver'
            ],
            'other' => [
                'id' => 'other',
                'name' => 'Other Projects',
                'description' => 'Miscellaneous projects and experiments',
                'color' => '#6B7280',
                'icon' => 'squares-plus'
            ]
        ];
    }
}