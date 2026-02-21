<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HospitalSpecialty extends Model
{
    /** @use HasFactory<\Database\Factories\HospitalSpecialtyFactory> */
    use HasFactory;

    protected $fillable = [
        'hospital_id',
        'specialty_name',
    ];
}
