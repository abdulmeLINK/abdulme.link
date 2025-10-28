<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;

class SyncToSupabase extends Command
{
    protected $signature = 'supabase:sync 
        {--type=data : Type to sync: data, wallpapers, projects, assets, or all}
        {--dry-run : Show what would be uploaded without actually uploading}
        {--force : Overwrite existing files without prompting}';
    
    protected $description = 'Sync local files to Supabase Storage';

    private array $dataFiles = [
        'about.json',
        'portfolio.json',
        'preferences-defaults.json',
        'terminal-commands.json',
        'desktop-apps.json',
        'filesystem.json',
        'loading-messages.json'
    ];

    private array $bucketConfig = [
        'data' => [
            'bucket' => 'portfolio-data',
            'path' => 'storage/data',
            'extensions' => ['json'],
        ],
        'wallpapers' => [
            'bucket' => 'portfolio-assets', // Use assets bucket for wallpapers
            'path' => 'public/images/wallpapers',
            'extensions' => ['jpg', 'jpeg', 'png', 'webp'],
        ],
        'projects' => [
            'bucket' => 'portfolio-projects',
            'path' => 'public/images/projects',
            'extensions' => ['jpg', 'jpeg', 'png', 'webp', 'gif'],
        ],
        'assets' => [
            'bucket' => 'portfolio-assets',
            'path' => 'public/images',
            'extensions' => ['jpg', 'jpeg', 'png', 'webp', 'svg', 'gif'],
        ],
    ];

    public function handle()
    {
        $type = $this->option('type');
        $isDryRun = $this->option('dry-run');
        $force = $this->option('force');

        $this->info('🚀 Starting Supabase Storage sync...');
        $this->newLine();

        if (!$this->validateEnvironment()) {
            return 1;
        }

        if (!in_array($type, ['data', 'wallpapers', 'projects', 'assets', 'all'])) {
            $this->error("❌ Invalid type: {$type}");
            return 1;
        }

        if ($isDryRun) {
            $this->warn('⚠️  DRY RUN MODE');
            $this->newLine();
        }

        $types = $type === 'all' ? ['data', 'wallpapers', 'projects', 'assets'] : [$type];
        $totalUploaded = 0;
        $totalFailed = 0;
        $totalSkipped = 0;

        foreach ($types as $syncType) {
            $this->info("📁 Syncing {$syncType}...");
            
            if ($syncType === 'data') {
                [$uploaded, $failed, $skipped] = $this->syncDataFiles($isDryRun, $force);
            } else {
                [$uploaded, $failed, $skipped] = $this->syncStorageFiles($syncType, $isDryRun, $force);
            }

            $totalUploaded += $uploaded;
            $totalFailed += $failed;
            $totalSkipped += $skipped;
            $this->newLine();
        }

        $this->info('📊 Summary:');
        $this->line("✅ Uploaded: {$totalUploaded}");
        $this->line("❌ Failed: {$totalFailed}");
        $this->line("⏭️  Skipped: {$totalSkipped}");

        return $totalFailed === 0 ? 0 : 1;
    }

    private function syncDataFiles(bool $isDryRun, bool $force): array
    {
        $supabaseUrl = env('SUPABASE_URL');
        $bucketName = 'portfolio-data';
        $uploaded = $failed = $skipped = 0;

        foreach ($this->dataFiles as $filename) {
            $localPath = storage_path("data/{$filename}");

            if (!File::exists($localPath)) {
                $skipped++;
                continue;
            }

            if ($isDryRun) {
                $this->line("  {$filename} (would upload)");
                $uploaded++;
                continue;
            }

            // Always attempt to upload and overwrite existing files
            if ($this->uploadFile($localPath, $filename, $supabaseUrl, $bucketName)) {
                $this->info("  ✓ {$filename}");
                $uploaded++;
            } else {
                $this->error("  ✗ {$filename}");
                $failed++;
            }
        }

        return [$uploaded, $failed, $skipped];
    }

    private function syncStorageFiles(string $type, bool $isDryRun, bool $force): array
    {
        $config = $this->bucketConfig[$type];
        $supabaseUrl = env('SUPABASE_URL');
        $localPath = base_path($config['path']);
        $uploaded = $failed = $skipped = 0;

        if (!File::isDirectory($localPath)) {
            return [$uploaded, $failed, 1];
        }

        $files = File::allFiles($localPath);

        foreach ($files as $file) {
            if (!in_array(strtolower($file->getExtension()), $config['extensions'])) {
                continue;
            }

            $relativePath = str_replace([$localPath . DIRECTORY_SEPARATOR, '\\'], ['', '/'], $file->getPathname());

            if ($isDryRun) {
                $this->line("  {$relativePath} (would upload)");
                $uploaded++;
                continue;
            }

            // Get mime type using File facade instead of SplFileInfo method
            $mimeType = File::mimeType($file->getPathname());
            
            // Always attempt to upload and overwrite existing files
            if ($this->uploadStorageFile($file->getPathname(), $relativePath, $supabaseUrl, $config['bucket'], $mimeType)) {
                $this->info("  ✓ {$relativePath}");
                $uploaded++;
            } else {
                $this->error("  ✗ {$relativePath}");
                $failed++;
            }
        }

        return [$uploaded, $failed, $skipped];
    }

    private function validateEnvironment(): bool
    {
        if (!env('SUPABASE_URL')) {
            $this->error('❌ SUPABASE_URL not configured');
            return false;
        }
        return true;
    }

    private function uploadFile(string $localPath, string $filename, string $supabaseUrl, string $bucketName): bool
    {
        try {
            $content = File::get($localPath);
            $apiKey = env('SUPABASE_SERVICE_KEY') ?? env('SUPABASE_ANON_KEY');
            
            if (!$apiKey) {
                return false;
            }

            $url = "{$supabaseUrl}/storage/v1/object/{$bucketName}/{$filename}";
            $response = Http::withHeaders([
                'apikey' => $apiKey,
                'Authorization' => "Bearer {$apiKey}",
                'Content-Type' => 'application/json',
            ])->timeout(30)->put($url, $content);

            return $response->successful();
        } catch (\Exception $e) {
            return false;
        }
    }

    private function uploadStorageFile(string $localPath, string $filename, string $supabaseUrl, string $bucketName, ?string $mimeType = null): bool
    {
        try {
            $content = File::get($localPath);
            $apiKey = env('SUPABASE_SERVICE_KEY') ?? env('SUPABASE_ANON_KEY');
            
            if (!$apiKey) {
                $this->error("      No API key found");
                return false;
            }

            $mimeType = $mimeType ?? File::mimeType($localPath) ?? 'application/octet-stream';
            $url = "{$supabaseUrl}/storage/v1/object/{$bucketName}/{$filename}";
            
            // Send binary content with withBody() using PUT to always overwrite
            $response = Http::withHeaders([
                'apikey' => $apiKey,
                'Authorization' => "Bearer {$apiKey}",
                'Content-Type' => $mimeType,
            ])->withBody($content, $mimeType)
              ->timeout(60)
              ->put($url);

            if ($response->successful()) {
                return true;
            }

            $this->error("      HTTP {$response->status()}: {$response->body()}");
            return false;
        } catch (\Exception $e) {
            $this->error("      Error: {$e->getMessage()}");
            return false;
        }
    }
}
