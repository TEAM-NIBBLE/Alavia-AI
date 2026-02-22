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

        $hospitalIds = DB::table('hospitals')->pluck('id')->all();
        if (empty($hospitalIds)) {
            return;
        }

        DB::table('hospital_facilities')
            ->whereNotNull('hospital_id')
            ->delete();

        DB::table('hospital_specialties')
            ->whereNotNull('hospital_id')
            ->delete();

        $facilityMax = min(4, count($facilities));
        $facilityMin = min(2, $facilityMax);
        $specialtyMax = min(3, count($specialties));
        $specialtyMin = min(1, $specialtyMax);

        $facilityRows = [];
        $specialtyRows = [];

        foreach ($hospitalIds as $hospitalId) {
            $facilityCount = rand($facilityMin, $facilityMax);
            $specialtyCount = rand($specialtyMin, $specialtyMax);

            $pickedFacilities = collect($facilities)->shuffle()->take($facilityCount)->all();
            $pickedSpecialties = collect($specialties)->shuffle()->take($specialtyCount)->all();

            foreach ($pickedFacilities as $facility) {
                $facilityRows[] = [
                    'hospital_id' => $hospitalId,
                    'facility_name' => $facility,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            foreach ($pickedSpecialties as $specialty) {
                $specialtyRows[] = [
                    'hospital_id' => $hospitalId,
                    'specialty_name' => $specialty,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        DB::table('hospital_facilities')->insert($facilityRows);
        DB::table('hospital_specialties')->insert($specialtyRows);
    }
}
