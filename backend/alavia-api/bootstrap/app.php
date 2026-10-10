<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use App\Http\Middleware\ForceJsonResponse;
use App\Http\Middleware\EnsureAdmin;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use App\Console\Commands\InferHospitalFlags;
use App\Console\Commands\SyncLagosHospitals;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withCommands([
        SyncLagosHospitals::class,
        InferHospitalFlags::class,
    ])
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->append(ForceJsonResponse::class);
        $middleware->alias([
            'admin' => EnsureAdmin::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (\Throwable $e, Request $request) {
            if (! $request->expectsJson()) {
                return null;
            }

            if ($e instanceof ValidationException) {
                return response()->json([
                    'error' => [
                        'message' => 'Validation failed',
                        'type' => 'validation',
                        'fields' => $e->errors(),
                    ],
                ], 422);
            }

            $status = match (true) {
                $e instanceof AuthenticationException => 401,
                $e instanceof HttpExceptionInterface => $e->getStatusCode(),
                default => 500,
            };
            $message = $status === 500 ? 'Server Error' : ($status === 401 ? 'Unauthenticated.' : $e->getMessage());

            $payload = [
                'error' => [
                    'message' => $message,
                    'type' => class_basename($e),
                ],
            ];

            if (config('app.debug')) {
                $payload['error']['detail'] = $e->getMessage();
            }

            return response()->json($payload, $status);
        });
    })->create();
