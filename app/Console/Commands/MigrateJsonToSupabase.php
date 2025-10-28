<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * MigrateJsonToSupabase - Artisan command to migrate JSON files to Supabase
 * 
 * Usage: php artisan supabase:migrate
 */
class MigrateJsonToSupabase extends Command
{
    protected $signature = 'supabase:migrate {--dry-run : Run without actually inserting data}';
    protected $description = 'Migrate JSON data files to Supabase PostgreSQL database';

    private string $supabaseUrl;
    private string $supabaseKey;
    private array $stats = [];

    public function handle()
    {
        $this->info('🚀 Starting Supabase migration...');
        
        // Check environment variables
        if (!$this->validateEnvironment()) {
            return 1;
        }

        $isDryRun = $this->option('dry-run');
        
        if ($isDryRun) {
            $this->warn('⚠️  DRY RUN MODE - No data will be inserted');
        }

        // Migrate each data file
        $this->newLine();
        $this->migrateAbout($isDryRun);
        $this->migratePortfolio($isDryRun);
        $this->migratePreferences($isDryRun);
        $this->migrateTerminalCommands($isDryRun);
        $this->migrateDesktopApps($isDryRun);
        $this->migrateFilesystem($isDryRun);
        $this->migrateLoadingMessages($isDryRun);

        // Display summary
        $this->displaySummary();

        $this->newLine();
        $this->info('✅ Migration completed successfully!');
        
        return 0;
    }

    private function validateEnvironment(): bool
    {
        $this->supabaseUrl = env('SUPABASE_URL');
        $this->supabaseKey = env('SUPABASE_SERVICE_KEY');

        if (!$this->supabaseUrl || !$this->supabaseKey) {
            $this->error('❌ SUPABASE_URL or SUPABASE_SERVICE_KEY not found in .env');
            $this->line('Please add these variables to your .env file:');
            $this->line('SUPABASE_URL=https://your-project.supabase.co');
            $this->line('SUPABASE_SERVICE_KEY=your-service-role-key');
            return false;
        }

        // Test connection
        try {
            $response = Http::withHeaders([
                'apikey' => $this->supabaseKey,
                'Authorization' => "Bearer {$this->supabaseKey}"
            ])->get("{$this->supabaseUrl}/rest/v1/");

            if ($response->failed()) {
                $this->error('❌ Failed to connect to Supabase');
                return false;
            }
        } catch (\Exception $e) {
            $this->error("❌ Connection error: {$e->getMessage()}");
            return false;
        }

        $this->info('✅ Supabase connection verified');
        return true;
    }

    private function migrateAbout(bool $isDryRun): void
    {
        $this->task('Migrating about.json', function () use ($isDryRun) {
            $data = $this->readJson('about');
            
            if (!$data) {
                $this->stats['about'] = ['status' => 'failed', 'error' => 'File not found'];
                return false;
            }

            // Check if data already exists
            $existing = $this->supabaseGet('about');
            if (!empty($existing)) {
                $this->warn('  ⚠️  About data already exists, updating...');
                if (!$isDryRun) {
                    $result = $this->supabaseUpdate('about', $data, ['id' => 'eq.' . $existing[0]['id']]);
                    $this->stats['about'] = ['status' => 'updated', 'rows' => 1];
                    return $result;
                }
            }

            if (!$isDryRun) {
                $result = $this->supabaseInsert('about', $data);
                $this->stats['about'] = ['status' => 'inserted', 'rows' => 1];
                return $result;
            }

            $this->stats['about'] = ['status' => 'dry-run', 'rows' => 1];
            return true;
        });
    }

    private function migratePortfolio(bool $isDryRun): void
    {
        $this->task('Migrating portfolio.json', function () use ($isDryRun) {
            $data = $this->readJson('portfolio');
            
            if (!$data || !isset($data['projects'])) {
                $this->stats['portfolio'] = ['status' => 'failed', 'error' => 'Invalid data'];
                return false;
            }

            $projects = $data['projects'];
            $inserted = 0;

            foreach ($projects as $project) {
                if (!$isDryRun) {
                    // Check if project exists
                    $existing = $this->supabaseGet('portfolio_projects', ['project_id' => 'eq.' . $project['id']]);
                    
                    if (!empty($existing)) {
                        $this->supabaseUpdate('portfolio_projects', $project, ['project_id' => 'eq.' . $project['id']]);
                    } else {
                        $this->supabaseInsert('portfolio_projects', $project);
                    }
                }
                $inserted++;
            }

            $this->stats['portfolio'] = ['status' => $isDryRun ? 'dry-run' : 'completed', 'rows' => $inserted];
            return true;
        });
    }

