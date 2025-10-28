<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Log;

/**
 * TerminalService - Command parsing and file system simulation
 * Handles terminal commands, file system operations, and command execution
 */
class TerminalService
{
    private DataService $dataService;
    private const FILESYSTEM_FILE = 'filesystem';
    private const COMMANDS_FILE = 'terminal-commands';
    
    private array $currentPath = ['home', 'abdulmelik'];
    
    public function __construct(DataService $dataService)
    {
        $this->dataService = $dataService;
    }
    
    /**
     * Execute terminal command and return formatted response
     * 
     * @param string $command Full command string
     * @param array $context Current terminal context (path, history, etc.)
     * @return array Command execution result
     */
    public function executeCommand(string $command, array $context = []): array
    {
        try {
            $command = trim($command);
            
            if (empty($command)) {
                return $this->createEmptyResponse();
            }
            
            // Parse command and arguments
            $parts = $this->parseCommand($command);
            $cmd = strtolower($parts['command']);
            $args = $parts['args'];
            $flags = $parts['flags'];
            
            // Update current path from context
            if (isset($context['currentPath'])) {
                $this->currentPath = $context['currentPath'];
            }
            
            // Execute the command
            return match ($cmd) {
                'ls', 'dir' => $this->executeLS($args, $flags),
                'cd' => $this->executeCD($args),
                'pwd' => $this->executePWD(),
                'cat' => $this->executeCAT($args),
                'clear', 'cls' => $this->executeClear(),
                'help' => $this->executeHelp($args),
                'whoami' => $this->executeWhoAmI(),
                'neofetch' => $this->executeNeofetch(),
                'snake' => $this->executeSnake(),
                'tictactoe' => $this->executeTicTacToe(),
                'typing-test' => $this->executeTypingTest(),
                default => $this->executeUnknownCommand($cmd)
            };
            
        } catch (Exception $e) {
            Log::error("Failed to execute command '{$command}': " . $e->getMessage());
            return $this->createErrorResponse("Command execution failed: " . $e->getMessage());
        }
    }
    
    /**
     * Get current working directory path
     * 
     * @return array Current path array
     */
    public function getCurrentPath(): array
    {
        return $this->currentPath;
    }
    
    /**
     * Get current path as string
     * 
     * @return string Current path string
     */
    public function getCurrentPathString(): string
    {
        return '/' . implode('/', $this->currentPath);
    }
    
    /**
     * Parse command string into components
     * 
     * @param string $command Raw command string
     * @return array Parsed command components
     */
    private function parseCommand(string $command): array
    {
        $parts = explode(' ', $command);
        $cmd = array_shift($parts);
        
        $args = [];
        $flags = [];
        
        foreach ($parts as $part) {
            if (str_starts_with($part, '-')) {
                $flags[] = $part;
            } else {
                $args[] = $part;
            }
        }
        
        return [
            'command' => $cmd,
            'args' => $args,
            'flags' => $flags
        ];
    }
    
    /**
     * Execute LS command with color-coded output
     * 
     * @param array $args Command arguments
     * @param array $flags Command flags
     * @return array Command result
     */
    private function executeLS(array $args, array $flags): array
    {
        try {
            $filesystem = $this->getFileSystem();
            $currentDir = $this->getCurrentDirectoryContents($filesystem);
            
            if ($currentDir === null) {
                return $this->createErrorResponse("Directory not found");
            }
            
            $output = [];
            $longFormat = in_array('-l', $flags) || in_array('--long', $flags);
            $showAll = in_array('-a', $flags) || in_array('--all', $flags);
            
            foreach ($currentDir as $item) {
                if (!$showAll && str_starts_with($item['name'], '.')) {
                    continue;
                }
                
                if ($longFormat) {
                    $permissions = $item['type'] === 'directory' ? 'drwxr-xr-x' : '-rw-r--r--';
                    $size = $item['size'] ?? 0;
                    $date = $item['modified'] ?? date('M d H:i');
                    
                    $line = sprintf("%s %s %s %s %s",
                        $permissions,
                        '1',
                        'user',
                        str_pad($size, 8, ' ', STR_PAD_LEFT),
                        $date
                    );
                    
                    $output[] = [
                        'type' => 'file-list',
                        'text' => $line,
                        'color' => $item['type'] === 'directory' ? '#4A9EFF' : '#FFFFFF',
                        'item' => $item
                    ];
                } else {
                    $output[] = [
                        'type' => 'file-list',
                        'text' => $item['name'],
                        'color' => $this->getFileColor($item),
                        'item' => $item
                    ];
                }
            }
            
            return $this->createSuccessResponse($output);
            
        } catch (Exception $e) {
            return $this->createErrorResponse("ls: " . $e->getMessage());
        }
    }
    
