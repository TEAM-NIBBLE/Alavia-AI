<?php

namespace App\Services\OpenAI;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

class SpeechService
{
    public function __construct(private OpenAIClient $client)
    {
    }

    public function transcribe(string $filePath, string $fileName, ?string $language = null): string
    {
        $payload = [
            'model' => 'gpt-4o-mini-transcribe',
            'response_format' => 'json',
        ];

        if ($language) {
            $payload['language'] = $language;
        }

        $response = $this->client->postMultipart('/audio/transcriptions', $payload, 'file', $filePath, $fileName);

        if (! $response->successful()) {
            throw new RuntimeException('OpenAI transcription failed.');
        }

        return (string) ($response->json('text') ?? '');
    }

    /**
     * @return array{url: string, path: string}
     */
    public function textToSpeech(string $text, string $voice, string $language): array
    {
        $payload = [
            'model' => 'gpt-4o-mini-tts',
            'input' => $text,
            'voice' => $voice,
            'format' => 'mp3',
        ];

        $response = $this->client->postJson('/audio/speech', $payload);

        if (! $response->successful()) {
            throw new RuntimeException('OpenAI text-to-speech failed.');
        }

        $disk = Storage::disk('public');
        $disk->makeDirectory('tts');

        $fileName = Str::uuid()->toString() . '.mp3';
        $path = 'tts/' . $fileName;
        $disk->put($path, $response->body());

        return [
            'path' => $path,
            'url' => $disk->url($path),
        ];
    }
}
