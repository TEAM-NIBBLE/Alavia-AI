<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'phone' => fake()->boolean(70) ? fake()->unique()->phoneNumber() : null,
            'password' => static::$password ??= Hash::make('password'),
            'language' => fake()->randomElement(['EN', 'PIDGIN', 'YORUBA', 'HAUSA', 'IGBO']),
            'emergency_contact_name' => fake()->optional()->name(),
            'emergency_contact_phone' => fake()->boolean(70) ? fake()->phoneNumber() : null,
            'refresh_token_hash' => null,
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this;
    }
}
