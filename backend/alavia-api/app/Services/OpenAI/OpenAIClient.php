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
        $this->apiKey = (string) (env('OPENAI_API_KEY') ?: env('OPENAI_KEY'));
        $this->baseUrl = (string) env('OPENAI_BASE_URL', 'https://api.openai.com/v1');
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