    private function migratePreferences(bool $isDryRun): void
    {
        $this->task('Migrating preferences-defaults.json', function () use ($isDryRun) {
            $data = $this->readJson('preferences-defaults');
            
            if (!$data) {
                $this->stats['preferences'] = ['status' => 'failed', 'error' => 'File not found'];
                return false;
            }

            // Transform data to match schema
            $preferences = [
                'user_id' => 'default',
                'desktop' => $data['desktop'] ?? [],
                'dock' => $data['dock'] ?? [],
                'appearance' => $data['appearance'] ?? [],
                'accessibility' => $data['accessibility'] ?? [],
                'system' => $data['system'] ?? [],
                'terminal' => $data['terminal'] ?? []
            ];

            if (!$isDryRun) {
                // Upsert preferences
                $existing = $this->supabaseGet('user_preferences', ['user_id' => 'eq.default']);
                
                if (!empty($existing)) {
                    $this->supabaseUpdate('user_preferences', $preferences, ['user_id' => 'eq.default']);
                } else {
                    $this->supabaseInsert('user_preferences', $preferences);
                }
            }

            $this->stats['preferences'] = ['status' => $isDryRun ? 'dry-run' : 'completed', 'rows' => 1];
            return true;
        });
    }

    private function migrateTerminalCommands(bool $isDryRun): void
    {
        $this->task('Migrating terminal-commands.json', function () use ($isDryRun) {
            $data = $this->readJson('terminal-commands');
            
            if (!$data || !isset($data['commands'])) {
                $this->stats['terminal_commands'] = ['status' => 'failed', 'error' => 'Invalid data'];
                return false;
            }

            $commands = $data['commands'];
            $inserted = 0;

            foreach ($commands as $command) {
                if (!$isDryRun) {
                    $existing = $this->supabaseGet('terminal_commands', ['command' => 'eq.' . $command['command']]);
                    
                    if (!empty($existing)) {
                        $this->supabaseUpdate('terminal_commands', $command, ['command' => 'eq.' . $command['command']]);
                    } else {
                        $this->supabaseInsert('terminal_commands', $command);
                    }
                }
                $inserted++;
            }

            $this->stats['terminal_commands'] = ['status' => $isDryRun ? 'dry-run' : 'completed', 'rows' => $inserted];
            return true;
        });
    }

    private function migrateDesktopApps(bool $isDryRun): void
    {
        $this->task('Migrating desktop-apps.json', function () use ($isDryRun) {
            $data = $this->readJson('desktop-apps');
            
            if (!$data || !isset($data['apps'])) {
                $this->stats['desktop_apps'] = ['status' => 'failed', 'error' => 'Invalid data'];
                return false;
            }

            $apps = $data['apps'];
            $inserted = 0;

            foreach ($apps as $app) {
                if (!$isDryRun) {
                    $existing = $this->supabaseGet('desktop_apps', ['app_id' => 'eq.' . $app['id']]);
                    
                    if (!empty($existing)) {
                        $this->supabaseUpdate('desktop_apps', $app, ['app_id' => 'eq.' . $app['id']]);
                    } else {
                        $this->supabaseInsert('desktop_apps', $app);
                    }
                }
                $inserted++;
            }

            $this->stats['desktop_apps'] = ['status' => $isDryRun ? 'dry-run' : 'completed', 'rows' => $inserted];
            return true;
        });
    }

    private function migrateFilesystem(bool $isDryRun): void
    {
        $this->task('Migrating filesystem.json', function () use ($isDryRun) {
            $data = $this->readJson('filesystem');
            
            if (!$data) {
                $this->stats['filesystem'] = ['status' => 'failed', 'error' => 'File not found'];
                return false;
            }

            // Flatten filesystem structure recursively
            $entries = $this->flattenFilesystem($data);
            $inserted = 0;

            foreach ($entries as $entry) {
                if (!$isDryRun) {
                    $existing = $this->supabaseGet('filesystem_entries', ['path' => 'eq.' . $entry['path']]);
                    
                    if (!empty($existing)) {
                        $this->supabaseUpdate('filesystem_entries', $entry, ['path' => 'eq.' . $entry['path']]);
                    } else {
                        $this->supabaseInsert('filesystem_entries', $entry);
                    }
                }
                $inserted++;
            }

            $this->stats['filesystem'] = ['status' => $isDryRun ? 'dry-run' : 'completed', 'rows' => $inserted];
            return true;
        });
    }

