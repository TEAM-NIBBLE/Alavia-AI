<?php

namespace App\Console\Commands;

use App\Models\Hospital;
use App\Services\OverpassClient;
use Illuminate\Console\Command;

class SyncLagosHospitals extends Command
{
    protected $signature = 'hospitals:sync-lagos {--limit= : optional}';
    protected $description = 'Fetch Lagos hospitals from Overpass API and store them.';

    public function handle(OverpassClient $client): int
    {
        $elements = $client->fetchLagosHospitals();

        if (empty($elements)) {
            $this->warn('No hospitals returned from Overpass.');
            return self::SUCCESS;
        }

        $limit = $this->option('limit');
        if ($limit !== null) {
            $elements = array_slice($elements, 0, (int) $limit);
        }

        $now = now();
        $rows = [];

        foreach ($elements as $element) {
            $tags = $element['tags'] ?? [];
            $name = $tags['name'] ?? null;

            if (! $name) {
                continue;
            }

            $coords = $this->extractCoordinates($element);
            if (! $coords) {
                continue;
            }

            $rows[] = [
                'osm_type' => $element['type'],
                'osm_id' => $element['id'],
                'name' => $name,
                'address' => $this->buildAddress($tags),
                'state' => 'Lagos',
                'lga' => $this->extractLga($tags),
                'lat' => $coords['lat'],
                'lng' => $coords['lng'],
                'rating' => null,
                'rating_count' => null,
                'is_public' => false,
                'is_24_hours' => false,
                'emergency_ready' => false,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        if (empty($rows)) {
            $this->warn('No valid hospitals to upsert.');
            return self::SUCCESS;
        }

        Hospital::upsert(
            $rows,
            ['osm_type', 'osm_id'],
            [
                'name',
                'address',
                'state',
                'lga',
                'lat',
                'lng',
                'updated_at',
            ]
        );

        $this->info('Synced ' . count($rows) . ' hospitals.');

        return self::SUCCESS;
    }

    /**
     * @param array<string, mixed> $element
     * @return array{lat: float, lng: float}|null
     */
    private function extractCoordinates(array $element): ?array
    {
        if (($element['type'] ?? null) === 'node') {
            if (isset($element['lat'], $element['lon'])) {
                return ['lat' => (float) $element['lat'], 'lng' => (float) $element['lon']];
            }
        }

        if (isset($element['center']['lat'], $element['center']['lon'])) {
            return [
                'lat' => (float) $element['center']['lat'],
                'lng' => (float) $element['center']['lon'],
            ];
        }

        return null;
    }

    /**
     * @param array<string, mixed> $tags
     */
    private function buildAddress(array $tags): ?string
    {
        if (! empty($tags['addr:full'])) {
            return (string) $tags['addr:full'];
        }

        $parts = [];
        if (! empty($tags['addr:housenumber'])) {
            $parts[] = $tags['addr:housenumber'];
        }
        if (! empty($tags['addr:street'])) {
            $parts[] = $tags['addr:street'];
        }
        if (! empty($tags['addr:city'])) {
            $parts[] = $tags['addr:city'];
        }
        if (! empty($tags['addr:state'])) {
            $parts[] = $tags['addr:state'];
        }

        return empty($parts) ? null : implode(' ', $parts);
    }

    /**
     * @param array<string, mixed> $tags
     */
    private function extractLga(array $tags): ?string
    {
        return $tags['addr:district']
            ?? $tags['addr:city']
            ?? $tags['addr:suburb']
            ?? null;
    }
}
