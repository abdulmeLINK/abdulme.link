<?php

namespace App\Contracts;

interface PortfolioServiceInterface
{
    /**
     * Get all portfolio projects with metadata
     */
    public function getAllProjects(): array;

    /**
     * Get projects filtered by category
     */
    public function getProjectsByCategory(string $category): array;

    /**
     * Get featured projects only
     */
    public function getFeaturedProjects(int $limit = null): array;

    /**
     * Search projects by title, description, or technologies
     */
    public function searchProjects(string $searchTerm, array $categories = []): array;

    /**
     * Get available project categories
     */
    public function getCategories(): array;

    /**
     * Get portfolio statistics
     */
    public function getStatistics(): array;
}