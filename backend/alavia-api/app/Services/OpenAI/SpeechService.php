<?php

namespace App\Services\OpenAI;

use Illuminate\Support\Facades\Http;
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
            'model' => $this->client->usingGroq() ? 'whisper-large-v3-turbo' : 'gpt-4o-mini-transcribe',
            'response_format' => 'json',
        ];

        // Whisper wants ISO-639-1; Pidgin has none, so it is transcribed as English.
        $code = match (strtolower(substr((string) $language, 0, 2))) {
            'en', 'pc', 'pi' => 'en',
            'yo' => 'yo',
            'ha' => 'ha',
            'ig' => 'ig',
            default => null,
        };
        if ($code) {
            $payload['language'] = $code;
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
        // YarnGPT (Nigerian voices for English, Pidgin, Hausa, Yoruba, Igbo) is the preferred voice.
        // It returns a short-lived streaming link the browser plays directly, so sound starts at once
        // and the API key never leaves the server.
        if ($yarnKey = (string) env('YARNGPT_API_KEY')) {
            return $this->yarnStream($text, $yarnKey);
        }

        $extension = 'mp3';
        if ($this->client->usingGroq()) {
            if (! in_array(strtoupper($language), ['EN', 'PIDGIN', 'PCM'], true)) {
                // An English voice reading Yoruba/Hausa/Igbo would be wrong; stay silent instead.
                throw new RuntimeException('No cloud voice for this language.');
            }
            // Groq's Orpheus voice is English only (Pidgin reads acceptably) and takes <= 200 characters.
            $payload = [
                'model' => 'canopylabs/orpheus-v1-english',
                'input' => mb_substr($text, 0, 200),
                'voice' => 'hannah',
                'response_format' => 'wav',
            ];
            $extension = 'wav';
        } else {
            $payload = [
                'model' => 'gpt-4o-mini-tts',
                'input' => $text,
                'voice' => $voice,
                'format' => 'mp3',
            ];
        }

        $response = $this->client->postJson('/audio/speech', $payload);

        if (! $response->successful()) {
            throw new RuntimeException('OpenAI text-to-speech failed.');
        }

        $disk = Storage::disk('public');
        $disk->makeDirectory('tts');

        $fileName = Str::uuid()->toString() . '.' . $extension;
        $path = 'tts/' . $fileName;
        $disk->put($path, $response->body());

        return [
            'path' => $path,
            'url' => $disk->url($path),
        ];
    }

    /**
     * @return array{url: string, path: string}
     */
    private function yarnStream(string $text, string $apiKey): array
    {
        $base = rtrim((string) env('YARNGPT_BASE_URL', 'https://api.yarngpt.ai'), '/');

        $response = Http::withToken($apiKey)
            ->timeout(20)
            ->asJson()
            ->post($base . '/api/v1/tts/prepare', array_filter([
                'text' => mb_substr($text, 0, 15000),
                'voice' => env('YARNGPT_VOICE', 'adaora'),
                'output_format' => 'mp3',
            ]));

        $streamUrl = $response->json('stream_url');
        if (! $response->successful() || ! is_string($streamUrl)) {
            throw new RuntimeException('YarnGPT text-to-speech failed (' . $response->status() . ').');
        }

        return ['path' => '', 'url' => $base . $streamUrl];
    }
}
