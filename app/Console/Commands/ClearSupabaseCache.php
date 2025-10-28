<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

/**
 * Clear Supabase Storage cache
 * Use this after updating data files in Supabase to force re-fetch
 */
class ClearSupabaseCache extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'cache:clear-supabase 
                            {--file= : Specific file to clear (e.g., portfolio)}
                            {--all : Clear all Supabase cache}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clear Supabase Storage cache to force data re-fetch';

    /**
     * Data files that can be cached
     */
    private const DATA_FILES = [
        'portfolio',
        'about',
        'preferences-defaults',
        'terminal-commands',
        'desktop-apps',
        'filesystem',
        'loading-messages'
    ];

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        if ($this->option('all')) {
            return $this->clearAllCache();
        }

        $file = $this->option('file');
        if ($file) {
            return $this->clearFileCache($file);
        }

        // Interactive mode - ask which file to clear
        $choice = $this->choice(
            'Which cache would you like to clear?',
            array_merge(['All Supabase cache'], self::DATA_FILES),
            0
        );

        if ($choice === 'All Supabase cache') {
            return $this->clearAllCache();
        }

        return $this->clearFileCache($choice);
    }

    /**
     * Clear cache for a specific file
     */
    private function clearFileCache(string $filename): int
    {
        $cacheKey = "supabase:storage:{$filename}";
        
        $this->info("Clearing cache for: {$filename}");
        
        if (Cache::has($cacheKey)) {
            Cache::forget($cacheKey);
            $this->info("✓ Cache cleared for {$filename}");
            $this->line("Next request will fetch fresh data from Supabase");
        } else {
            $this->warn("No cache found for {$filename}");
        }

        return self::SUCCESS;
    }

    /**
     * Clear all Supabase cache
     */
    private function clearAllCache(): int
    {
        $this->info("Clearing all Supabase Storage cache...");
        
        $cleared = 0;
        foreach (self::DATA_FILES as $file) {
            $cacheKey = "supabase:storage:{$file}";
            if (Cache::has($cacheKey)) {
                Cache::forget($cacheKey);
                $cleared++;
                $this->line("  ✓ Cleared {$file}");
            }
        }

        if ($cleared > 0) {
            $this->info("✓ Cleared {$cleared} cached files");
            $this->line("Next requests will fetch fresh data from Supabase");
        } else {
            $this->warn("No Supabase cache found");
        }

        return self::SUCCESS;
    }
}
