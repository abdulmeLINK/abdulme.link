<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ContactController;

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

Route::get('/', function () {
    return view('home');
});

Route::get('/about', function () {
    return view('about');
});

Route::get('/contact', [ContactController::class, 'show']);
Route::post('/contact', [ContactController::class, 'mail']);


Route::get('/portfolio', function () {
    $projects = [
        [
            'name' => 'Project 1',
            'description' => 'This is the first project.',
            'image' => 'https://images.ctfassets.net/b4k16c7lw5ut/11LXZQGT4nCKgw6bAmwmZ2/3a678a1da2426911ffe86d639bb34f3c/TikTok_video_ads_guide.png?w=1920&h=1080&q=50&fm=webp',
            'link' => '/portfolio/Project 1',
        ],
        [
            'name' => 'Project 2',
            'description' => 'This is the second project.',
            'image' => 'https://clevertap.com/wp-content/uploads/2019/05/target-app-install-ad.png',
            'link' => null,
        ],
        [
            'name' => 'Project 3',
            'description' => 'This is the third project.',
            'image' => 'https://platincdn.com/3635/pictures/RGWCXJLZHD10102022125131_20221010_121644-min.jpg',
            'link' => 'https://example.com/project3',
        ],
        [
            'name' => 'Project 4',
            'description' => 'This is the fourth project.',
            'image' => 'https://images.ctfassets.net/b4k16c7lw5ut/11LXZQGT4nCKgw6bAmwmZ2/3a678a1da2426911ffe86d639bb34f3c/TikTok_video_ads_guide.png?w=1920&h=1080&q=50&fm=webp',
            'link' => 'https://example.com/project1',
        ],
        [
            'name' => 'Project 5',
            'description' => 'This is the fifth project.',
            'image' => 'https://clevertap.com/wp-content/uploads/2019/05/target-app-install-ad.png',
            'link' => null,
        ],
        [
            'name' => 'Project 6',
            'description' => 'This is the sixth project.',
            'image' => 'https://platincdn.com/3635/pictures/RGWCXJLZHD10102022125131_20221010_121644-min.jpg',
            'link' => 'https://example.com/project3',
        ],
    ];

    return view('portfolio', ['projects' => $projects]);
});
Route::get('/portfolio/{name}', function ($name) {
    $projects = [
        [
            'name' => 'Project 1',
            'description' => 'This is the first project.',
            'image' => 'https://images.ctfassets.net/b4k16c7lw5ut/11LXZQGT4nCKgw6bAmwmZ2/3a678a1da2426911ffe86d639bb34f3c/TikTok_video_ads_guide.png?w=1920&h=1080&q=50&fm=webp',
            'link' => 'https://example.com/project1',
        ],
        [
            'name' => 'Project 2',
            'description' => 'This is the second project.',
            'image' => 'https://clevertap.com/wp-content/uploads/2019/05/target-app-install-ad.png',
            'link' => null,
        ],
        [
            'name' => 'Project 3',
            'description' => 'This is the third project.',
            'image' => 'https://platincdn.com/3635/pictures/RGWCXJLZHD10102022125131_20221010_121644-min.jpg',
            'link' => 'https://example.com/project3',
        ],
        [
            'name' => 'Project 4',
            'description' => 'This is the fourth project.',
            'image' => 'https://images.ctfassets.net/b4k16c7lw5ut/11LXZQGT4nCKgw6bAmwmZ2/3a678a1da2426911ffe86d639bb34f3c/TikTok_video_ads_guide.png?w=1920&h=1080&q=50&fm=webp',
            'link' => 'https://example.com/project1',
        ],
        [
            'name' => 'Project 5',
            'description' => 'This is the fifth project.',
            'image' => 'https://clevertap.com/wp-content/uploads/2019/05/target-app-install-ad.png',
            'link' => null,
        ],
        [
            'name' => 'Project 6',
            'description' => 'This is the sixth project.',
            'image' => 'https://platincdn.com/3635/pictures/RGWCXJLZHD10102022125131_20221010_121644-min.jpg',
            'link' => 'https://example.com/project3',
        ],
    ];

    $project = array_filter($projects, function ($project) use ($name) {
        return $project['name'] === $name;
    });

    // Reset array keys and get the first project
    $project = array_values($project)[0] ?? null;

    if ($project) {
        return view('portfolio_item', ['project' => $project]);
    }

    return abort(404, 'Project not found');
});
