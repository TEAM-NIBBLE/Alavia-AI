<?php

use App\Models\Hospital;
use App\Models\HospitalFacility;
use App\Models\HospitalSpecialty;
use App\Models\AdminUser;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

it('lists ranked hospitals with distance when lat/lng provided', function () {
    $near = Hospital::factory()->create([
        'state' => 'Lagos',
        'lat' => 6.5000,
        'lng' => 3.4000,
        'rating' => 4.5,
    ]);

    $far = Hospital::factory()->create([
        'state' => 'Lagos',
        'lat' => 6.8000,
        'lng' => 3.7000,
        'rating' => 4.5,
    ]);

    $response = $this->getJson('/api/hospitals?lat=6.5001&lng=3.4001');

    $response->assertStatus(200)
        ->assertJsonStructure([
            'data' => [
                ['id', 'name', 'distance_km'],
            ],
        ]);

    $data = $response->json('data');
    expect($data[0]['id'])->toBe($near->id);
});

it('filters by specialty and facility', function () {
    $match = Hospital::factory()->create(['state' => 'Lagos']);
    $other = Hospital::factory()->create(['state' => 'Lagos']);

    HospitalSpecialty::create([
        'hospital_id' => $match->id,
        'specialty_name' => 'Cardiology',
    ]);

    HospitalFacility::create([
        'hospital_id' => $match->id,
        'facility_name' => 'Emergency Unit',
    ]);

    $response = $this->getJson('/api/hospitals?specialty=Cardiology&facility=Emergency%20Unit');

    $response->assertStatus(200);
    $data = $response->json('data');

    expect(collect($data)->pluck('id')->all())->toBe([$match->id]);
});

it('applies boolean filters and min_rating', function () {
    Hospital::factory()->create([
        'state' => 'Lagos',
        'is_public' => true,
        'is_24_hours' => true,
        'emergency_ready' => true,
        'rating' => 4.8,
    ]);

    Hospital::factory()->create([
        'state' => 'Lagos',
        'is_public' => false,
        'is_24_hours' => false,
        'emergency_ready' => false,
        'rating' => 2.0,
    ]);

    $response = $this->getJson('/api/hospitals?is_public=true&is_24_hours=true&emergency_ready=true&min_rating=4.0');

    $response->assertStatus(200);
    $data = $response->json('data');
    expect(count($data))->toBe(1);
});

it('returns single hospital by id', function () {
    $hospital = Hospital::factory()->create(['state' => 'Lagos']);

    $response = $this->getJson('/api/hospitals/' . $hospital->id);

    $response->assertStatus(200)
        ->assertJson([
            'data' => [
                'id' => $hospital->id,
                'name' => $hospital->name,
            ],
        ]);
});

it('allows admin to manage hospitals and attach metadata', function () {
    $admin = AdminUser::factory()->create([
        'password' => Hash::make('AdminPass123!'),
        'role' => 'SUPERADMIN',
    ]);
    $token = $admin->createToken('admin')->plainTextToken;

    $create = $this->withHeader('Authorization', 'Bearer ' . $token)->postJson('/api/admin/hospitals', [
        'osm_type' => 'node',
        'osm_id' => 999999,
        'name' => 'Test Hospital',
        'lat' => 6.5,
        'lng' => 3.4,
        'state' => 'Lagos',
    ]);

    $create->assertStatus(201);
    $hospitalId = $create->json('data.id');

    $this->withHeader('Authorization', 'Bearer ' . $token)->patchJson('/api/admin/hospitals/' . $hospitalId, [
        'is_public' => true,
    ])->assertStatus(200);

    $this->withHeader('Authorization', 'Bearer ' . $token)->postJson('/api/admin/hospitals/' . $hospitalId . '/specialties', [
        'specialties' => ['Cardiology'],
    ])->assertStatus(200);

    $this->withHeader('Authorization', 'Bearer ' . $token)->postJson('/api/admin/hospitals/' . $hospitalId . '/facilities', [
        'facilities' => ['Emergency Unit'],
    ])->assertStatus(200);

    $this->withHeader('Authorization', 'Bearer ' . $token)->deleteJson('/api/admin/hospitals/' . $hospitalId)
        ->assertStatus(200);
});
