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

it('speech service uses YarnGPT streaming when a key is configured', function () {
    setYarnKey('sk_test_key');

    Http::fake([
        'api.yarngpt.ai/api/v1/tts/prepare' => Http::response([
            'ticket' => 't', 'stream_url' => '/api/v1/tts/stream/t', 'expires_in' => 300,
        ], 200),
    ]);

    $result = (new SpeechService(new OpenAIClient()))->textToSpeech('Bawo ni', 'Idera', 'YORUBA');

    expect($result['url'])->toBe('https://api.yarngpt.ai/api/v1/tts/stream/t');
    Http::assertSent(fn ($request) => $request->hasHeader('Authorization', 'Bearer sk_test_key')
        && $request['text'] === 'Bawo ni');

    setYarnKey('');
});

it('speech service throws when YarnGPT refuses', function () {
    setYarnKey('sk_test_key');

    Http::fake(['api.yarngpt.ai/api/v1/tts/prepare' => Http::response(['error' => 'x'], 401)]);

    expect(fn () => (new SpeechService(new OpenAIClient()))->textToSpeech('Bawo ni', 'Idera', 'YORUBA'))
        ->toThrow(\RuntimeException::class);

    setYarnKey('');
});

function setYarnKey(string $value): void
{
    config(['alavia.yarngpt.key' => $value]);
}
