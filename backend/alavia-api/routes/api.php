<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\User\ProfileController;
use App\Http\Controllers\HospitalController;
use App\Http\Controllers\ConsultationController;
use App\Http\Controllers\SpeechController;

Route::get('/health', function () {
    return response()->json(['status' => 'ok']);
});

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login'])
        ->middleware('throttle:login');
    Route::post('/forgot-password', [PasswordResetController::class, 'forgot'])
        ->middleware('throttle:forgot-password');
    Route::post('/reset-password', [PasswordResetController::class, 'reset']);
    Route::post('/logout', [AuthController::class, 'logout'])
        ->middleware('auth:sanctum');
});

Route::prefix('user')->middleware('auth:sanctum')->group(function () {
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::patch('/profile', [ProfileController::class, 'update']);
    Route::delete('/profile', [ProfileController::class, 'destroy']);
    Route::put('/password', [ProfileController::class, 'updatePassword']);
});

Route::get('/hospitals', [HospitalController::class, 'index']);
Route::get('/hospitals/{id}', [HospitalController::class, 'show']);

// Triage works for guests too (emergencies). Guests prove ownership with X-Guest-Token.
Route::prefix('consultations')->group(function () {
    Route::post('/start', [ConsultationController::class, 'start'])
        ->middleware('throttle:30,1');
    Route::post('/{id}/message', [ConsultationController::class, 'message'])
        ->whereNumber('id');
    Route::get('/{id}', [ConsultationController::class, 'show'])
        ->whereNumber('id');
    Route::post('/{id}/feedback', [ConsultationController::class, 'feedback'])
        ->whereNumber('id');
    Route::post('/{id}/follow-up', [ConsultationController::class, 'followUp'])
        ->whereNumber('id');

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/history', [ConsultationController::class, 'history']);
        Route::delete('/{id}', [ConsultationController::class, 'destroy'])
            ->whereNumber('id');
    });
});

Route::prefix('speech')->group(function () {
    Route::post('/stt', [SpeechController::class, 'stt']);
    Route::post('/tts', [SpeechController::class, 'tts']);
});

Route::prefix('admin')->group(base_path('routes/admin.php'));