    /**
     * Execute CD command for directory navigation
     * 
     * @param array $args Command arguments
     * @return array Command result
     */
    private function executeCD(array $args): array
    {
        try {
            if (empty($args)) {
                $this->currentPath = ['home', 'abdulmelik'];
                return $this->createSuccessResponse([]);
            }
            
            $targetPath = $args[0];
            
            if ($targetPath === '..') {
                if (count($this->currentPath) > 1) {
                    array_pop($this->currentPath);
                }
            } elseif ($targetPath === '/') {
                $this->currentPath = [];
            } elseif (str_starts_with($targetPath, '/')) {
                $this->currentPath = array_filter(explode('/', $targetPath));
            } else {
                $filesystem = $this->getFileSystem();
                $currentDir = $this->getCurrentDirectoryContents($filesystem);
                
                $found = false;
                foreach ($currentDir as $item) {
                    if ($item['name'] === $targetPath && $item['type'] === 'directory') {
                        $this->currentPath[] = $targetPath;
                        $found = true;
                        break;
                    }
                }
                
                if (!$found) {
                    return $this->createErrorResponse("cd: {$targetPath}: No such directory");
                }
            }
            
            return $this->createSuccessResponse([], ['newPath' => $this->currentPath]);
            
        } catch (Exception $e) {
            return $this->createErrorResponse("cd: " . $e->getMessage());
        }
    }
    
    /**
     * Execute PWD command to show current directory
     * 
     * @return array Command result
     */
    private function executePWD(): array
    {
        return $this->createSuccessResponse([
            [
                'type' => 'text',
                'text' => $this->getCurrentPathString(),
                'color' => '#FFFF00'
            ]
        ]);
    }
    
    /**
     * Get file system structure
     * 
     * @return array File system data
     */
    private function getFileSystem(): array
    {
        return $this->dataService->read(self::FILESYSTEM_FILE, $this->getDefaultFileSystem());
    }
    
    /**
     * Get default file system structure
     * 
     * @return array Default file system
     */
    private function getDefaultFileSystem(): array
    {
        return [
            'home' => [
                'type' => 'directory',
                'contents' => [
                    'abdulmelik' => [
                        'type' => 'directory',
                        'contents' => [
                            'projects' => ['type' => 'directory', 'contents' => []],
                            'documents' => ['type' => 'directory', 'contents' => []],
                            'README.md' => ['type' => 'file', 'content' => '# Welcome to my terminal!'],
                        ]
                    ]
                ]
            ]
        ];
    }
    
    /**
     * Create success response
     * 
     * @param array $output Command output
     * @param array $metadata Additional metadata
     * @return array Success response
     */
    private function createSuccessResponse(array $output = [], array $metadata = []): array
    {
        return [
            'success' => true,
            'output' => $output,
            'currentPath' => $this->currentPath,
            'metadata' => $metadata
        ];
    }
    
    /**
     * Create error response
     * 
     * @param string $message Error message
     * @return array Error response
     */
    private function createErrorResponse(string $message): array
    {
        return [
            'success' => false,
            'output' => [
                [
                    'type' => 'error',
                    'text' => $message,
                    'color' => '#FF4444'
                ]
            ],
            'currentPath' => $this->currentPath
        ];
    }
    
    /**
     * Create empty response for empty commands
     * 
     * @return array Empty response
     */
    private function createEmptyResponse(): array
    {
        return [
            'success' => true,
            'output' => [],
            'currentPath' => $this->currentPath
        ];
    }
    
    /**
     * Get current directory contents from file system
     * 
     * @param array $filesystem File system structure
     * @return array|null Directory contents or null if not found
     */
    private function getCurrentDirectoryContents(array $filesystem): ?array
    {
        $current = $filesystem;
        
        foreach ($this->currentPath as $part) {
            if (isset($current[$part]['contents'])) {
                $current = $current[$part]['contents'];
            } else {
                return null;
            }
        }
        
        $contents = [];
        foreach ($current as $name => $item) {
            $contents[] = array_merge($item, ['name' => $name]);
        }
        
        return $contents;
    }
    
    /**
     * Get color for file type
     * 
     * @param array $item File/directory item
     * @return string Color code
     */
    private function getFileColor(array $item): string
    {
        if ($item['type'] === 'directory') {
            return '#4A9EFF'; // Blue for directories
        }
        
        $extension = pathinfo($item['name'], PATHINFO_EXTENSION);
        
        return match ($extension) {
            'js', 'ts', 'jsx', 'tsx' => '#F7DF1E', // JavaScript yellow
            'php' => '#777BB4', // PHP purple
            'py' => '#3776AB', // Python blue
            'html' => '#E34F26', // HTML orange
            'css', 'scss', 'sass' => '#1572B6', // CSS blue
            'json' => '#000000', // JSON black
            'md' => '#083FA1', // Markdown blue
            default => '#FFFFFF' // Default white
        };
    }
    
    /**
     * Execute unknown command
     * 
     * @param string $cmd Command name
     * @return array Error response
     */
    private function executeUnknownCommand(string $cmd): array
    {
        return $this->createErrorResponse("Command not found: {$cmd}. Type 'help' for available commands.");
    }
    
    // Additional command methods will be added as needed...
    private function executeCAT(array $args): array { return $this->createErrorResponse("cat: Not implemented yet"); }
    private function executeClear(): array { return ['success' => true, 'clear' => true, 'currentPath' => $this->currentPath]; }
    private function executeHelp(array $args): array { return $this->createErrorResponse("help: Not implemented yet"); }
    private function executeWhoAmI(): array { return $this->createErrorResponse("whoami: Not implemented yet"); }
    private function executeNeofetch(): array { return $this->createErrorResponse("neofetch: Not implemented yet"); }
    private function executeSnake(): array { return $this->createErrorResponse("snake: Not implemented yet"); }
    private function executeTicTacToe(): array { return $this->createErrorResponse("tictactoe: Not implemented yet"); }
    private function executeTypingTest(): array { return $this->createErrorResponse("typing-test: Not implemented yet"); }
}