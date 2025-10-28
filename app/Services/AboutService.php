<?php

namespace App\Services;

use App\Contracts\DataServiceInterface;
use Illuminate\Support\Facades\Log;

/**
 * AboutService - Manages personal profile data
 * 
 * Handles loading and processing personal information, skills,
 * experience, education data from about.json
 */
class AboutService
{
    protected DataServiceInterface $dataService;
    protected array $aboutData;

    /**
     * Constructor - Initialize service with data loader
     */
    public function __construct(DataServiceInterface $dataService)
    {
        $this->dataService = $dataService;
        $this->loadAboutData();
    }

    /**
     * Load about data from JSON file
     */
    protected function loadAboutData(): void
    {
        try {
            $this->aboutData = $this->dataService->read('about', $this->getDefaultAboutData());
        } catch (\Exception $e) {
            Log::error('Failed to load about data: ' . $e->getMessage());
            $this->aboutData = $this->getDefaultAboutData();
        }
    }

    /**
     * Get all about data with metadata
     */
    public function getAll(): array
    {
        $data = $this->aboutData;
        
        // Ensure _metadata exists
        if (!isset($data['_metadata'])) {
            $data['_metadata'] = [
                'version' => '1.0.0',
                'lastUpdated' => now()->toIso8601String(),
                'source' => 'about.json'
            ];
        }
        
        return $data;
    }

    /**
     * Get personal profile information
     */
    public function getProfile(): array
    {
        return $this->aboutData['personal'] ?? [];
    }

    /**
     * Get social media links
     */
    public function getSocial(): array
    {
        return $this->aboutData['social'] ?? [];
    }

    /**
     * Get skills organized by category
     */
    public function getSkills(): array
    {
        return $this->aboutData['skills'] ?? [];
    }

    /**
     * Get work experience timeline
     */
    public function getExperience(): array
    {
        return $this->aboutData['experience'] ?? [];
    }

    /**
     * Get education background
     */
    public function getEducation(): array
    {
        return $this->aboutData['education'] ?? [];
    }

    /**
     * Get certifications and achievements
     */
    public function getCertifications(): array
    {
        return $this->aboutData['certifications'] ?? [];
    }

    /**
     * Get GitHub statistics (if available)
     */
    public function getGitHubStats(): array
    {
        return $this->aboutData['social']['github'] ?? [];
    }

    /**
     * Get profile summary for quick display
     */
    public function getSummary(): array
    {
        $profile = $this->getProfile();
        $social = $this->getSocial();
        
        return [
            'name' => $profile['name'] ?? '',
            'title' => $profile['title'] ?? '',
            'bio' => $profile['bio'] ?? '',
            'avatar' => $profile['profileImage'] ?? '',
            'status' => 'available',
            'socialLinks' => [
                'github' => $social['github']['url'] ?? '',
                'linkedin' => $social['linkedin']['url'] ?? '',
                'twitter' => $social['twitter']['url'] ?? '',
            ]
        ];
    }

    /**
     * Default about data structure
     */
    protected function getDefaultAboutData(): array
    {
        return [
            'personal' => [
                'name' => 'Abdulmelik Saylan',
                'title' => 'Full-Stack Developer',
                'bio' => 'Passionate developer creating amazing experiences.',
                'profileImage' => '/images/default-avatar.jpg'
            ],
            'skills' => [],
            'experience' => [],
            'education' => [],
            'social' => []
        ];
    }
}
