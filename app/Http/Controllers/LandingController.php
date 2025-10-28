<?php

namespace App\Http\Controllers;

use App\Services\LandingService;
use Illuminate\Http\Request;
use Illuminate\View\View;

/**
 * Landing Controller - SEO-friendly landing page
 * Serves indexable, JavaScript-optional landing page
 */
class LandingController extends Controller
{
    private LandingService $landingService;

    public function __construct(LandingService $landingService)
    {
        $this->landingService = $landingService;
    }

    /**
     * Show landing page
     * 
     * @return View Landing page view
     */
    public function index(): View
    {
        try {
            $data = $this->landingService->getLandingData();
            
            return view('landing', [
                'profile' => $data['profile'],
                'portfolio' => $data['portfolio'],
                'stats' => $data['stats'],
                'skills' => $data['skills'],
                'seo' => $data['seo']
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Landing page error: ' . $e->getMessage());
            
            return view('landing', [
                'profile' => [],
                'portfolio' => [],
                'stats' => [],
                'skills' => [],
                'seo' => [],
                'error' => config('app.debug') ? $e->getMessage() : null
            ]);
        }
    }
}
