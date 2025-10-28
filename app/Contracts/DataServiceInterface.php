<?php

namespace App\Contracts;

interface DataServiceInterface
{
    /**
     * Read JSON data from storage with validation
     */
    public function read(string $filename, array $defaultData = []): array;

    /**
     * Write data to JSON file with validation and backup
     */
    public function write(string $filename, array $data): bool;

    /**
     * Validate JSON data structure
     */
    public function validate(array $data, array $rules): bool;

    /**
     * Create backup of existing file before writing
     */
    public function backup(string $filename): bool;

    /**
     * Get file statistics and metadata
     */
    public function getFileStats(string $filename): array;
}