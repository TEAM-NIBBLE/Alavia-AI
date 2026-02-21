<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Consultation extends Model
{
    /** @use HasFactory<\Database\Factories\ConsultationFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'status',
        'severity',
        'category',
        'summary_encrypted',
        'recommended_specialty',
        'first_aid_json',
        'warnings_json',
    ];

    protected function casts(): array
    {
        return [
            'first_aid_json' => 'array',
            'warnings_json' => 'array',
        ];
    }
}
