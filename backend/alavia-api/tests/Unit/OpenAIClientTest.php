<?php

use App\Services\OpenAI\OpenAIClient;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

uses(TestCase::class);

it('posts json with auth header to openai base url', function () {
    Http::fake();

    putenv('OPENAI_API_KEY=test-key');
    putenv('OPENAI_BASE_URL=https://api.openai.com/v1');
    $_ENV['OPENAI_API_KEY'] = 'test-key';
    $_SERVER['OPENAI_API_KEY'] = 'test-key';
    $_ENV['OPENAI_BASE_URL'] = 'https://api.openai.com/v1';
    $_SERVER['OPENAI_BASE_URL'] = 'https://api.openai.com/v1';

    $client = new OpenAIClient();
    $client->postJson('/chat/completions', ['model' => 'gpt-4o-mini']);

    Http::assertSent(function (Request $request) {
        return $request->url() === 'https://api.openai.com/v1/chat/completions'
            && $request->method() === 'POST'
            && $request->hasHeader('Authorization', 'Bearer test-key');
    });
});

it('posts multipart to openai base url', function () {
    Http::fake();

    putenv('OPENAI_API_KEY=test-key');
    putenv('OPENAI_BASE_URL=https://api.openai.com/v1');
    $_ENV['OPENAI_API_KEY'] = 'test-key';
    $_SERVER['OPENAI_API_KEY'] = 'test-key';
    $_ENV['OPENAI_BASE_URL'] = 'https://api.openai.com/v1';
    $_SERVER['OPENAI_BASE_URL'] = 'https://api.openai.com/v1';

    $tmp = tempnam(sys_get_temp_dir(), 'audio');
    file_put_contents($tmp, 'audio');

    $client = new OpenAIClient();
    $client->postMultipart('/audio/transcriptions', ['model' => 'gpt-4o-mini-transcribe'], 'file', $tmp, 'audio.wav');

    Http::assertSent(function (Request $request) {
        return $request->url() === 'https://api.openai.com/v1/audio/transcriptions'
            && $request->method() === 'POST'
            && $request->hasHeader('Authorization', 'Bearer test-key');
    });
});
