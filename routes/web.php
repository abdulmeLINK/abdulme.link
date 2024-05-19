<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\PortfolioController;
use App\Http\Controllers\AboutController;
use App\Http\Middleware\TrustProxies;
use App\Http\Middleware\CorsMiddleware;
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

Route::middleware(TrustProxies::class)->group(function () {
    Route::get('/', function () {
        return view('home');
    });

    Route::get('/about', [AboutController::class, 'index']);

    Route::get('/contact', [ContactController::class, 'show']);
    Route::post('/contact', [ContactController::class, 'mail']);


    Route::get('/whoami', function () {
        return view('whoami');
    })->middleware(CorsMiddleware::class);



    Route::get('/portfolio', [PortfolioController::class, 'index']);
    Route::get('/portfolio/{name}',  [PortfolioController::class, 'show']);
});
