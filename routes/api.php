<?php

use App\Http\Controllers\AboutController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\FileSystemController; //import FileSystemController
use App\Http\Controllers\PostController;
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

//create route for FileSystemController
Route::post('filesystem/contents', [FileSystemController::class, 'index']);
Route::post('about', [AboutController::class, 'index_api']);
Route::resource('posts', PostController::class);
