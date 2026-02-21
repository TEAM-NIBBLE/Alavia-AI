<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class OverpassClient
{
    private string $baseUrl;
    private string $lagosBbox;

    public function __construct()
    {
        $this->baseUrl = (string) env('OVERPASS_URL', 'https://overpass-api.de/api/interpreter');
        $this->lagosBbox = (string) env('OVERPASS_LAGOS_BBOX', '6.35,2.70,6.80,3.70');
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function fetchLagosHospitals(): array
    {
        $areaQuery = <<<QL
        [out:json][timeout:25];
        area["name"="Lagos State"]["boundary"="administrative"]["admin_level"="4"]->.lagos;
        (nwr["amenity"="hospital"](area.lagos););
        out center tags;
        QL;

        $areaResponse = $this->fetchWithCache('overpass_lagos_area.json', $areaQuery);
        if ($this->hasElements($areaResponse)) {
            return $areaResponse['elements'];
        }

        $bbox = $this->sanitizeBbox($this->lagosBbox);
        $bboxQuery = <<<QL
        [out:json][timeout:25];
        (nwr["amenity"="hospital"]({$bbox}););
        out center tags;
        QL;

        $bboxResponse = $this->fetchWithCache('overpass_lagos_bbox.json', $bboxQuery);

        return $bboxResponse['elements'] ?? [];
    }

    /**
     * @return array<string, mixed>
     */
    private function fetchWithCache(string $cacheFile, string $query): array
    {
        $path = 'cache/' . $cacheFile;

        if (Storage::disk('local')->exists($path)) {
            $cached = json_decode((string) Storage::disk('local')->get($path), true);
            if (is_array($cached) && isset($cached['fetched_at'], $cached['data'])) {
                $ageSeconds = now()->diffInSeconds($cached['fetched_at']);
                if ($ageSeconds < 86400) {
                    return (array) $cached['data'];
                }
            }
        }

        $response = Http::withHeaders([
            'User-Agent' => 'AlaviaAI/1.0 (+https://alavia.ai)',
        ])->timeout(60)->asForm()->post($this->baseUrl, [
            'data' => $query,
        ]);

        if (! $response->successful()) {
            return [];
        }

        $data = (array) $response->json();

        Storage::disk('local')->put($path, json_encode([
            'fetched_at' => now()->toIso8601String(),
            'data' => $data,
        ]));

        return $data;
    }

    /**
     * @param array<string, mixed> $response
     */
    private function hasElements(array $response): bool
    {
        return isset($response['elements']) && is_array($response['elements']) && count($response['elements']) > 0;
    }

    private function sanitizeBbox(string $bbox): string
    {
        $bbox = Str::of($bbox)->replaceMatches('/[^0-9\.,\-]/', '')->toString();
        $parts = array_values(array_filter(explode(',', $bbox), fn ($part) => $part !== ''));

        if (count($parts) !== 4) {
            return '6.35,2.70,6.80,3.70';
        }

        return implode(',', $parts);
    }
}
