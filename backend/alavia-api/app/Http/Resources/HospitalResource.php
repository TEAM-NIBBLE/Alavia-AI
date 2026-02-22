<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class HospitalResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'osm_type' => $this->osm_type,
            'osm_id' => $this->osm_id,
            'name' => $this->name,
            'address' => $this->address,
            'state' => $this->state,
            'lga' => $this->lga,
            'lat' => $this->lat,
            'lng' => $this->lng,
            'rating' => $this->rating,
            'rating_count' => $this->rating_count,
            'is_public' => $this->is_public,
            'is_24_hours' => $this->is_24_hours,
            'emergency_ready' => $this->emergency_ready,
            'distance_km' => $this->distance_km ?? null,
            'specialties' => $this->specialties->pluck('specialty_name')->toArray(),
            'facilities' => $this->facilities->pluck('facility_name')->toArray(),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
