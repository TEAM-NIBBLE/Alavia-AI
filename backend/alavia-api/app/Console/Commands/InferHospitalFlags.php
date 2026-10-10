<?php

namespace App\Console\Commands;

use App\Models\Hospital;
use Illuminate\Console\Command;

/**
 * OpenStreetMap gives names and coordinates but not public/private or emergency capability.
 * This sets those flags ONLY where the institution type is obvious from its name, and leaves
 * everything else untouched/unknown. It never invents facilities or specialties.
 */
class InferHospitalFlags extends Command
{
    protected $signature = 'hospitals:infer-flags';

    protected $description = 'Infer is_public / emergency_ready from unambiguous institution names (no invented data).';

    public function handle(): int
    {
        // Government general, teaching and federal medical hospitals ("Specialist Hospital" is deliberately
        // excluded: in Lagos it is usually private).
        //: public, with an emergency unit.
        $emergencyPublic = Hospital::query()->where(function ($q) {
            $q->where('name', 'like', '%General Hospital%')
                ->orWhere('name', 'like', '%Teaching Hospital%')
                ->orWhere('name', 'like', '%Federal Medical Cent%')
                ->orWhere('name', 'like', '%LASUTH%')
                ->orWhere('name', 'like', '%LUTH%');
        })->update(['is_public' => true, 'emergency_ready' => true]);

        // Primary health centres: public, but not assumed to handle emergencies.
        $primary = Hospital::query()->where(function ($q) {
            $q->where('name', 'like', '%Primary Health%')
                ->orWhere('name', 'like', '%Primary Healthcare%');
        })->update(['is_public' => true]);

        $this->info("Public + emergency-capable: {$emergencyPublic}. Public primary care: {$primary}.");

        return self::SUCCESS;
    }
}
