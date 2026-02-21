<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;

class PasswordResetController extends Controller
{
    public function forgot(ForgotPasswordRequest $request): JsonResponse
    {
        $data = $request->validated();
        $user = User::where('email', $data['email'])->firstOrFail();
        $token = Password::broker()->createToken($user);

        return response()->json([
            'reset_token' => $token,
        ]);
    }

    public function reset(ResetPasswordRequest $request): JsonResponse
    {
        $data = $request->validated();
        $user = User::where('email', $data['email'])->firstOrFail();

        if (! Password::broker()->tokenExists($user, $data['token'])) {
            return response()->json([
                'error' => [
                    'message' => 'Invalid reset token',
                    'type' => 'password_reset',
                ],
            ], 422);
        }

        $user->forceFill([
            'password' => Hash::make($data['password']),
        ])->save();

        Password::broker()->deleteToken($user);

        return response()->json(['status' => 'ok']);
    }
}
