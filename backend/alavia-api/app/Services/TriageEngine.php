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
        $text = Str::lower($messages->where('role', 'USER')->pluck('content')->implode(' '));

        if (Str::contains($text, ['chest', 'heart', 'pressure', 'tightness', 'pain in chest'])) {
            return 'CHEST';
        }

        if (Str::contains($text, ['fever', 'temperature', 'hot body', 'body hot', 'iba'])) {
            return 'FEVER';
        }

        if (Str::contains($text, ['eye', 'red eye', 'watery', 'blurred vision', 'vision'])) {
            return 'EYE';
        }

        if (Str::contains($text, ['stomach', 'abdominal', 'belly', 'diarrhea', 'vomit', 'nausea'])) {
            return 'GI';
        }

        if (Str::contains($text, ['headache', 'migraine', 'head pain', 'dizzy', 'dizziness'])) {
            return 'HEAD';
        }

        if (Str::contains($text, ['cough', 'wheezing', 'shortness of breath', 'breathing', 'asthma'])) {
            return 'RESP';
        }

        if (Str::contains($text, ['rash', 'itch', 'skin', 'hives', 'eczema'])) {
            return 'SKIN';
        }

        if (Str::contains($text, ['weakness', 'numb', 'numbness', 'seizure', 'slurred', 'stroke'])) {
            return 'NEURO';
        }

        if (Str::contains($text, ['urine', 'urinating', 'pee', 'burning', 'flank', 'kidney'])) {
            return 'URO';
        }

        if (Str::contains($text, ['joint', 'muscle', 'sprain', 'back pain', 'leg pain', 'arm pain'])) {
            return 'MUSCULO';
        }

        return 'GENERAL';
    }

    /**
     * @return array<int, string>
     */
    private function getQuestions(string $category, string $language): array
    {
        $all = TriageQuestions::all();
        $lang = $all[$language] ?? $all['EN'];
        $en = $all['EN'];

        return $lang[$category]
            ?? $en[$category]
            ?? $lang['GENERAL']
            ?? $en['GENERAL'];
    }

    /**
     * @param array<string, mixed>|null $signals
     * @return array{severity: string, first_aid: array<int,string>, warnings: array<int,string>, specialty: string, summary: string}
     */
    private function determineSeverity(Collection $messages, string $category, ?array $signals = null): array
    {
        $text = Str::lower($messages->where('role', 'USER')->pluck('content')->implode(' '));

        $redFlags = [
            'trouble breathing',
            'shortness of breath',
            'left arm',
            'jaw',
            'sweating',
            'faint',
            'unconscious',
            'vision loss',
            'seizure',
            'severe bleeding',
        ];

        $severity = 'MEDIUM';
        $signalFlags = array_map('strtolower', (array) ($signals['red_flags'] ?? []));
        if (! empty($signalFlags) || Str::contains($text, $redFlags)) {
            $severity = 'CRITICAL';
        } elseif (Str::contains($text, ['severe', '10/10', 'very painful'])) {
            $severity = 'HIGH';
        } elseif (Str::contains($text, ['mild', '2/10', '3/10'])) {
            $severity = 'LOW';
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
