<?php

namespace App\Services;

use App\Services\OpenAI\OpenAIClient;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Runs the triage conversation with a language model: it asks the next question based on what the
 * person actually said, uses their 0-10 pain answer, and finishes with guidance in their language.
 *
 * The rule-based TriageLexicon stays in charge of safety: it can raise the severity (and force the
 * conversation to wrap up) but the model can never lower a red-flag result.
 */
class TriageAdvisor
{
    public const MAX_USER_TURNS = 6;
    private const MIN_USER_TURNS = 2;

    private const LANGUAGE_NAMES = [
        'EN' => 'English',
        'PIDGIN' => 'Nigerian Pidgin',
        'YORUBA' => 'Yoruba',
        'HAUSA' => 'Hausa',
        'IGBO' => 'Igbo',
    ];

    private const SPECIALTIES = [
        'General Practice', 'Emergency Medicine', 'Cardiology', 'Pulmonology', 'Neurology', 'Internal Medicine',
        'Gastroenterology', 'Ophthalmology', 'Dermatology', 'Urology', 'Orthopedics', 'Obstetrics and Gynecology',
        'Paediatrics', 'ENT', 'Dental', 'Psychiatry',
    ];

    public function __construct(private OpenAIClient $client)
    {
    }

    /**
     * The model writes good English and Pidgin but not reliable Yoruba, Hausa or Igbo medical text,
     * so those languages keep the curated, translated question sets.
     */
    public function available(string $language = 'EN'): bool
    {
        return in_array($language, ['EN', 'PIDGIN'], true)
            && filter_var(config('alavia.triage_ai_enabled'), FILTER_VALIDATE_BOOLEAN)
            && $this->client->configured();
    }

    /**
     * @param Collection<int, array{role: string, content: string}> $messages
     * @return array{complete: bool, question: ?string, severity: ?string, category: string, specialty: ?string,
     *               summary: ?string, first_aid: array<int,string>, warnings: array<int,string>}|null
     */
    public function advise(Collection $messages, string $language, bool $askOnly = false): ?array
    {
        $userText = TriageLexicon::normalize($messages->where('role', 'USER')->pluck('content')->implode(' '));
        $userTurns = $messages->where('role', 'USER')->count();

        $criticalFlag = TriageLexicon::hasAny($userText, TriageLexicon::BREATHING)
            || TriageLexicon::hasAny($userText, TriageLexicon::UNCONSCIOUS)
            || TriageLexicon::hasAny($userText, TriageLexicon::BLEEDING)
            || TriageLexicon::hasAny($userText, TriageLexicon::NEURO_FLAGS)
            || (TriageLexicon::hasAny($userText, TriageLexicon::CHEST)
                && TriageLexicon::hasAny($userText, ['sweating', 'sweat', 'left arm', 'jaw', 'faint', 'dey sweat', 'left hand', 'crushing']));

        // $askOnly: the opening reply must always be a question (the result comes on a later turn).
        $mustFinish = ! $askOnly && ($criticalFlag || $userTurns >= self::MAX_USER_TURNS);
        $mayFinish = ! $askOnly && $userTurns >= self::MIN_USER_TURNS;

        $data = $this->ask($messages, $language, $mustFinish, $mayFinish);
        if ($data === null) {
            return null;
        }

        $done = $mustFinish || (bool) ($data['done'] ?? false);
        if ($done && ! $mayFinish && ! $mustFinish) {
            $done = false;
        }

        if (! $done) {
            $question = trim((string) ($data['question'] ?? ''));

            return $question === '' ? null : [
                'complete' => false,
                'question' => $question,
                'answer_type' => in_array($data['answer_type'] ?? '', ['yes_no', 'scale', 'open'], true) ? $data['answer_type'] : 'open',
                'severity' => null,
                'category' => $this->category($data),
                'specialty' => null,
                'summary' => null,
                'first_aid' => [],
                'warnings' => [],
            ];
        }

        $severity = strtoupper((string) ($data['severity'] ?? 'MEDIUM'));
        if (! in_array($severity, ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], true)) {
            $severity = 'MEDIUM';
        }
        if ($criticalFlag) {
            $severity = 'CRITICAL';
        }

        $summary = trim((string) ($data['assessment'] ?? ''));
        if ($summary === '') {
            Log::warning('Triage advisor finished without an assessment: ' . substr((string) json_encode($data), 0, 300));

            return null;
        }

        $specialty = (string) ($data['specialty'] ?? '');
        $firstAid = $this->strings($data['first_aid'] ?? []);
        $warnings = $this->strings($data['warnings'] ?? []);

        // A red flag the person described outranks the model's calmer reading: never show an
        // emergency badge next to text that says "no need for hospital".
        if ($criticalFlag && strtoupper((string) ($data['severity'] ?? '')) !== 'CRITICAL') {
            $pidgin = $language === 'PIDGIN';
            $summary = $pidgin
                ? 'Wetin you talk get warning signs wey fit dey dangerous. Abeg go the nearest hospital now, or call emergency number.'
                : 'What you described includes warning signs that can be dangerous. Please go to the nearest hospital now, or call emergency services.';
            $firstAid = $pidgin
                ? ['Sit up well and try stay calm.', 'No go alone. Call person wey dey near you.', 'Call emergency number or go hospital now.']
                : ['Sit upright and try to stay calm.', 'Do not go alone; ask someone nearby to help.', 'Call emergency services or go to the nearest hospital now.'];
            $warnings = [];
            $specialty = 'Emergency Medicine';
        }

