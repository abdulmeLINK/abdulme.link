<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\BootController;
use App\Http\Controllers\DesktopController;
use App\Http\Controllers\LandingController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

/**
 * Desktop - Full LinkOS experience (default landing page)
 */
Route::get('/', [DesktopController::class, 'index'])->name('desktop');

/**
 * Legacy landing page - redirect to desktop
 */
Route::get('/landing', function () {
    return redirect()->route('desktop');
})->name('landing');

/**
 * Boot sequence routes - handles standalone LinkOS-style startup (legacy)
 */
Route::get('/boot', [BootController::class, 'show'])->name('boot');
Route::get('/api/boot/status', [BootController::class, 'status'])->name('boot.status');
Route::post('/api/boot/visited', [BootController::class, 'markVisited'])->name('boot.visited');
Route::post('/api/boot/reset', [BootController::class, 'reset'])->name('boot.reset');
Route::get('/api/boot/system-status', [BootController::class, 'getSystemStatus'])->name('boot.system-status');

/**
 * Desktop routes (also accessible via /desktop for backwards compatibility)
 */
Route::get('/desktop', [DesktopController::class, 'index']);

/**
 * Desktop API endpoints
 */
Route::get('/api/desktop/boot-status', [DesktopController::class, 'bootStatus'])->name('desktop.boot-status');
Route::post('/api/desktop/skip-boot', [DesktopController::class, 'skipBoot'])->name('desktop.skip-boot');
Route::post('/api/desktop/reset-boot', [DesktopController::class, 'resetBoot'])->name('desktop.reset-boot');

/**
 * Test and API routes
 */
Route::get('/api/test/current-wallpaper', [DesktopController::class, 'getCurrentWallpaper'])->name('test.current-wallpaper');
Route::get('/api/loading-sequence', [DesktopController::class, 'getLoadingSequence'])->name('api.loading-sequence');

/**
 * Legacy boot test route (for debugging)
 */
Route::get('/boot-test', [BootController::class, 'test'])->name('boot.test');
