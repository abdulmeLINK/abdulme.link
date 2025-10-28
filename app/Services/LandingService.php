<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Log;

/**
 * LandingService - Aggregates data for landing page
 * Provides SEO-optimized content, portfolio highlights, and profile info
 */
class LandingService
{
    private DataService $dataService;
    private PortfolioService $portfolioService;
    
    public function __construct(
        DataService $dataService,
        PortfolioService $portfolioService
    ) {
        $this->dataService = $dataService;
        $this->portfolioService = $portfolioService;
    }
    
    /**
     * Get all landing page data
     * 
     * @return array Complete landing page data
     */
    public function getLandingData(): array
    {
        try {
            return [
                'profile' => $this->getProfileData(),
                'portfolio' => $this->getPortfolioHighlights(),
                'stats' => $this->getProfileStats(),
                'skills' => $this->getTopSkills(),
                'seo' => $this->getSEOMetadata()
            ];
        } catch (Exception $e) {
            Log::error("Failed to get landing data: " . $e->getMessage());
            return $this->getDefaultLandingData();
        }
    }
    
    /**
     * Get profile information
     * 
     * @return array Profile data
     */
    private function getProfileData(): array
    {
        $aboutData = $this->dataService->read('about', []);
        
        return [
            'name' => $aboutData['personal']['name'] ?? 'Abdulmelik Saylan',
            'title' => $aboutData['personal']['title'] ?? 'Full-Stack Developer',
            'tagline' => $aboutData['personal']['tagline'] ?? 'Building the future, one pixel at a time',
            'bio' => $aboutData['personal']['bio'] ?? '',
            'location' => $aboutData['personal']['location'] ?? 'Istanbul, Turkey',
            'email' => $aboutData['personal']['email'] ?? 'hello@abdulme.link',
            'profileImage' => $aboutData['personal']['profileImage'] ?? '/images/abdulmelik_saylan.jpg',
            'social' => $aboutData['social'] ?? []
        ];
    }
    
    /**
     * Get featured portfolio projects for carousel
     * 
     * @return array Featured projects with images
     */
    private function getPortfolioHighlights(): array
    {
        $allProjects = $this->portfolioService->getAllProjects();
        
        // Get featured projects first, then top non-featured
        $featured = array_filter($allProjects['projects'], fn($p) => $p['featured']);
        $others = array_filter($allProjects['projects'], fn($p) => !$p['featured']);
        
        $highlights = array_merge(
            array_slice($featured, 0, 4),
            array_slice($others, 0, 4)
        );
        
        return array_map(function($project) {
            return [
                'id' => $project['id'],
                'title' => $project['title'],
                'description' => $project['shortDescription'] ?? $project['description'],
                'category' => $project['category'],
                'thumbnail' => $project['thumbnail'] ?? ($project['images'][0] ?? '/images/project-placeholder.jpg'),
                'technologies' => array_slice($project['technologies'], 0, 5),
                'featured' => $project['featured']
            ];
        }, array_slice($highlights, 0, 6));
    }
    
    /**
     * Get profile statistics
     * 
     * @return array Statistics for display
     */
    private function getProfileStats(): array
    {
        $aboutData = $this->dataService->read('about', []);
        $portfolioData = $this->portfolioService->getAllProjects();
        
        // Calculate total years of experience
        $experiences = $aboutData['experience'] ?? [];
        $totalYears = 0;
        
        foreach ($experiences as $exp) {
            $start = strtotime($exp['startDate']);
            $end = $exp['current'] ? time() : strtotime($exp['endDate']);
            $totalYears += ($end - $start) / (365 * 24 * 60 * 60);
        }
        
        return [
            'years_experience' => round($totalYears, 0),
            'projects_completed' => $portfolioData['totalProjects'],
            'technologies' => $this->countTechnologies($aboutData),
            'github_repos' => $aboutData['social']['github']['repositories'] ?? 0
        ];
    }
    
    /**
     * Get top skills for display
     * 
     * @return array Top skills with proficiency
     */
    private function getTopSkills(): array
    {
        $aboutData = $this->dataService->read('about', []);
        $allSkills = [];
        
        // Collect all skills from different categories
        foreach ($aboutData['skills'] ?? [] as $category) {
            foreach ($category['technologies'] ?? [] as $tech) {
                $allSkills[] = [
                    'name' => $tech['name'],
                    'level' => $tech['level'],
                    'proficiency' => $tech['proficiency'] ?? 0,
                    'color' => $category['color']
                ];
            }
        }
        
        // Sort by proficiency and get top 8
        usort($allSkills, fn($a, $b) => $b['proficiency'] - $a['proficiency']);
        
        return array_slice($allSkills, 0, 8);
    }
    
    /**
     * Get SEO metadata
     * 
     * @return array SEO data for meta tags
     */
    private function getSEOMetadata(): array
    {
        $profile = $this->getProfileData();
        
        return [
            'title' => $profile['name'] . ' - ' . $profile['title'],
            'description' => $profile['bio'] ?: 'Portfolio of ' . $profile['name'] . ', a full-stack developer specializing in modern web applications and AI solutions.',
            'keywords' => 'full-stack developer, web development, AI, machine learning, Laravel, React, Vue.js, portfolio',
            'author' => $profile['name'],
            'og_image' => url($profile['profileImage']),
            'og_type' => 'website',
            'twitter_card' => 'summary_large_image'
        ];
    }
    
    /**
     * Count unique technologies across all skills
     * 
     * @param array $aboutData About data
     * @return int Technology count
     */
    private function countTechnologies(array $aboutData): int
    {
        $technologies = [];
        
        foreach ($aboutData['skills'] ?? [] as $category) {
            foreach ($category['technologies'] ?? [] as $tech) {
                $technologies[$tech['name']] = true;
            }
        }
        
        return count($technologies);
    }
    
    /**
     * Get default landing data for fallback
     * 
     * @return array Default data
     */
    private function getDefaultLandingData(): array
    {
        return [
            'profile' => [
                'name' => 'Abdulmelik Saylan',
                'title' => 'Full-Stack Developer',
                'tagline' => 'Building the future, one pixel at a time',
                'bio' => 'Passionate developer creating innovative solutions',
                'location' => 'Istanbul, Turkey',
                'email' => 'hello@abdulme.link',
                'profileImage' => '/images/abdulmelik_saylan.jpg',
                'social' => []
            ],
            'portfolio' => [],
            'stats' => [
                'years_experience' => 6,
                'projects_completed' => 8,
                'technologies' => 20,
                'github_repos' => 89
            ],
            'skills' => [],
            'seo' => [
                'title' => 'Abdulmelik Saylan - Full-Stack Developer',
                'description' => 'Portfolio of a full-stack developer specializing in modern web applications',
                'keywords' => 'full-stack developer, web development, portfolio',
                'author' => 'Abdulmelik Saylan'
            ]
        ];
    }
}
