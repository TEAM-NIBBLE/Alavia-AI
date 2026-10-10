<?php

namespace App\Services\OpenAI;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

class OpenAIClient
{
    private string $apiKey;
    private string $baseUrl;

    public function __construct()
    {
        // GROQ_API_KEY switches chat + transcription to Groq (OpenAI-compatible API).
        if ($groq = (string) env('GROQ_API_KEY')) {
            $this->apiKey = $groq;
            $this->baseUrl = 'https://api.groq.com/openai/v1';
        } else {
            $this->apiKey = (string) (env('OPENAI_API_KEY') ?: env('OPENAI_KEY'));
            $this->baseUrl = (string) env('OPENAI_BASE_URL', 'https://api.openai.com/v1');
        }
    }

    public function configured(): bool
    {
        return $this->apiKey !== '';
    }

    public function chatModel(): string
    {
        return $this->chatModels()[0];
    }

    /** @return array<int, string> Models to try in order (each has its own rate limit on Groq). */
    public function chatModels(): array
    {
        return $this->usingGroq()
            ? ['openai/gpt-oss-120b', 'qwen/qwen3.8-27b', 'openai/gpt-oss-20b']
            : ['gpt-4o-mini'];
    }

    public function usingGroq(): bool
    {
        return str_contains($this->baseUrl, 'groq.com');
    }

    public function postJson(string $path, array $payload): Response
    {
        return $this->request()
            ->asJson()
            ->post($this->baseUrl . $path, $payload);
    }

    public function postMultipart(string $path, array $payload, string $fileField, string $filePath, string $fileName): Response
    {
        return $this->request()
            ->attach($fileField, fopen($filePath, 'r'), $fileName)
            ->post($this->baseUrl . $path, $payload);
    }

    private function request(): PendingRequest
    {
        return Http::withToken($this->apiKey)
            ->timeout(120);
    }
}
