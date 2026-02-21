<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Hospital>
 */
class HospitalFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'osm_type' => fake()->randomElement(['node', 'way', 'relation']),
            'osm_id' => fake()->unique()->numberBetween(100000, 999999999),
            'name' => fake()->company() . ' Hospital',
            'address' => fake()->optional()->streetAddress(),
            'state' => 'Lagos',
            'lga' => fake()->optional()->city(),
            'lat' => fake()->latitude(6.4, 6.7),
            'lng' => fake()->longitude(3.1, 3.6),
            'rating' => fake()->optional()->randomFloat(1, 2.5, 5.0),
            'rating_count' => fake()->optional()->numberBetween(1, 500),
            'is_public' => fake()->boolean(40),
            'is_24_hours' => fake()->boolean(30),
            'emergency_ready' => fake()->boolean(30),
        ];
    }
}
