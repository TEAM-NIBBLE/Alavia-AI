<?php

use App\Services\GeoService;

it('calculates zero distance for same point', function () {
    $geo = new GeoService();
    $distance = $geo->haversineKm(6.5, 3.4, 6.5, 3.4);

    expect($distance)->toBeLessThan(0.001);
});

it('calculates a reasonable distance between two points', function () {
    $geo = new GeoService();
    $distance = $geo->haversineKm(6.5244, 3.3792, 6.4654, 3.4064);

    expect($distance)->toBeGreaterThan(5.0)
        ->toBeLessThan(10.0);
});
