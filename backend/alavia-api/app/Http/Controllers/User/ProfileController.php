<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class ProfileController extends Controller
{
    public function show(): UserResource
    {
        return new UserResource(auth()->user());
    }

    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validated();

        if (array_key_exists('emergency_contacts', $data)) {
            $contacts = array_values($data['emergency_contacts'] ?? []);
            $data['emergency_contacts'] = $contacts;
            // Keep the legacy single-contact columns pointing at the primary contact.
            $data['emergency_contact_name'] = $contacts[0]['name'] ?? null;
            $data['emergency_contact_phone'] = $contacts[0]['phone'] ?? null;
        }

        $user->fill($data);
        $user->save();

        return response()->json([
            'user' => new UserResource($user),
        ]);
    }

    public function updatePassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'new_password' => ['required', 'string', Password::min(6), 'confirmed'],
        ]);

        $user = $request->user();

        if (! Hash::check($data['current_password'], $user->password)) {
            return response()->json([
                'message' => 'Current password is incorrect.',
                'errors' => ['current_password' => ['Current password is incorrect.']],
            ], 422);
        }

        $user->password = $data['new_password'];
        $user->save();

        return response()->json(['status' => 'ok']);
    }

    public function destroy(Request $request): JsonResponse
    {
        $user = $request->user();

        // Consultations and messages cascade on user delete.
        $user->tokens()->delete();
        $user->delete();

        return response()->json(['status' => 'ok']);
    }
}
