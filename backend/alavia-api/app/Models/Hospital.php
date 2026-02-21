<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Hospital extends Model
{
    /** @use HasFactory<\Database\Factories\HospitalFactory> */
    use HasFactory;

    protected $fillable = [
        'osm_type',
        'osm_id',
        'name',
        'address',
        'state',
        'lga',
        'lat',
        'lng',
        'rating',
        'rating_count',
        'is_public',
        'is_24_hours',
        'emergency_ready',
    ];

    protected function casts(): array
    {
        return [
            'lat' => 'decimal:7',
            'lng' => 'decimal:7',
            'rating' => 'decimal:1',
            'is_public' => 'boolean',
            'is_24_hours' => 'boolean',
            'emergency_ready' => 'boolean',
        ];
    }

    public function facilities()
    {
        return $this->hasMany(HospitalFacility::class);
    }

    public function specialties()
    {
        return $this->hasMany(HospitalSpecialty::class);
    }
}
