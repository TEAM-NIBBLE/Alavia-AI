<?php

use App\Models\User;
use App\Models\AdminUser;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

it('registers a user and returns a token', function () {
    $response = $this->postJson('/api/auth/register', [
        'name' => 'Jane Doe',
        'email' => 'jane@example.com',
        'phone' => '+2348000000000',
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
        'language' => 'EN',
    ]);

    $response->assertStatus(201)
        ->assertJsonStructure(['user' => ['id', 'email'], 'token']);

    $this->assertDatabaseHas('users', ['email' => 'jane@example.com']);
});

it('logs in a user and returns a token', function () {
    $user = User::factory()->create([
        'password' => Hash::make('Password123!'),
    ]);

    $response = $this->postJson('/api/auth/login', [
        'email' => $user->email,
        'password' => 'Password123!',
    ]);

    $response->assertStatus(200)
        ->assertJsonStructure(['user' => ['id', 'email'], 'token']);
});

it('logs out an authenticated user', function () {
    $user = User::factory()->create();
    $token = $user->createToken('api')->plainTextToken;

    $response = $this->withHeader('Authorization', 'Bearer ' . $token)
        ->postJson('/api/auth/logout');

    $response->assertStatus(200)
        ->assertJson(['status' => 'ok']);

    $this->assertCount(0, $user->tokens()->get());
});

it('issues and resets a password', function () {
    $user = User::factory()->create([
        'email' => 'reset@example.com',
        'password' => Hash::make('OldPassword123!'),
    ]);

    $forgot = $this->postJson('/api/auth/forgot-password', [
        'email' => $user->email,
    ]);

    $forgot->assertStatus(200)
        ->assertJsonStructure(['reset_token']);

    $token = $forgot->json('reset_token');

    $reset = $this->postJson('/api/auth/reset-password', [
        'email' => $user->email,
        'token' => $token,
        'password' => 'NewPassword123!',
        'password_confirmation' => 'NewPassword123!',
    ]);

    $reset->assertStatus(200)
        ->assertJson(['status' => 'ok']);

    $user->refresh();
    expect(Hash::check('NewPassword123!', $user->password))->toBeTrue();
});

it('logs in an admin user', function () {
    $admin = AdminUser::factory()->create([
        'email' => 'admin@example.com',
        'password' => Hash::make('AdminPass123!'),
        'role' => 'SUPERADMIN',
    ]);

    $response = $this->postJson('/api/admin/login', [
        'email' => $admin->email,
        'password' => 'AdminPass123!',
    ]);

    $response->assertStatus(200)
        ->assertJsonStructure(['admin' => ['id', 'email', 'role'], 'token']);
});
