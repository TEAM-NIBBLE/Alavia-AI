<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ConsultationMessage extends Model
{
    /** @use HasFactory<\Database\Factories\ConsultationMessageFactory> */
    use HasFactory;

    protected $fillable = [
        'consultation_id',
        'role',
        'content_encrypted',
    ];
}
