<?php

namespace App\Services;

use App\Models\Consultation;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class TriageEngine
{
    /**
     * @param Collection<int, array{role: string, content: string}> $messages
     * @param array<string, mixed>|null $signals
     * @return array{category: string, next_question: string|null, complete: bool, severity: string|null, summary: string|null, first_aid: array<int,string>|null, warnings: array<int,string>|null, recommended_specialty: string|null}
     */
    public function evaluate(Consultation $consultation, Collection $messages, string $language, ?array $signals = null): array
    {
        $category = $signals['category'] ?? $this->detectCategory($messages);
        $questions = $this->getQuestions($category, $language);

        $userCount = $messages->where('role', 'USER')->count();
        $aiCount = $messages->where('role', 'AI')->count();
        $nextIndex = max(0, $userCount);

        $complete = $nextIndex >= count($questions);
        $severity = null;
        $summary = null;
        $firstAid = null;
        $warnings = null;
        $recommendedSpecialty = null;

        if ($complete) {
            $analysis = $this->determineSeverity($messages, $category, $signals);
            $severity = $analysis['severity'];
            $firstAid = $analysis['first_aid'];
            $warnings = $analysis['warnings'];
            $recommendedSpecialty = $analysis['specialty'];
            $summary = $analysis['summary'];
        }

        return [
            'category' => $category,
            'next_question' => $complete ? null : ($questions[$nextIndex] ?? null),
            'complete' => $complete,
            'severity' => $severity,
            'summary' => $summary,
            'first_aid' => $firstAid,
            'warnings' => $warnings,
            'recommended_specialty' => $recommendedSpecialty,
        ];
    }

    private function detectCategory(Collection $messages): string
    {
        $text = TriageLexicon::normalize($messages->where('role', 'USER')->pluck('content')->implode(' '));

        // Immediately dangerous complaints decide the category first, in any language.
        if (TriageLexicon::hasAny($text, TriageLexicon::CHEST)) {
            return 'CHEST';
        }

        if (TriageLexicon::hasAny($text, TriageLexicon::BREATHING)) {
            return 'RESP';
        }

        if (TriageLexicon::hasAny($text, TriageLexicon::NEURO_FLAGS)) {
            return 'NEURO';
        }

        if (Str::contains($text, ['fever', 'temperature', 'hot body', 'body hot', 'iba']) || $this->inCategory($text, 'FEVER')) {
            return 'FEVER';
        }

        if (Str::contains($text, ['eye', 'red eye', 'watery', 'blurred vision', 'vision'])) {
            return 'EYE';
        }

        if (Str::contains($text, ['stomach', 'abdominal', 'belly', 'diarrhea', 'vomit', 'nausea']) || $this->inCategory($text, 'GI')) {
            return 'GI';
        }

        if (Str::contains($text, ['headache', 'migraine', 'head pain', 'dizzy', 'dizziness']) || $this->inCategory($text, 'HEAD')) {
            return 'HEAD';
        }

        if (Str::contains($text, ['cough', 'wheezing', 'shortness of breath', 'breathing', 'asthma']) || $this->inCategory($text, 'RESP')) {
            return 'RESP';
        }

        if (Str::contains($text, ['rash', 'itch', 'skin', 'hives', 'eczema']) || $this->inCategory($text, 'SKIN')) {
            return 'SKIN';
        }

        if (Str::contains($text, ['weakness', 'numb', 'numbness', 'seizure', 'slurred', 'stroke']) || $this->inCategory($text, 'NEURO')) {
            return 'NEURO';
        }

        if (Str::contains($text, ['urine', 'urinating', 'pee', 'burning', 'flank', 'kidney']) || $this->inCategory($text, 'URO')) {
            return 'URO';
        }

        if (Str::contains($text, ['joint', 'muscle', 'sprain', 'back pain', 'leg pain', 'arm pain']) || $this->inCategory($text, 'MUSCULO')) {
            return 'MUSCULO';
        }

        return 'GENERAL';
    }

    private function inCategory(string $text, string $category): bool
    {
        return TriageLexicon::hasAny($text, TriageLexicon::CATEGORY[$category] ?? []);
    }

    /**
     * @return array<int, string>
     */
    private function getQuestions(string $category, string $language): array
    {
        $all = TriageQuestions::all();
        $lang = $all[$language] ?? $all['EN'];
        $en = $all['EN'];

        // Prefer the user's own language over a more specific English question set:
        // breathing problems reuse the chest questions, anything else the translated general set.
        $related = $category === 'RESP' ? 'CHEST' : 'GENERAL';

        return $lang[$category]
            ?? $lang[$related]
            ?? $en[$category]
            ?? $en['GENERAL'];
    }

    /** Latest 0-10 score the person gave (e.g. "3", "6 out of 10", "7/10"), or null. */
    private function painScore(Collection $messages): ?int
    {
        foreach ($messages->where('role', 'USER')->pluck('content')->reverse() as $text) {
            if (preg_match('/\b(day|days|hour|hours|week|weeks|month|year|years|yr|hr|min|ọjọ́|ọjọ|ọdún|wákàtí|kwana|awa|sa\'a|ụbọchị|afọ)\b/iu', (string) $text)) {
                continue;
            }
            if (preg_match('/(?<![\d.])(10|[0-9])(?![\d])\s*(?:\/|out of|nínú|na|cikin|n\'ime|from)?\s*10?\b/iu', (string) $text, $m)
                && (int) $m[1] <= 10
                && mb_strlen(trim((string) $text)) <= 40) {
                return (int) $m[1];
            }
        }

        return null;
    }

    /**
     * @param array<string, mixed>|null $signals
     * @return array{severity: string, first_aid: array<int,string>, warnings: array<int,string>, specialty: string, summary: string}
     */
    private function determineSeverity(Collection $messages, string $category, ?array $signals = null): array
    {
        $text = TriageLexicon::normalize($messages->where('role', 'USER')->pluck('content')->implode(' '));

        $hasBreathingTrouble = TriageLexicon::hasAny($text, TriageLexicon::BREATHING);
        $isUnconscious = TriageLexicon::hasAny($text, TriageLexicon::UNCONSCIOUS);
        $isBleeding = TriageLexicon::hasAny($text, TriageLexicon::BLEEDING);
        $hasNeuroFlag = TriageLexicon::hasAny($text, TriageLexicon::NEURO_FLAGS);
        $isSevere = TriageLexicon::hasAny($text, TriageLexicon::SEVERE);
        $isMild = TriageLexicon::hasAny($text, TriageLexicon::MILD);

        // Sweating / pain spreading to the arm or jaw only count as red flags for chest complaints;
        // elsewhere "sweating" is just a fever symptom.
        $chestRedFlag = $category === 'CHEST'
            && TriageLexicon::hasAny($text, ['sweating', 'sweat', 'left arm', 'jaw', 'faint', 'dey sweat', 'left hand', 'crushing']);

        $signalFlags = array_map('strtolower', (array) ($signals['red_flags'] ?? []));

        // The person's own 0-10 score for pain/discomfort: low means low, high means high.
        $score = $this->painScore($messages);
        $isMild = $isMild || ($score !== null && $score <= 3);
        $isSevere = $isSevere || ($score !== null && $score >= 7);

        if (! empty($signalFlags) || $hasBreathingTrouble || $isUnconscious || $isBleeding || $hasNeuroFlag || $chestRedFlag) {
            $severity = 'CRITICAL';
        } elseif ($category === 'CHEST') {
            // Chest pain is never downgraded below HIGH unless the person calls it mild.
            $severity = $isMild && ! $isSevere ? 'MEDIUM' : 'HIGH';
        } elseif ($isSevere) {
            $severity = 'HIGH';
        } elseif ($isMild) {
            $severity = 'LOW';
        } else {
            $severity = 'MEDIUM';
        }

        $firstAid = match ($category) {
            'CHEST' => [
                'Sit upright and rest.',
                'Avoid exertion.',
                'Do not take unknown medications.',
            ],
            'FEVER' => [
                'Rest and stay hydrated.',
                'Use light clothing and keep cool.',
                'Monitor temperature regularly.',
            ],
            'EYE' => [
                'Avoid rubbing the eye.',
                'Rinse with clean water if irritated.',
                'Seek care if vision changes.',
            ],
            'GI' => [
                'Sip fluids to avoid dehydration.',
                'Eat light foods if tolerated.',
                'Avoid self-medicating without guidance.',
            ],
            'HEAD' => [
                'Rest in a quiet, dark place.',
                'Stay hydrated.',
                'Seek care if severe or sudden.',
            ],
            'RESP' => [
                'Sit upright and rest.',
                'Avoid smoke or irritants.',
                'Seek care if breathing worsens.',
            ],
            'SKIN' => [
                'Keep the area clean.',
                'Avoid scratching.',
                'Seek care if swelling or fever occurs.',
            ],
            'NEURO' => [
                'Seek urgent care for sudden weakness or speech trouble.',
                'Do not drive yourself if severe symptoms.',
                'Rest and keep safe.',
            ],
            'URO' => [
                'Drink water if tolerated.',
                'Seek care if fever or blood in urine.',
                'Avoid self-medicating.',
            ],
            'MUSCULO' => [
                'Rest the affected area.',
                'Apply a cold compress for swelling.',
                'Seek care if severe pain or fever.',
            ],
            default => [
                'Rest and avoid strenuous activity.',
                'Stay hydrated.',
                'Seek care if symptoms worsen.',
            ],
        };

        $warnings = match ($category) {
            'CHEST' => [
                'Trouble breathing',
                'Pain spreading to arm or jaw',
                'Fainting or heavy sweating',
            ],
            'FEVER' => [
                'Persistent high fever',
                'Confusion or seizures',
                'Unable to keep fluids down',
            ],
            'EYE' => [
                'Vision loss',
                'Severe pain',
                'Eye injury or chemical exposure',
            ],
            'GI' => [
                'Severe abdominal pain',
                'Blood in vomit or stool',
                'Persistent vomiting',
            ],
            'HEAD' => [
                'Sudden severe headache',
                'Neck stiffness',
                'Confusion or seizures',
            ],
            'RESP' => [
                'Severe shortness of breath',
                'Chest pain',
                'Blue lips or face',
            ],
            'SKIN' => [
                'Rapidly spreading rash',
                'Fever with rash',
                'Swelling of face or lips',
            ],
            'NEURO' => [
                'Sudden weakness',
                'Speech problems',
                'Loss of consciousness',
            ],
            'URO' => [
                'Blood in urine',
                'Severe back pain',
                'Fever with urinary symptoms',
            ],
            'MUSCULO' => [
                'Severe swelling',
                'Inability to move limb',
                'Fever with joint pain',
            ],
            default => [
                'Severe pain',
                'Breathing difficulty',
                'Sudden worsening of symptoms',
            ],
        };

        $specialty = match ($category) {
            'CHEST' => 'Cardiology / Emergency Medicine',
            'FEVER' => 'Internal Medicine / Infectious Disease',
            'EYE' => 'Ophthalmology',
            'GI' => 'Gastroenterology',
            'HEAD' => 'Neurology / Emergency Medicine',
            'RESP' => 'Pulmonology / Emergency Medicine',
            'SKIN' => 'Dermatology',
            'NEURO' => 'Neurology / Emergency Medicine',
            'URO' => 'Urology',
            'MUSCULO' => 'Orthopedics',
            default => 'General Practice / Emergency Medicine',
        };

        $summary = strtoupper($category) . ' triage completed with severity ' . $severity . '.';

        return [
            'severity' => $severity,
            'first_aid' => $firstAid,
            'warnings' => $warnings,
            'specialty' => $specialty,
            'summary' => $summary,
        ];
    }
}
