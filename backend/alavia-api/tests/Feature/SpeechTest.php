<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

it('transcribes audio and deletes the uploaded file', function () {
    Storage::fake('local');

    Http::fake([
        'api.openai.com/v1/audio/transcriptions' => Http::response([
            'text' => 'hello world',
        ], 200),
    ]);

    $file = UploadedFile::fake()->create('voice.wav', 200, 'audio/wav');

    $response = $this->postJson('/api/speech/stt', [
        'audio' => $file,
        'language' => 'en',
    ]);

    $response->assertStatus(200)->assertJson([
        'transcript' => 'hello world',
    ]);

    Storage::disk('local')->assertMissing($file->hashName());
});

it('generates tts audio and returns public url', function () {
    Storage::fake('public');

    Http::fake([
        'api.openai.com/v1/audio/speech' => Http::response('AUDIOBYTES', 200),
    ]);

    $response = $this->postJson('/api/speech/tts', [
        'text' => 'Hello there',
        'language' => 'en',
        'voice' => 'alloy',
    ]);

    $response->assertStatus(200)->assertJsonStructure(['audio_url']);

    Storage::disk('public')->assertExists('tts');
});
