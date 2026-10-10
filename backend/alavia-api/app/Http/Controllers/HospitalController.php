<?php

namespace App\Http\Controllers;

use App\Http\Resources\HospitalResource;
use App\Models\Hospital;
use App\Services\GeoService;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class HospitalController extends Controller
{
    public function index(Request $request, GeoService $geoService)
    {
        $query = Hospital::query()
            ->where('state', 'Lagos')
            ->with(['specialties', 'facilities']);

        // `specialty` is a ranking preference (see rankHospitals), not a filter: most hospitals
        // have no specialty data, and a filter would hide every nearby option.

        if ($request->filled('facility')) {
            $facility = $request->string('facility')->toString();
            $query->whereHas('facilities', function ($subQuery) use ($facility) {
                $subQuery->where('facility_name', $facility);
            });
        }

        if ($request->filled('is_public')) {
            $query->where('is_public', filter_var($request->input('is_public'), FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->filled('is_24_hours')) {
            $query->where('is_24_hours', filter_var($request->input('is_24_hours'), FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->filled('emergency_ready')) {
            $query->where('emergency_ready', filter_var($request->input('emergency_ready'), FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->filled('min_rating')) {
            $query->whereNotNull('rating')
                ->where('rating', '>=', (float) $request->input('min_rating'));
        }

        $hospitals = $query->get();

        $lat = $request->input('lat');
        $lng = $request->input('lng');
        $severity = strtoupper((string) $request->input('severity', ''));
        $specialty = $request->input('specialty');
        $facility = $request->input('facility');

        $ranked = $this->rankHospitals(
            $hospitals,
            $geoService,
            $lat !== null ? (float) $lat : null,
            $lng !== null ? (float) $lng : null,
            $severity,
            $specialty,
            $facility
        );

        $top = $ranked->sortByDesc('score')->take(10)->values();

        return HospitalResource::collection($top);
    }

    public function show(int $id)
    {
        $hospital = Hospital::where('state', 'Lagos')
            ->with(['specialties', 'facilities'])
            ->findOrFail($id);

        return new HospitalResource($hospital);
    }

    /**
     * @param Collection<int, Hospital> $hospitals
     */
    private function rankHospitals(
        Collection $hospitals,
        GeoService $geoService,
        ?float $lat,
        ?float $lng,
        string $severity,
        ?string $specialty,
        ?string $facility
    ): Collection {
        $distanceWeight = -1.0;
        $specialtyWeight = 2.0;
        $facilityWeight = 1.0;
        $emergencyBonus = 3.0;
        $ratingWeight = 1.0;

        return $hospitals->map(function (Hospital $hospital) use (
            $geoService,
            $lat,
            $lng,
            $severity,
            $specialty,
            $facility,
            $distanceWeight,
            $specialtyWeight,
            $facilityWeight,
            $emergencyBonus,
            $ratingWeight
        ) {
            $score = 0.0;

            if ($lat !== null && $lng !== null) {
                $distance = $geoService->haversineKm(
                    (float) $lat,
                    (float) $lng,
                    (float) $hospital->lat,
                    (float) $hospital->lng
                );
                $hospital->distance_km = round($distance, 2);
                $score += $distanceWeight * $distance;
            } else {
                $hospital->distance_km = null;
            }

            if ($specialty) {
                $hasSpecialty = $hospital->specialties()
                    ->where('specialty_name', $specialty)
                    ->exists();
                if ($hasSpecialty) {
                    $score += $specialtyWeight;
                }

                // Imported hospitals carry no specialty data, so fall back to what the name says
                // (an eye clinic for eye problems). Emergencies go to the nearest emergency-ready
                // hospital instead, so no specialist boost there.
                if ($severity !== 'CRITICAL' && $this->nameMatchesSpecialty((string) $hospital->name, $specialty)) {
                    $score += self::NAME_SPECIALTY_BONUS;
                }
            }

            if ($facility) {
                $hasFacility = $hospital->facilities()
                    ->where('facility_name', $facility)
                    ->exists();
                if ($hasFacility) {
                    $score += $facilityWeight;
                }
            }

            if (in_array($severity, ['HIGH', 'CRITICAL'], true) && $hospital->emergency_ready) {
                $score += $emergencyBonus;
            }

            if ($hospital->rating !== null) {
                $score += $ratingWeight * ((float) $hospital->rating / 5.0);
            }

            $hospital->score = $score;

            return $hospital;
        });
    }

    private const NAME_SPECIALTY_BONUS = 8.0;

    private function nameMatchesSpecialty(string $name, string $specialty): bool
    {
        $patterns = [
            'Ophthalmology' => '/\b(eye|ophthalm\w*|optic\w*|vision)\b/i',
            'Obstetrics and Gynecology' => '/\b(matern\w*|obstet\w*|gyn\w*|women\w*|fertility|ivf)\b/i',
            'Paediatrics' => '/\b(child\w*|paed\w*|pedia\w*)\b/i',
            'Orthopedics' => '/\b(orthop\w*|trauma|bone|spine)\b/i',
            'Cardiology' => '/\b(cardi\w*|heart)\b/i',
            'Dental' => '/\b(dental|dentist\w*|dent)\b/i',
            'Psychiatry' => '/\b(psychiat\w*|mental|neuropsych\w*)\b/i',
            'Neurology' => '/\b(neuro\w*)\b/i',
            'Urology' => '/\b(urolog\w*|kidney|renal|dialysis)\b/i',
            'Dermatology' => '/\b(skin|derma\w*)\b/i',
            'ENT' => '/\b(ent|ear|nose|throat)\b/i',
            // Broad hospitals can treat most things.
            'General Practice' => '/\b(general|teaching|federal medical|medical cent\w*)\b/i',
            'Internal Medicine' => '/\b(general|teaching|federal medical|medical cent\w*)\b/i',
        ];

        $pattern = $patterns[$specialty] ?? null;

        return $pattern !== null && preg_match($pattern, $name) === 1;
    }
}
