<?php

use App\Models\Consultation;
use App\Services\TriageEngine;

function msg(string $role, string $content): array
{
    return ['role' => $role, 'content' => $content];
}

it('detects chest category', function () {
    $engine = new TriageEngine();
    $consultation = new Consultation();

    $messages = collect([
        msg('USER', 'I have chest pain and pressure.'),
    ]);

    $result = $engine->evaluate($consultation, $messages, 'EN');

    expect($result['category'])->toBe('CHEST');
    expect($result['next_question'])->not()->toBeNull();
});

it('detects fever category', function () {
    $engine = new TriageEngine();
    $consultation = new Consultation();

    $messages = collect([
        msg('USER', 'I have a fever and hot body.'),
    ]);

    $result = $engine->evaluate($consultation, $messages, 'EN');

    expect($result['category'])->toBe('FEVER');
});

it('completes triage and sets critical severity when red flags present', function () {
    $engine = new TriageEngine();
    $consultation = new Consultation();

    $messages = collect([
        msg('USER', 'I have chest pain.'),
        msg('USER', 'I have trouble breathing and sweating.'),
        msg('USER', 'It spreads to my left arm.'),
        msg('USER', 'It is 9 out of 10.'),
        msg('USER', 'I feel faint.'),
    ]);

    $result = $engine->evaluate($consultation, $messages, 'EN');

    expect($result['complete'])->toBeTrue();
    expect($result['severity'])->toBe('CRITICAL');
    expect($result['recommended_specialty'])->not()->toBeNull();
    expect($result['first_aid'])->toBeArray();
    expect($result['warnings'])->toBeArray();
});

it('returns next question in requested language', function () {
    $engine = new TriageEngine();
    $consultation = new Consultation();

    $messages = collect([
        msg('USER', 'I have chest pain.'),
    ]);

    $result = $engine->evaluate($consultation, $messages, 'PIDGIN');

    expect($result['next_question'])->toContain('left hand');
});

function completeTriage(string $language, array $answers): array
{
    $engine = new TriageEngine();
    $messages = collect(array_map(fn ($a) => msg('USER', $a), $answers));

    return $engine->evaluate(new Consultation(), $messages, $language);
}

it('treats breathing trouble in every supported language as critical', function (string $language, string $first, array $rest) {
    $result = completeTriage($language, array_merge([$first], $rest));

    expect($result['complete'])->toBeTrue();
    expect($result['severity'])->toBe('CRITICAL');
})->with([
    'english' => ['EN', 'I have chest pain', ['I cannot breathe', 'since 20 minutes', 'yes']],
    'pidgin' => ['PIDGIN', 'my chest dey pain me', ['I no fit breathe well', 'small time ago', 'yes']],
    'yoruba' => ['YORUBA', 'àyà mi ń dùn mí', ['mi ò lè mí dáadáa', 'ní ìṣẹ́jú díẹ̀ sẹ́yìn', 'bẹ́ẹ̀ ni']],
    'hausa' => ['HAUSA', 'ina da ciwon ƙirji', ['ba zan iya numfashi ba', 'tun jiya', 'eh']],
    'igbo' => ['IGBO', 'obi m na-egbu m mgbu', ['enweghị m ike iku ume', 'kemgbe nkeji iri abụọ', 'ee']],
]);

it('detects chest complaints written in local languages', function (string $language, string $text) {
    $result = completeTriage($language, [$text]);

    expect($result['category'])->toBe('CHEST');
})->with([
    ['YORUBA', 'àyà mi ń dùn mí gan-an'],
    ['HAUSA', 'ina da ciwon ƙirji'],
    ['IGBO', 'obi m na-egbu m mgbu'],
]);

it('does not flag negated red flags as critical', function () {
    $result = completeTriage('EN', ['I have a mild fever', 'no trouble breathing', 'since morning', 'mild']);

    expect($result['severity'])->not()->toBe('CRITICAL');
});

it('never rates a non-mild chest complaint below high', function () {
    $result = completeTriage('EN', ['chest pain', 'it comes and goes', 'since yesterday', 'moderate']);

    expect($result['severity'])->toBeIn(['HIGH', 'CRITICAL']);
});

it('does not treat sweating with a fever as a critical red flag', function () {
    $result = completeTriage('EN', ['I have a fever', 'I am sweating at night', 'two days', 'mild']);

    expect($result['category'])->toBe('FEVER');
    expect($result['severity'])->not()->toBe('CRITICAL');
});

it('rates a mild headache as low', function () {
    $result = completeTriage('EN', ['mild headache', 'since morning', 'no fever', 'mild']);

    expect($result['severity'])->toBe('LOW');
});

it('treats a low 0-10 pain score as low severity', function () {
    $engine = new TriageEngine();
    $messages = collect([
        msg('USER', 'I have a headache'), msg('AI', 'q1'),
        msg('USER', 'since this afternoon'), msg('AI', 'q2'),
        msg('USER', 'no fever'), msg('AI', 'q3'),
        msg('USER', '2 out of 10'),
    ]);

    $result = $engine->evaluate(new Consultation(), $messages, 'EN');

    expect($result['complete'])->toBeTrue();
    expect($result['severity'])->toBe('LOW');
});

it('treats a high 0-10 pain score as high severity', function () {
    $engine = new TriageEngine();
    $messages = collect([
        msg('USER', 'my stomach hurts'), msg('AI', 'q1'),
        msg('USER', 'since morning'), msg('AI', 'q2'),
        msg('USER', 'no vomiting'), msg('AI', 'q3'),
        msg('USER', '8/10'),
    ]);

    $result = $engine->evaluate(new Consultation(), $messages, 'EN');

    expect($result['severity'])->toBe('HIGH');
});

it('does not read a duration as a pain score', function () {
    $engine = new TriageEngine();
    $messages = collect([
        msg('USER', 'my stomach hurts'), msg('AI', 'q1'),
        msg('USER', 'for 2 days'), msg('AI', 'q2'),
        msg('USER', 'no vomiting'), msg('AI', 'q3'),
        msg('USER', 'it is bad'),
    ]);

    $result = $engine->evaluate(new Consultation(), $messages, 'EN');

    expect($result['severity'])->not()->toBe('LOW');
});
