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
