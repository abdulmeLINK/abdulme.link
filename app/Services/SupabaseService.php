<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

/**
 * SupabaseService - Supabase PostgreSQL integration
 * 
 * Handles all Supabase database operations with caching and error handling
 */
class SupabaseService
{
    private string $url;
    private string $key;
    private int $cacheTime = 3600; // 1 hour default cache

    public function __construct()
    {
        $this->url = env('SUPABASE_URL');
        $this->key = env('SUPABASE_SERVICE_KEY');

        if (!$this->url || !$this->key) {
            throw new \Exception('Supabase credentials not configured');
        }
    }

    /**
     * Get about data with caching
     */
    public function getAbout(): ?array
    {
        return Cache::remember('supabase:about', $this->cacheTime, function () {
            return $this->select('about')->first();
        });
    }

    /**
     * Get all portfolio projects
     */
    public function getPortfolioProjects(array $filters = []): array
    {
        $cacheKey = 'supabase:portfolio:' . md5(json_encode($filters));
        
        return Cache::remember($cacheKey, $this->cacheTime, function () use ($filters) {
            $query = $this->select('portfolio_projects');
            
            if (isset($filters['category'])) {
                $query->where('category', 'eq', $filters['category']);
            }
            
            if (isset($filters['featured'])) {
                $query->where('featured', 'eq', $filters['featured']);
            }
            
            return $query->orderBy('order_index')->get();
        });
    }

    /**
     * Get user preferences
     */
    public function getUserPreferences(string $userId = 'default'): ?array
    {
        return Cache::remember("supabase:preferences:{$userId}", $this->cacheTime, function () use ($userId) {
            return $this->select('user_preferences')
                ->where('user_id', 'eq', $userId)
                ->first();
        });
    }

    /**
     * Update user preferences
     */
    public function updateUserPreferences(string $userId, array $preferences): bool
    {
        $result = $this->update('user_preferences', $preferences)
            ->where('user_id', 'eq', $userId)
            ->execute();
        
        if ($result) {
            Cache::forget("supabase:preferences:{$userId}");
        }
        
        return $result;
    }

    /**
     * Get terminal commands
     */
    public function getTerminalCommands(bool $enabledOnly = true): array
    {
        $cacheKey = 'supabase:terminal:' . ($enabledOnly ? 'enabled' : 'all');
        
        return Cache::remember($cacheKey, $this->cacheTime, function () use ($enabledOnly) {
            $query = $this->select('terminal_commands');
            
            if ($enabledOnly) {
                $query->where('enabled', 'eq', true);
            }
            
            return $query->orderBy('order_index')->get();
        });
    }

    /**
     * Get desktop apps
     */
    public function getDesktopApps(): array
    {
        return Cache::remember('supabase:desktop_apps', $this->cacheTime, function () {
            return $this->select('desktop_apps')
                ->orderBy('dock_position')
                ->get();
        });
    }

    /**
     * Get filesystem entries
     */
    public function getFilesystemEntries(string $parentPath = '/'): array
    {
        $cacheKey = 'supabase:filesystem:' . md5($parentPath);
        
        return Cache::remember($cacheKey, $this->cacheTime, function () use ($parentPath) {
            return $this->select('filesystem_entries')
                ->where('parent_path', 'eq', $parentPath)
                ->get();
        });
    }

    /**
     * Get random loading message
     */
    public function getRandomLoadingMessage(string $category = null): ?array
    {
        $query = $this->select('loading_messages')
            ->where('enabled', 'eq', true);
        
        if ($category) {
            $query->where('category', 'eq', $category);
        }
        
        $messages = $query->get();
        
        if (empty($messages)) {
            return null;
        }
        
        return $messages[array_rand($messages)];
    }

    /**
     * Track analytics event
     */
    public function trackEvent(string $eventType, string $eventName, array $eventData = []): bool
    {
        return $this->insert('analytics_events', [
            'event_type' => $eventType,
            'event_name' => $eventName,
            'event_data' => $eventData,
            'user_agent' => request()->header('User-Agent'),
            'ip_address' => request()->ip(),
            'session_id' => session()->getId()
        ]);
    }

    /**
     * Track terminal command usage
     */
    public function trackTerminalCommand(string $command, array $args = [], int $executionTime = 0, bool $success = true): bool
    {
        return $this->insert('terminal_analytics', [
            'command' => $command,
            'args' => $args,
            'execution_time_ms' => $executionTime,
            'success' => $success,
            'session_id' => session()->getId()
        ]);
    }

    /**
     * Track app launch
     */
    public function trackAppLaunch(string $appId, string $appName, string $launchMethod = 'dock'): bool
    {
        return $this->insert('app_analytics', [
            'app_id' => $appId,
            'app_name' => $appName,
            'launch_method' => $launchMethod,
            'session_id' => session()->getId()
        ]);
    }

    /**
     * Get analytics summary
     */
    public function getAnalyticsSummary(): ?array
    {
        try {
            $response = Http::withHeaders($this->getHeaders())
                ->get("{$this->url}/rest/v1/rpc/get_analytics_summary");

            return $response->successful() ? $response->json() : null;
        } catch (\Exception $e) {
            Log::error("Failed to get analytics summary: {$e->getMessage()}");
            return null;
        }
    }