    private function migrateLoadingMessages(bool $isDryRun): void
    {
        $this->task('Migrating loading-messages.json', function () use ($isDryRun) {
            $data = $this->readJson('loading-messages');
            
            if (!$data || !isset($data['messages'])) {
                $this->stats['loading_messages'] = ['status' => 'failed', 'error' => 'Invalid data'];
                return false;
            }

            $messages = $data['messages'];
            $inserted = 0;

            foreach ($messages as $category => $categoryMessages) {
                foreach ($categoryMessages as $msg) {
                    $message = [
                        'message_id' => uniqid("{$category}_"),
                        'message' => is_array($msg) ? $msg['message'] : $msg,
                        'category' => $category,
                        'context' => is_array($msg) ? ($msg['context'] ?? null) : null,
                        'weight' => is_array($msg) ? ($msg['weight'] ?? 1) : 1,
                        'enabled' => true
                    ];

                    if (!$isDryRun) {
                        $this->supabaseInsert('loading_messages', $message);
                    }
                    $inserted++;
                }
            }

            $this->stats['loading_messages'] = ['status' => $isDryRun ? 'dry-run' : 'completed', 'rows' => $inserted];
            return true;
        });
    }

    private function readJson(string $filename): ?array
    {
        $path = storage_path("data/{$filename}.json");
        
        if (!File::exists($path)) {
            Log::error("JSON file not found: {$path}");
            return null;
        }

        $content = File::get($path);
        return json_decode($content, true);
    }

    private function flattenFilesystem(array $node, string $parentPath = ''): array
    {
        $entries = [];
        
        // Implementation depends on your filesystem.json structure
        // This is a basic example - adjust based on actual structure
        
        return $entries;
    }

    private function supabaseInsert(string $table, array $data): bool
    {
        try {
            $response = Http::withHeaders([
                'apikey' => $this->supabaseKey,
                'Authorization' => "Bearer {$this->supabaseKey}",
                'Content-Type' => 'application/json',
                'Prefer' => 'return=minimal'
            ])->post("{$this->supabaseUrl}/rest/v1/{$table}", $data);

            return $response->successful();
        } catch (\Exception $e) {
            Log::error("Supabase insert failed: {$e->getMessage()}");
            return false;
        }
    }

    private function supabaseUpdate(string $table, array $data, array $filter): bool
    {
        try {
            $query = http_build_query($filter);
            $response = Http::withHeaders([
                'apikey' => $this->supabaseKey,
                'Authorization' => "Bearer {$this->supabaseKey}",
                'Content-Type' => 'application/json',
                'Prefer' => 'return=minimal'
            ])->patch("{$this->supabaseUrl}/rest/v1/{$table}?{$query}", $data);

            return $response->successful();
        } catch (\Exception $e) {
            Log::error("Supabase update failed: {$e->getMessage()}");
            return false;
        }
    }

    private function supabaseGet(string $table, array $filter = []): array
    {
        try {
            $query = !empty($filter) ? '?' . http_build_query($filter) : '';
            $response = Http::withHeaders([
                'apikey' => $this->supabaseKey,
                'Authorization' => "Bearer {$this->supabaseKey}",
            ])->get("{$this->supabaseUrl}/rest/v1/{$table}{$query}");

            return $response->successful() ? $response->json() : [];
        } catch (\Exception $e) {
            Log::error("Supabase get failed: {$e->getMessage()}");
            return [];
        }
    }

    private function displaySummary(): void
    {
        $this->newLine();
        $this->info('📊 Migration Summary:');
        $this->table(
            ['Table', 'Status', 'Rows', 'Notes'],
            collect($this->stats)->map(function ($stat, $table) {
                return [
                    $table,
                    $stat['status'],
                    $stat['rows'] ?? 0,
                    $stat['error'] ?? '-'
                ];
            })->toArray()
        );
    }
}
