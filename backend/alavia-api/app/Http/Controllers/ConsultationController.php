<?php

namespace App\Http\Controllers;

use App\Http\Requests\Consultation\MessageRequest;
use App\Http\Requests\Consultation\StartConsultationRequest;
use App\Models\Consultation;
use App\Models\ConsultationMessage;
use App\Services\CryptoService;
use App\Services\TriageClassifier;
use App\Services\TriageEngine;
use App\Services\TriageQuestions;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConsultationController extends Controller
{
    public function start(
        StartConsultationRequest $request,
        CryptoService $cryptoService
    ): JsonResponse {
        $user = $request->user();
        $language = $request->validated()['language'] ?? ($user->language ?? 'EN');

        $consultation = Consultation::create([
            'user_id' => $user->id,
            'status' => 'ACTIVE',
            'category' => null,
        ]);

        $initialMessage = $request->validated()['initial_message'] ?? null;
        if ($initialMessage) {
            ConsultationMessage::create([
                'consultation_id' => $consultation->id,
                'role' => 'USER',
                'content_encrypted' => $cryptoService->encrypt($initialMessage),
            ]);
        }

        $firstQuestion = TriageQuestions::all()[$language]['GENERAL'][0] ?? 'What symptoms are you feeling right now?';
        $aiMessage = ConsultationMessage::create([
            'consultation_id' => $consultation->id,
            'role' => 'AI',
            'content_encrypted' => $cryptoService->encrypt($firstQuestion),
        ]);

        return response()->json([
            'consultation_id' => $consultation->id,
            'message' => [
                'id' => $aiMessage->id,
                'role' => 'AI',
                'content' => $firstQuestion,
            ],
        ], 201);
    }

    public function message(
        MessageRequest $request,
        int $id,
        CryptoService $cryptoService,
        TriageEngine $triageEngine,
        TriageClassifier $triageClassifier
    ): JsonResponse {
        $consultation = Consultation::where('user_id', $request->user()->id)
            ->findOrFail($id);

        if ($consultation->status === 'COMPLETED') {
            return response()->json([
                'error' => [
                    'message' => 'Consultation is already completed.',
                    'type' => 'consultation',
                ],
            ], 409);
        }

        $userMessage = ConsultationMessage::create([
            'consultation_id' => $consultation->id,
            'role' => 'USER',
            'content_encrypted' => $cryptoService->encrypt($request->validated()['content']),
        ]);

        $language = $request->validated()['language'] ?? ($request->user()->language ?? 'EN');
        $messages = ConsultationMessage::where('consultation_id', $consultation->id)
            ->orderBy('id')
            ->get()
            ->map(function (ConsultationMessage $message) use ($cryptoService) {
                return [
                    'role' => $message->role,
                    'content' => $cryptoService->decrypt($message->content_encrypted),
                ];
            });

        $signals = null;
        if (filter_var(env('TRIAGE_AI_ENABLED', false), FILTER_VALIDATE_BOOLEAN)) {
            $lastUserText = $messages->where('role', 'USER')->pluck('content')->last() ?? '';
            $signals = $triageClassifier->classify((string) $lastUserText, $language);
        }

        $result = $triageEngine->evaluate($consultation, $messages, $language, $signals);

        $consultation->category = $result['category'];

        if ($result['complete']) {
            $consultation->status = 'COMPLETED';
            $consultation->severity = $result['severity'];
            $consultation->recommended_specialty = $result['recommended_specialty'];
            $consultation->first_aid_json = $result['first_aid'];
            $consultation->warnings_json = $result['warnings'];
            $consultation->summary_encrypted = $cryptoService->encrypt((string) $result['summary']);
        }

        $consultation->save();

        $aiContent = $result['complete']
            ? $this->formatFinalResponse($result)
            : (string) $result['next_question'];

        $aiMessage = ConsultationMessage::create([
            'consultation_id' => $consultation->id,
            'role' => 'AI',
            'content_encrypted' => $cryptoService->encrypt($aiContent),
        ]);

        return response()->json([
            'consultation_id' => $consultation->id,
            'status' => $consultation->status,
            'severity' => $consultation->severity,
            'message' => [
                'id' => $aiMessage->id,
                'role' => 'AI',
                'content' => $aiContent,
            ],
        ]);
    }

    public function show(Request $request, int $id, CryptoService $cryptoService): JsonResponse
    {
        $consultation = Consultation::where('user_id', $request->user()->id)
            ->findOrFail($id);

        $messages = ConsultationMessage::where('consultation_id', $consultation->id)
            ->orderBy('id')
            ->get()
            ->map(function (ConsultationMessage $message) use ($cryptoService) {
                return [
                    'id' => $message->id,
                    'role' => $message->role,
                    'content' => $cryptoService->decrypt($message->content_encrypted),
                    'created_at' => $message->created_at,
                ];
            });

        return response()->json([
            'consultation' => [
                'id' => $consultation->id,
                'status' => $consultation->status,
                'severity' => $consultation->severity,
                'category' => $consultation->category,
                'recommended_specialty' => $consultation->recommended_specialty,
                'first_aid' => $consultation->first_aid_json,
                'warnings' => $consultation->warnings_json,
                'summary' => $consultation->summary_encrypted
                    ? $cryptoService->decrypt($consultation->summary_encrypted)
                    : null,
                'created_at' => $consultation->created_at,
                'updated_at' => $consultation->updated_at,
            ],
            'messages' => $messages,
        ]);
    }

    public function history(Request $request, CryptoService $cryptoService): JsonResponse
    {
        $consultations = Consultation::where('user_id', $request->user()->id)
            ->orderByDesc('id')
            ->get()
            ->map(function (Consultation $consultation) use ($cryptoService) {
                return [
                    'id' => $consultation->id,
                    'status' => $consultation->status,
                    'severity' => $consultation->severity,
                    'category' => $consultation->category,
                    'summary' => $consultation->summary_encrypted
                        ? $cryptoService->decrypt($consultation->summary_encrypted)
                        : null,
                    'created_at' => $consultation->created_at,
                ];
            });

        return response()->json([
            'data' => $consultations,
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $consultation = Consultation::where('user_id', $request->user()->id)
            ->findOrFail($id);

        $consultation->delete();

        return response()->json(['status' => 'ok']);
    }

    /**
     * @param array<string, mixed> $result
     */
    private function formatFinalResponse(array $result): string
    {
        $firstAid = implode(' ', $result['first_aid'] ?? []);
        $warnings = implode(' ', $result['warnings'] ?? []);

        return trim(
            "Severity: {$result['severity']}\n"
            . "First Aid: {$firstAid}\n"
            . "Warnings: {$warnings}\n"
            . "Recommended Specialty: {$result['recommended_specialty']}"
        );
    }
}
