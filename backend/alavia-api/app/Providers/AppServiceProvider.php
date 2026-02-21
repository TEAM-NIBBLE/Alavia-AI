<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        RateLimiter::for('login', function (Request $request) {
            $key = (string) $request->input('email');

            return Limit::perMinute(5)->by($request->ip() . '|' . $key);
        });

        RateLimiter::for('forgot-password', function (Request $request) {
            $key = (string) $request->input('email');

            return Limit::perMinute(3)->by($request->ip() . '|' . $key);
        });
    }
}
