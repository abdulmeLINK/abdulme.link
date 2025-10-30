<?php

namespace App\Http\Controllers;

use App\Services\TerminalService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Exception;

/**
 * TerminalController - API endpoints for terminal functionality
 * Handles terminal command execution and file operations
 */
class TerminalController extends Controller
{
    private TerminalService $terminalService;
    
    public function __construct(TerminalService $terminalService)
    {
        $this->terminalService = $terminalService;
    }
    
    /**
     * Get current terminal state
     * 
     * @return JsonResponse
     */
    public function getState(): JsonResponse
    {
        try {
            return response()->json([
                'success' => true,
                'data' => [
                    'currentPath' => $this->terminalService->getCurrentPath(),
                    'currentPathString' => $this->terminalService->getCurrentPathString()
                ]
            ]);
            
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }
}