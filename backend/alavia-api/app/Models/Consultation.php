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
        'guest_token_hash',
        'status',
        'severity',
        'category',
        'summary_encrypted',
        'recommended_specialty',
        'first_aid_json',
        'warnings_json',
        'follow_up_due_at',
        'follow_up_outcome',
        'follow_up_at',
        'feedback_helpful',
        'feedback_comment_encrypted',
        'feedback_at',
    ];

    protected function casts(): array
    {
        return [
            'first_aid_json' => 'array',
            'warnings_json' => 'array',
            'follow_up_due_at' => 'datetime',
            'follow_up_at' => 'datetime',
            'feedback_at' => 'datetime',
            'feedback_helpful' => 'boolean',
        ];
    }
}
