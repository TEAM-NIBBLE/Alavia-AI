<?php

use App\Services\OpenAI\ChatService;
use App\Services\OpenAI\OpenAIClient;
use App\Services\OpenAI\SpeechService;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

uses(TestCase::class);

it('speech service throws on transcription failure', function () {
    Http::fake([
        'api.openai.com/v1/audio/transcriptions' => Http::response(['error' => 'bad'], 500),
    ]);

    $service = new SpeechService(new OpenAIClient());

    $tmp = tempnam(sys_get_temp_dir(), 'audio');
    file_put_contents($tmp, 'audio');

    expect(fn () => $service->transcribe($tmp, 'audio.wav'))
        ->toThrow(\RuntimeException::class);
});

it('speech service throws on tts failure', function () {
    Http::fake([
        'api.openai.com/v1/audio/speech' => Http::response(['error' => 'bad'], 500),
    ]);

    $service = new SpeechService(new OpenAIClient());

    expect(fn () => $service->textToSpeech('hello', 'alloy', 'en'))
        ->toThrow(\RuntimeException::class);
});

it('chat service returns response content', function () {
    Http::fake([
        'api.openai.com/v1/chat/completions' => Http::response([
            'choices' => [
                ['message' => ['content' => 'translated text']],
            ],
        ], 200),
    ]);

    $service = new ChatService(new OpenAIClient());
    $result = $service->phrase('hello', 'EN');

    expect($result)->toBe('translated text');
});

it('chat service throws on failure', function () {
    Http::fake([
        'api.openai.com/v1/chat/completions' => Http::response(['error' => 'bad'], 500),
    ]);

    $service = new ChatService(new OpenAIClient());

    expect(fn () => $service->phrase('hello', 'EN'))
        ->toThrow(\RuntimeException::class);
});