    /**
     * Get terminal command statistics
     */
    public function getTerminalStats(string $startDate = null, string $endDate = null): array
    {
        try {
            $params = [
                'start_date' => $startDate ?? now()->subDays(30)->toIso8601String(),
                'end_date' => $endDate ?? now()->toIso8601String()
            ];

            $response = Http::withHeaders($this->getHeaders())
                ->post("{$this->url}/rest/v1/rpc/get_terminal_command_stats", $params);

            return $response->successful() ? $response->json() : [];
        } catch (\Exception $e) {
            Log::error("Failed to get terminal stats: {$e->getMessage()}");
            return [];
        }
    }

    /**
     * Clear all cache
     */
    public function clearCache(): void
    {
        $keys = [
            'supabase:about',
            'supabase:portfolio:*',
            'supabase:preferences:*',
            'supabase:terminal:*',
            'supabase:desktop_apps',
            'supabase:filesystem:*'
        ];

        foreach ($keys as $key) {
            if (str_contains($key, '*')) {
                Cache::flush(); // Flush all if wildcard
                break;
            }
            Cache::forget($key);
        }
    }

    // ==================== Query Builder Methods ====================

    /**
     * Start a SELECT query
     */
    private function select(string $table): SupabaseQueryBuilder
    {
        return new SupabaseQueryBuilder($this->url, $this->key, $table, 'GET');
    }

    /**
     * Insert data
     */
    private function insert(string $table, array $data): bool
    {
        try {
            $response = Http::withHeaders($this->getHeaders())
                ->post("{$this->url}/rest/v1/{$table}", $data);

            return $response->successful();
        } catch (\Exception $e) {
            Log::error("Supabase insert failed: {$e->getMessage()}");
            return false;
        }
    }

    /**
     * Start an UPDATE query
     */
    private function update(string $table, array $data): SupabaseQueryBuilder
    {
        return new SupabaseQueryBuilder($this->url, $this->key, $table, 'PATCH', $data);
    }

    /**
     * Start a DELETE query
     */
    private function delete(string $table): SupabaseQueryBuilder
    {
        return new SupabaseQueryBuilder($this->url, $this->key, $table, 'DELETE');
    }

    /**
     * Get request headers
     */
    private function getHeaders(): array
    {
        return [
            'apikey' => $this->key,
            'Authorization' => "Bearer {$this->key}",
            'Content-Type' => 'application/json',
            'Prefer' => 'return=representation'
        ];
    }
}

/**
 * SupabaseQueryBuilder - Fluent query builder for Supabase REST API
 */
class SupabaseQueryBuilder
{
    private string $url;
    private string $key;
    private string $table;
    private string $method;
    private array $data = [];
    private array $filters = [];
    private ?string $orderByField = null;
    private string $orderDirection = 'asc';
    private ?int $limit = null;

    public function __construct(string $url, string $key, string $table, string $method, array $data = [])
    {
        $this->url = $url;
        $this->key = $key;
        $this->table = $table;
        $this->method = $method;
        $this->data = $data;
    }

    /**
     * Add WHERE condition
     */
    public function where(string $field, string $operator, $value): self
    {
        $this->filters[] = "{$field}={$operator}.{$value}";
        return $this;
    }

    /**
     * Add ORDER BY
     */
    public function orderBy(string $field, string $direction = 'asc'): self
    {
        $this->orderByField = $field;
        $this->orderDirection = $direction;
        return $this;
    }

    /**
     * Add LIMIT
     */
    public function limit(int $limit): self
    {
        $this->limit = $limit;
        return $this;
    }

    /**
     * Execute query and get all results
     */
    public function get(): array
    {
        $response = $this->executeRequest();
        return $response ? $response->json() : [];
    }

    /**
     * Execute query and get first result
     */
    public function first(): ?array
    {
        $this->limit = 1;
        $results = $this->get();
        return !empty($results) ? $results[0] : null;
    }

    /**
     * Execute update/delete query
     */
    public function execute(): bool
    {
        $response = $this->executeRequest();
        return $response ? $response->successful() : false;
    }

    /**
     * Execute HTTP request
     */
    private function executeRequest()
    {
        try {
            $queryString = $this->buildQueryString();
            $url = "{$this->url}/rest/v1/{$this->table}{$queryString}";

            $headers = [
                'apikey' => $this->key,
                'Authorization' => "Bearer {$this->key}",
                'Content-Type' => 'application/json'
            ];

            $http = Http::withHeaders($headers);

            return match($this->method) {
                'GET' => $http->get($url),
                'POST' => $http->post($url, $this->data),
                'PATCH' => $http->patch($url, $this->data),
                'DELETE' => $http->delete($url),
                default => null
            };
        } catch (\Exception $e) {
            Log::error("Supabase query failed: {$e->getMessage()}");
            return null;
        }
    }

    /**
     * Build query string from filters
     */
    private function buildQueryString(): string
    {
        $params = [];

        if (!empty($this->filters)) {
            $params = array_merge($params, $this->filters);
        }

        if ($this->orderByField) {
            $params[] = "order={$this->orderByField}.{$this->orderDirection}";
        }

        if ($this->limit) {
            $params[] = "limit={$this->limit}";
        }

        return !empty($params) ? '?' . implode('&', $params) : '';
    }
}
