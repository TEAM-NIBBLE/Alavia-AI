<?php

namespace App\Services\OpenAI;

use RuntimeException;

class ChatService
{
    public function __construct(private OpenAIClient $client)
    {
    }

    public function phrase(string $text, string $language): string
    {
        $payload = [
            'model' => 'gpt-4o-mini',
            'messages' => [
                [
                    'role' => 'system',
                    'content' => 'You are a medical assistant that rephrases responses in the requested language clearly and safely.',
                ],
                [
                    'role' => 'user',
                    'content' => "Language: {$language}\nText: {$text}",
                ],
            ],
        ];

        $response = $this->client->postJson('/chat/completions', $payload);

        if (! $response->successful()) {
            throw new RuntimeException('OpenAI chat completion failed.');
        }

        return (string) ($response->json('choices.0.message.content') ?? $text);
    }
}
