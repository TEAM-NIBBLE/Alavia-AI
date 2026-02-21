<?php

use App\Models\User;
use App\Models\AdminUser;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

function authHeader(User $user): array
{
    $token = $user->createToken('api')->plainTextToken;

    return ['Authorization' => 'Bearer ' . $token];
}

it('starts a consultation and returns first question', function () {
    $user = User::factory()->create(['language' => 'EN']);
    $headers = authHeader($user);

    $response = $this->withHeaders($headers)->postJson('/api/consultations/start', [
        'initial_message' => 'I have chest pain since this morning.',
    ]);

    $response->assertStatus(201)
        ->assertJsonStructure([
            'consultation_id',
            'message' => ['id', 'role', 'content'],
        ]);
});

it('accepts user message and returns next question', function () {
    $user = User::factory()->create(['language' => 'EN']);
    $headers = authHeader($user);

    $start = $this->withHeaders($headers)->postJson('/api/consultations/start');
    $consultationId = $start->json('consultation_id');

    $response = $this->withHeaders($headers)->postJson("/api/consultations/{$consultationId}/message", [
        'content' => 'Yes, I am having trouble breathing.',
    ]);

    $response->assertStatus(200)
        ->assertJsonStructure([
            'consultation_id',
            'status',
            'message' => ['id', 'role', 'content'],
        ]);
});

it('completes a consultation and returns final response', function () {
    $user = User::factory()->create(['language' => 'EN']);
    $headers = authHeader($user);

    $start = $this->withHeaders($headers)->postJson('/api/consultations/start', [
        'initial_message' => 'I have chest pain.',
    ]);
    $consultationId = $start->json('consultation_id');

    $messages = [
        'Yes, I have trouble breathing.',
        'The pain spreads to my left arm.',
        'I am sweating heavily.',
        'It is 9 out of 10.',
    ];

    $response = null;
    foreach ($messages as $message) {
        $response = $this->withHeaders($headers)
            ->postJson("/api/consultations/{$consultationId}/message", [
                'content' => $message,
            ]);

        if ($response->json('status') === 'COMPLETED') {
            break;
        }
    }

    $response->assertStatus(200)
        ->assertJson([
            'status' => 'COMPLETED',
            'severity' => 'CRITICAL',
        ]);
});

it('returns consultation history', function () {
    $user = User::factory()->create(['language' => 'EN']);
    $headers = authHeader($user);

    $this->withHeaders($headers)->postJson('/api/consultations/start');

    $response = $this->withHeaders($headers)->getJson('/api/consultations/history');

    $response->assertStatus(200)
        ->assertJsonStructure(['data' => [['id', 'status']]]);
});

it('deletes a consultation', function () {
    $user = User::factory()->create(['language' => 'EN']);
    $headers = authHeader($user);

    $start = $this->withHeaders($headers)->postJson('/api/consultations/start');
    $consultationId = $start->json('consultation_id');

    $response = $this->withHeaders($headers)->deleteJson("/api/consultations/{$consultationId}");

    $response->assertStatus(200)->assertJson(['status' => 'ok']);
});

it('returns admin analytics overview', function () {
    $admin = AdminUser::factory()->create([
        'password' => Hash::make('AdminPass123!'),
        'role' => 'SUPERADMIN',
    ]);
    $token = $admin->createToken('admin')->plainTextToken;

    $response = $this->withHeader('Authorization', 'Bearer ' . $token)
        ->getJson('/api/admin/analytics/overview');

    $response->assertStatus(200)
        ->assertJsonStructure([
            'users',
            'consultations',
            'severity_breakdown',
            'last_7_days',
        ]);
});