        return [
            'complete' => true,
            'question' => null,
            'answer_type' => null,
            'severity' => $severity,
            'category' => $this->category($data),
            'specialty' => in_array($specialty, self::SPECIALTIES, true) ? $specialty : 'General Practice',
            'summary' => $summary,
            'first_aid' => $firstAid,
            'warnings' => $warnings,
        ];
    }

    /**
     * @param Collection<int, array{role: string, content: string}> $messages
     * @return array<string, mixed>|null
     */
    private function ask(Collection $messages, string $language, bool $mustFinish, bool $mayFinish): ?array
    {
        $languageName = self::LANGUAGE_NAMES[$language] ?? 'English';
        $categories = implode(', ', ['CHEST', 'FEVER', 'EYE', 'GI', 'HEAD', 'RESP', 'SKIN', 'NEURO', 'URO', 'MUSCULO', 'GENERAL']);
        $specialties = implode(', ', self::SPECIALTIES);

        $finishRule = match (true) {
            $mustFinish => 'You MUST finish now (done=true) and give the assessment.',
            $mayFinish => 'Finish (done=true) once you have enough to judge severity, usually after 3 to 5 answers. Otherwise ask one more question.',
            default => 'Do NOT finish yet (done=false); ask your next question.',
        };

        $system = <<<PROMPT
You are Alavia, a health triage assistant for people in Nigeria. You are NOT a doctor: never diagnose and never name a specific disease as certain; describe what the symptoms may point to and what to do next.

Write every user-facing string in {$languageName}, in short, simple, warm sentences. Never mix in English unless the language is English.

How to run the conversation:
- Read everything the person has said. Ask exactly ONE short question at a time that fits THEIR complaint (onset, duration, what makes it better or worse, related symptoms). Never ask something they already answered.
- Ask for a 0-10 score once for pain or discomfort, and actually use their answer.
- {$finishRule}

Severity, judged from what they told you (never from the symptom's category alone):
- LOW: mild, short-lived, no warning signs (for example pain of 3/10 or less, a mild cold). Self-care at home; a clinic visit is NOT needed unless it persists or worsens.
- MEDIUM: should see a clinician in the next day or two.
- HIGH: needs care today.
- CRITICAL: emergency now (trouble breathing, chest pain with sweating or arm or jaw pain, fainting or unconsciousness, heavy bleeding, stroke signs, seizure, severe allergic reaction, and similar).
Do not send someone to hospital for a mild problem; do not play down a dangerous one.

Reply with JSON only, no markdown:
{"done": boolean, "question": string (when done=false), "answer_type": "yes_no" if the question can be answered yes or no, "scale" if it asks for a 0-10 score, else "open" (when done=false), "category": one of [{$categories}], "severity": "LOW|MEDIUM|HIGH|CRITICAL" (when done=true), "specialty": one of [{$specialties}] (when done=true), "assessment": 2-3 sentence plain-language summary of what you understood and what to do now, including whether they need a hospital and how soon (when done=true), "first_aid": 3-4 short practical steps fitted to this complaint and severity (when done=true), "warnings": 2-3 danger signs that mean they must get urgent care (when done=true)}
PROMPT;

        $chat = [['role' => 'system', 'content' => $system]];
        foreach ($messages as $message) {
            $chat[] = [
                'role' => $message['role'] === 'USER' ? 'user' : 'assistant',
                'content' => (string) $message['content'],
            ];
        }

        if ($mustFinish) {
            $chat[] = [
                'role' => 'user',
                'content' => '[System: stop asking questions. Set done=true and fill in category, severity, specialty, assessment, first_aid and warnings now, in ' . $languageName . '.]',
            ];
        }

        // Each model has its own rate budget; fall through the list when one is exhausted or fails.
        foreach ($this->client->chatModels() as $model) {
            $payload = [
                'model' => $model,
                'messages' => $chat,
                'temperature' => 0.3,
                'max_completion_tokens' => 900,
                'response_format' => ['type' => 'json_object'],
            ];
            if (str_starts_with($model, 'openai/gpt-oss')) {
                $payload['reasoning_effort'] = 'low';
            }

            try {
                $response = $this->client->postJson('/chat/completions', $payload);
            } catch (Throwable $e) {
                Log::warning("Triage advisor {$model} failed: " . $e->getMessage());
                continue;
            }

            if (! $response->successful()) {
                Log::warning("Triage advisor {$model} HTTP " . $response->status() . ' ' . substr($response->body(), 0, 200));
                continue;
            }

            $content = (string) ($response->json('choices.0.message.content') ?? '');
            $data = json_decode($content, true);
            if (is_array($data)) {
                return $data;
            }
            Log::warning("Triage advisor {$model} returned non-JSON");
        }

        return null;
    }

    /** @param array<string, mixed> $data */
    private function category(array $data): string
    {
        $category = strtoupper((string) ($data['category'] ?? 'GENERAL'));

        return in_array($category, ['CHEST', 'FEVER', 'EYE', 'GI', 'HEAD', 'RESP', 'SKIN', 'NEURO', 'URO', 'MUSCULO', 'GENERAL'], true)
            ? $category
            : 'GENERAL';
    }

    /** @return array<int, string> */
    private function strings(mixed $value): array
    {
        return array_values(array_filter(array_map(
            fn ($v) => is_string($v) ? trim($v) : '',
            (array) $value
        ), fn ($v) => $v !== ''));
    }
}
