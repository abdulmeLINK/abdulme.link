<?php

use App\Http\Controllers\AboutController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\DesktopController;
use App\Http\Controllers\ImageController;
use App\Http\Controllers\PortfolioController;
use App\Http\Controllers\PreferencesController;
use App\Http\Controllers\WallpaperController;
use App\Http\Controllers\TerminalController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Portfolio API endpoints
Route::prefix('portfolio')->group(function () {
    Route::get('/', [PortfolioController::class, 'index']);
    Route::get('/featured', [PortfolioController::class, 'featured']);
    Route::get('/category/{category}', [PortfolioController::class, 'category']);
    Route::get('/search', [PortfolioController::class, 'search']);
    Route::get('/stats', [PortfolioController::class, 'stats']);
    Route::get('/{id}', [PortfolioController::class, 'show']);
});

// Wallpaper API endpoints
Route::prefix('wallpapers')->group(function () {
    Route::get('/', [WallpaperController::class, 'index']);
    Route::get('/random', [WallpaperController::class, 'random']);
    Route::get('/time-based', [WallpaperController::class, 'timeBasedWallpapers']);
    Route::get('/smart-selection', [WallpaperController::class, 'smartSelection']);
    Route::get('/by-type', [WallpaperController::class, 'byType']);
    Route::get('/stats', [WallpaperController::class, 'stats']);
    Route::get('/category/{category}', [WallpaperController::class, 'category']);
    Route::post('/set-current', [WallpaperController::class, 'setCurrent']);
    Route::get('/{id}', [WallpaperController::class, 'show']);
});

// Preferences API endpoints
Route::prefix('preferences')->group(function () {
    Route::get('/', [PreferencesController::class, 'show']);
    Route::post('/', [PreferencesController::class, 'update']);
    Route::get('/category/{category}', [PreferencesController::class, 'category']);
    Route::post('/category/{category}', [PreferencesController::class, 'updateCategory']);
    Route::post('/reset', [PreferencesController::class, 'reset']);
    Route::post('/reset/{category}', [PreferencesController::class, 'resetCategory']);
});

// Terminal API endpoints
Route::prefix('terminal')->group(function () {
    Route::post('/execute', [TerminalController::class, 'execute']);
    Route::get('/state', [TerminalController::class, 'getState']);
});

// About API endpoints
Route::prefix('about')->group(function () {
    Route::get('/', [AboutController::class, 'index']);
    Route::get('/summary', [AboutController::class, 'summary']);
    Route::get('/skills', [AboutController::class, 'skills']);
    Route::get('/experience', [AboutController::class, 'experience']);
    Route::get('/education', [AboutController::class, 'education']);
});

// Contact API endpoints
Route::prefix('contact')->group(function () {
    Route::get('/', [ContactController::class, 'index']);
    Route::post('/submit', [ContactController::class, 'submit']);
    Route::post('/validate', [ContactController::class, 'validateForm']);
});

// Desktop & System Data API endpoints
Route::get('/filesystem', [DesktopController::class, 'getFileSystem']);
Route::get('/desktop-apps', [DesktopController::class, 'getDesktopApps']);
Route::get('/loading-messages', [DesktopController::class, 'getLoadingMessages']);

// Image Storage API endpoints (Supabase Storage with local fallback)
Route::prefix('images')->group(function () {
    Route::get('/wallpaper/{id}', [ImageController::class, 'wallpaper']);
    Route::get('/project/{projectId}', [ImageController::class, 'projectImages']);
    Route::get('/asset', [ImageController::class, 'asset']);
    Route::get('/statistics', [ImageController::class, 'statistics']);
    Route::post('/clear-cache', [ImageController::class, 'clearCache']);
});
