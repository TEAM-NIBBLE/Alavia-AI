<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class HospitalMetaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $now = now();

        $facilities = [
            'Ambulance',
            'Emergency Unit',
            'Laboratory',
            'Radiology',
            'Pharmacy',
            'Maternity Ward',
            'ICU',
        ];

        $specialties = [
            'Cardiology',
            'Emergency Medicine',
            'Pediatrics',
            'Obstetrics & Gynecology',
            'General Surgery',
            'Internal Medicine',
        ];

        DB::table('hospital_facilities')
            ->whereNull('hospital_id')
            ->delete();

        DB::table('hospital_facilities')->insert(
            collect($facilities)->map(function (string $facility) use ($now) {
                return [
                    'hospital_id' => null,
                    'facility_name' => $facility,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            })->all()
        );

        DB::table('hospital_specialties')
            ->whereNull('hospital_id')
            ->delete();

        DB::table('hospital_specialties')->insert(
            collect($specialties)->map(function (string $specialty) use ($now) {
                return [
                    'hospital_id' => null,
                    'specialty_name' => $specialty,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            })->all()
        );
    }
}
