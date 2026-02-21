<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Consultation>
 */
class ConsultationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'status' => fake()->randomElement(['ACTIVE', 'COMPLETED']),
            'severity' => fake()->optional()->randomElement(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
            'category' => fake()->optional()->word(),
            'summary_encrypted' => null,
            'recommended_specialty' => fake()->optional()->word(),
            'first_aid_json' => null,
            'warnings_json' => null,
        ];
    }
}
