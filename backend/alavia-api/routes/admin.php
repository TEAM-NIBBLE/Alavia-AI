<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\HospitalController;
use App\Http\Controllers\Admin\AnalyticsController;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::get('/hospitals', [HospitalController::class, 'index']);
    Route::post('/hospitals', [HospitalController::class, 'store']);
    Route::patch('/hospitals/{id}', [HospitalController::class, 'update']);
    Route::delete('/hospitals/{id}', [HospitalController::class, 'destroy']);
    Route::post('/hospitals/{id}/specialties', [HospitalController::class, 'attachSpecialties']);
    Route::post('/hospitals/{id}/facilities', [HospitalController::class, 'attachFacilities']);
    Route::get('/analytics/overview', [AnalyticsController::class, 'overview']);
});
