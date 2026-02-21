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
});

Route::get('/hospitals', [HospitalController::class, 'index']);
Route::get('/hospitals/{id}', [HospitalController::class, 'show']);

Route::middleware('auth:sanctum')->prefix('consultations')->group(function () {
    Route::post('/start', [ConsultationController::class, 'start']);
    Route::post('/{id}/message', [ConsultationController::class, 'message']);
    Route::get('/history', [ConsultationController::class, 'history']);
    Route::get('/{id}', [ConsultationController::class, 'show']);
    Route::delete('/{id}', [ConsultationController::class, 'destroy']);
});

Route::prefix('speech')->group(function () {
    Route::post('/stt', [SpeechController::class, 'stt']);
    Route::post('/tts', [SpeechController::class, 'tts']);
});

Route::prefix('admin')->group(base_path('routes/admin.php'));
