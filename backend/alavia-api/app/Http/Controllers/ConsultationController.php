<?php

namespace App\Http\Controllers;

use App\Http\Requests\Consultation\MessageRequest;
use App\Http\Requests\Consultation\StartConsultationRequest;
use App\Models\Consultation;
use App\Models\ConsultationMessage;
use App\Services\CryptoService;
use App\Services\TriageClassifier;
use App\Services\TriageAdvisor;
use App\Services\TriageEngine;
use App\Services\TriageQuestions;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ConsultationController extends Controller
{
    public function start(
        StartConsultationRequest $request,
        CryptoService $cryptoService,
        TriageAdvisor $triageAdvisor
    ): JsonResponse {
        // Works signed in or as a guest (emergency use without an account).
        $user = $request->user('sanctum');
        $language = $request->validated()['language'] ?? ($user?->language ?? 'EN');

        $guestToken = null;
        $consultation = Consultation::create([
            'user_id' => $user?->id,
            'guest_token_hash' => $user ? null : hash('sha256', $guestToken = Str::random(48)),
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

        $firstQuestion = null;
        $guided = false;
        $startAnswerType = null;
        // If they already described their problem, follow up on that instead of asking again.
        if ($initialMessage && $triageAdvisor->available($language)) {
            $advice = $triageAdvisor->advise(collect([['role' => 'USER', 'content' => $initialMessage]]), $language, true);
            if ($advice !== null && ! $advice['complete']) {
                $firstQuestion = $advice['question'];
                $startAnswerType = $advice['answer_type'] ?? null;
                $guided = true;
                $consultation->update(['category' => $advice['category']]);
            }
        }
        $firstQuestion ??= TriageQuestions::all()[$language]['GENERAL'][0] ?? 'What symptoms are you feeling right now?';
        $aiMessage = ConsultationMessage::create([
            'consultation_id' => $consultation->id,
            'role' => 'AI',
            'content_encrypted' => $cryptoService->encrypt($firstQuestion),
        ]);

        return response()->json(array_filter([
            'consultation_id' => $consultation->id,
            'guest_token' => $guestToken,
            'guided' => $guided,
            'answer_type' => $startAnswerType,
            'message' => [
                'id' => $aiMessage->id,
                'role' => 'AI',
                'content' => $firstQuestion,
            ],
        ], fn ($value) => $value !== null), 201);
    }

    public function message(
        MessageRequest $request,
        int $id,
        CryptoService $cryptoService,
        TriageEngine $triageEngine,
        TriageClassifier $triageClassifier,
        TriageAdvisor $triageAdvisor
    ): JsonResponse {
        $consultation = $this->ownedConsultation($request, $id);

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

        $language = $request->validated()['language'] ?? ($request->user('sanctum')?->language ?? 'EN');
        $messages = ConsultationMessage::where('consultation_id', $consultation->id)
            ->orderBy('id')
            ->get()
            ->map(function (ConsultationMessage $message) use ($cryptoService) {
                return [
                    'role' => $message->role,
                    'content' => $cryptoService->decrypt($message->content_encrypted),
                ];
            });

        // The language model runs the conversation when it is configured; the rule-based engine
        // is the fallback (and the safety floor for red flags) so triage never stops working.
        $guided = false;
        $answerType = null;
        $result = null;
        if ($triageAdvisor->available($language)) {
            $advice = $triageAdvisor->advise($messages, $language);
            if ($advice !== null) {
                $guided = true;
                $answerType = $advice['answer_type'] ?? null;
                $result = [
                    'category' => $advice['category'],
                    'next_question' => $advice['question'],
                    'complete' => $advice['complete'],
                    'severity' => $advice['severity'],
                    'summary' => $advice['summary'],
                    'first_aid' => $advice['first_aid'],
                    'warnings' => $advice['warnings'],
                    'recommended_specialty' => $advice['specialty'],
                ];
            }
        }

        if ($result === null) {
            $signals = null;
            if (filter_var(config('alavia.triage_ai_enabled'), FILTER_VALIDATE_BOOLEAN)) {
                $lastUserText = $messages->where('role', 'USER')->pluck('content')->last() ?? '';
                $signals = $triageClassifier->classify((string) $lastUserText, $language);
            }

            $result = $triageEngine->evaluate($consultation, $messages, $language, $signals);
        }

        $consultation->category = $result['category'];

        if ($result['complete']) {
            $consultation->status = 'COMPLETED';
            $consultation->severity = $result['severity'];
            $consultation->recommended_specialty = $result['recommended_specialty'];
            $consultation->first_aid_json = $result['first_aid'];
            $consultation->warnings_json = $result['warnings'];
            $consultation->summary_encrypted = $cryptoService->encrypt((string) $result['summary']);
            $consultation->follow_up_due_at = $this->followUpDueAt((string) $result['severity']);
        }

        $consultation->save();

        $aiContent = $result['complete']
            ? ($guided ? (string) $result['summary'] : $this->formatFinalResponse($result))
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
            'follow_up_due_at' => $consultation->follow_up_due_at,
            'guided' => $guided,
            'answer_type' => $answerType,
            'message' => [
                'id' => $aiMessage->id,
                'role' => 'AI',
                'content' => $aiContent,
            ],
        ]);
    }

    public function show(Request $request, int $id, CryptoService $cryptoService): JsonResponse
    {
        $consultation = $this->ownedConsultation($request, $id);

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
                'follow_up_due_at' => $consultation->follow_up_due_at,
                'follow_up_outcome' => $consultation->follow_up_outcome,
                'feedback_helpful' => $consultation->feedback_helpful,
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

    /**
     * "Was this helpful?" feedback after a completed consultation.
     */
    public function feedback(Request $request, int $id, CryptoService $cryptoService): JsonResponse
    {
        $data = $request->validate([
            'helpful' => ['required', 'boolean'],
            'comment' => ['nullable', 'string', 'max:1000'],
        ]);

        $consultation = $this->ownedConsultation($request, $id);
        $consultation->feedback_helpful = (bool) $data['helpful'];
        $consultation->feedback_comment_encrypted = ! empty($data['comment'])
            ? $cryptoService->encrypt($data['comment'])
            : null;
        $consultation->feedback_at = now();
        $consultation->save();

        return response()->json(['status' => 'ok']);
    }

    /**
     * The person's answer to Alavia's check-back ("how are you feeling now?").
     * WORSE comes back flagged so the client can escalate to emergency help right away.
     */
    public function followUp(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'outcome' => ['required', 'in:BETTER,SAME,WORSE'],
        ]);

        $consultation = $this->ownedConsultation($request, $id);

        if ($consultation->status !== 'COMPLETED') {
            return response()->json([
                'error' => ['message' => 'Consultation is not completed yet.', 'type' => 'consultation'],
            ], 409);
        }

        $consultation->follow_up_outcome = $data['outcome'];
        $consultation->follow_up_at = now();
        $consultation->save();

        return response()->json([
            'status' => 'ok',
            'escalate' => $data['outcome'] === 'WORSE',
            // SAME on a serious case is also worth a second look; the client uses severity to decide.
            'severity' => $consultation->severity,
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $consultation = Consultation::where('user_id', $request->user()->id)
            ->findOrFail($id);

        $consultation->delete();

        return response()->json(['status' => 'ok']);
    }

    /** Sooner check-backs for more serious outcomes. */
    private function followUpDueAt(string $severity): \Illuminate\Support\Carbon
    {
        return match (strtoupper($severity)) {
            'CRITICAL' => now()->addHour(),
            'HIGH' => now()->addHours(2),
            'MEDIUM' => now()->addHours(6),
            default => now()->addHours(24),
        };
    }

    /**
     * Resolve a consultation the caller owns: either their own (signed in) or a guest
     * consultation proven by the X-Guest-Token header. Anything else is a 404.
     */
    private function ownedConsultation(Request $request, int $id): Consultation
    {
        $user = $request->user('sanctum');

        if ($user) {
            return Consultation::where('user_id', $user->id)->findOrFail($id);
        }

        $token = (string) $request->header('X-Guest-Token', '');
        abort_if($token === '', 401, 'Unauthenticated.');

        return Consultation::whereNull('user_id')
            ->where('guest_token_hash', hash('sha256', $token))
            ->findOrFail($id);
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
