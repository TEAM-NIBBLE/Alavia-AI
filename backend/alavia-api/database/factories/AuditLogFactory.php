<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\AuditLog>
 */
class AuditLogFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'actor_type' => fake()->optional()->randomElement(['USER', 'ADMIN']),
            'actor_id' => fake()->optional()->numberBetween(1, 1000),
            'action' => fake()->word(),
            'entity' => fake()->word(),
            'entity_id' => fake()->optional()->numberBetween(1, 1000),
            'meta_json' => fake()->optional()->randomElement([['source' => 'system']]),
        ];
    }
}
