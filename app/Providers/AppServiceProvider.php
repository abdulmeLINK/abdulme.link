<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Validator;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Register service contracts
        $this->app->bind(
            \App\Contracts\DataServiceInterface::class,
            \App\Services\DataService::class
        );

        $this->app->bind(
            \App\Contracts\PortfolioServiceInterface::class,
            \App\Services\PortfolioService::class
        );

        // Register services as singletons for better performance
        // Note: DataService and LandingService are not singletons because they read dynamic JSON data
        $this->app->singleton(\App\Services\PortfolioService::class);
        $this->app->singleton(\App\Services\WallpaperService::class);
        $this->app->singleton(\App\Services\PreferencesService::class);
        $this->app->singleton(\App\Services\TerminalService::class);
        $this->app->singleton(\App\Services\LoadingService::class);
        $this->app->singleton(\App\Services\AboutService::class);
        $this->app->singleton(\App\Services\ContactService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //URL::forceScheme('https'); // Use the URL class


        Validator::extend('captcha', function ($attribute, $value, $parameters, $validator) {
            $recaptcha = new \ReCaptcha\ReCaptcha(env('GOOGLE_RECAPTCHA_SECRET_KEY'));
            $response = $recaptcha->verify($value, $_SERVER['REMOTE_ADDR']);
            return $response->isSuccess();
        });
    }
}
