<?php

namespace App\Services;

use App\Services\OpenAI\OpenAIClient;
use RuntimeException;

class TriageClassifier
{
    private array $categories = [
        'CHEST',
        'FEVER',
        'GENERAL',
        'EYE',
        'GI',
        'HEAD',
        'RESP',
        'SKIN',
        'NEURO',
        'URO',
        'MUSCULO',
    ];

    public function __construct(private OpenAIClient $client)
    {
    }

    /**
     * @return array{category: string, symptoms: array<int,string>, red_flags: array<int,string>, duration: string|null}|null
     */
    public function classify(string $transcript, string $language): ?array
    {
        $schema = [
            'category' => 'one of: ' . implode(', ', $this->categories),
            'symptoms' => 'array of short strings',
            'red_flags' => 'array of short strings (only if explicitly mentioned)',
            'duration' => 'string or null',
        ];

        $payload = [
            'model' => 'gpt-4o-mini',
            'messages' => [
                [
                    'role' => 'system',
                    'content' => 'You are a medical triage classifier. Output JSON only. No diagnosis. Do not add symptoms not stated.',
                ],
                [
                    'role' => 'user',
                    'content' => "Language: {$language}\nTranscript: {$transcript}\nReturn JSON with keys: category, symptoms, red_flags, duration.\nAllowed categories: " . implode(', ', $this->categories) . "\nSchema: " . json_encode($schema),
                ],
            ],
            'temperature' => 0,
        ];

        $response = $this->client->postJson('/chat/completions', $payload);
        if (! $response->successful()) {
            return null;
        }

        $content = (string) ($response->json('choices.0.message.content') ?? '');
        $data = json_decode($content, true);

        if (! is_array($data)) {
            return null;
        }

        $category = strtoupper((string) ($data['category'] ?? ''));
        if (! in_array($category, $this->categories, true)) {
            return null;
        }

        return [
            'category' => $category,
            'symptoms' => array_values(array_filter((array) ($data['symptoms'] ?? []), 'is_string')),
            'red_flags' => array_values(array_filter((array) ($data['red_flags'] ?? []), 'is_string')),
            'duration' => isset($data['duration']) ? (string) $data['duration'] : null,
        ];
    }
}
