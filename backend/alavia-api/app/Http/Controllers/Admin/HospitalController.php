<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AttachFacilitiesRequest;
use App\Http\Requests\Admin\AttachSpecialtiesRequest;
use App\Http\Requests\Admin\HospitalStoreRequest;
use App\Http\Requests\Admin\HospitalUpdateRequest;
use App\Http\Resources\HospitalResource;
use App\Models\Hospital;
use App\Models\HospitalFacility;
use App\Models\HospitalSpecialty;
use Illuminate\Http\JsonResponse;

class HospitalController extends Controller
{
    public function index(): JsonResponse
    {
        $hospitals = Hospital::where('state', 'Lagos')->orderByDesc('id')->get();

        return response()->json([
            'data' => HospitalResource::collection($hospitals),
        ]);
    }

    public function store(HospitalStoreRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['state'] = $data['state'] ?? 'Lagos';

        $hospital = Hospital::create($data);

        return response()->json([
            'data' => new HospitalResource($hospital),
        ], 201);
    }

    public function update(HospitalUpdateRequest $request, int $id): JsonResponse
    {
        $hospital = Hospital::findOrFail($id);
        $hospital->fill($request->validated());
        $hospital->save();

        return response()->json([
            'data' => new HospitalResource($hospital),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $hospital = Hospital::findOrFail($id);
        $hospital->delete();

        return response()->json(['status' => 'ok']);
    }

    public function attachSpecialties(AttachSpecialtiesRequest $request, int $id): JsonResponse
    {
        $hospital = Hospital::findOrFail($id);
        $hospital->specialties()->delete();

        foreach ($request->validated()['specialties'] as $specialty) {
            HospitalSpecialty::create([
                'hospital_id' => $hospital->id,
                'specialty_name' => $specialty,
            ]);
        }

        return response()->json(['status' => 'ok']);
    }

    public function attachFacilities(AttachFacilitiesRequest $request, int $id): JsonResponse
    {
        $hospital = Hospital::findOrFail($id);
        $hospital->facilities()->delete();

        foreach ($request->validated()['facilities'] as $facility) {
            HospitalFacility::create([
                'hospital_id' => $hospital->id,
                'facility_name' => $facility,
            ]);
        }

        return response()->json(['status' => 'ok']);
    }
}
