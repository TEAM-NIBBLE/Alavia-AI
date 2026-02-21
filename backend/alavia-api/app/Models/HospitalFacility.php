<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HospitalFacility extends Model
{
    /** @use HasFactory<\Database\Factories\HospitalFacilityFactory> */
    use HasFactory;

    protected $fillable = [
        'hospital_id',
        'facility_name',
    ];
}
