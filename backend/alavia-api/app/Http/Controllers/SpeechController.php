<?php

namespace App\Http\Controllers;

use App\Http\Requests\Speech\TextToSpeechRequest;
use App\Http\Requests\Speech\TranscribeRequest;
use App\Services\OpenAI\SpeechService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class SpeechController extends Controller
{
    public function stt(TranscribeRequest $request, SpeechService $speechService): JsonResponse
    {
        $file = $request->file('audio');
        $path = $file->store('tmp');

        try {
            $transcript = $speechService->transcribe(
                Storage::disk('local')->path($path),
                $file->getClientOriginalName(),
                $request->input('language')
            );
        } finally {
            Storage::disk('local')->delete($path);
        }

        return response()->json([
            'transcript' => $transcript,
        ]);
    }

    public function tts(TextToSpeechRequest $request, SpeechService $speechService): JsonResponse
    {
        $data = $request->validated();

        try {
            $result = $speechService->textToSpeech(
                $data['text'],
                $data['voice'],
                $data['language']
            );
        } catch (\RuntimeException $e) {
            // No cloud voice configured/available: the app falls back to the browser's voice.
            return response()->json([
                'error' => ['message' => 'Cloud text-to-speech is unavailable.', 'type' => 'tts_unavailable'],
            ], 503);
        }

        return response()->json([
            'audio_url' => $result['url'],
        ]);
    }
}
