<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\LoginRequest;
use App\Models\AdminUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(LoginRequest $request): JsonResponse
    {
        $data = $request->validated();
        $admin = AdminUser::where('email', $data['email'])->first();

        if (! $admin || ! Hash::check($data['password'], $admin->password)) {
            return response()->json([
                'error' => [
                    'message' => 'Invalid credentials',
                    'type' => 'auth',
                ],
            ], 401);
        }

        $token = $admin->createToken('admin')->plainTextToken;

        return response()->json([
            'admin' => [
                'id' => $admin->id,
                'email' => $admin->email,
                'role' => $admin->role,
            ],
            'token' => $token,
        ]);
    }
}
