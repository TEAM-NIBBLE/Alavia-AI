<?php

// App settings read via config() so they keep working after `php artisan config:cache`
// (env() returns null outside config files once the config is cached).
return [
    'triage_ai_enabled' => env('TRIAGE_AI_ENABLED', false),
    'encryption_key' => env('ENCRYPTION_KEY'),

    'groq_key' => env('GROQ_API_KEY'),

    'openai' => [
        'key' => env('OPENAI_API_KEY') ?: env('OPENAI_KEY'),
        'base_url' => env('OPENAI_BASE_URL', 'https://api.openai.com/v1'),
    ],

    'yarngpt' => [
        'key' => env('YARNGPT_API_KEY'),
        'base_url' => env('YARNGPT_BASE_URL', 'https://api.yarngpt.ai'),
        'voice' => env('YARNGPT_VOICE', 'adaora'),
    ],

    'overpass' => [
        'url' => env('OVERPASS_URL', 'https://overpass-api.de/api/interpreter'),
        'lagos_bbox' => env('OVERPASS_LAGOS_BBOX', '6.35,2.70,6.80,3.70'),
    ],
];
