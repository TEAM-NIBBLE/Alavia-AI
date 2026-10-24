<?php

it('returns book-grounded matches with citations for a known symptom', function () {
    $response = $this->getJson('/api/book/symptoms/search?q=fever');

    $response->assertStatus(200)
        ->assertJsonStructure([
            'query',
            'matches' => [
                ['symptom', 'summary', 'danger_signs', 'when_to_seek_care', 'citation', 'source_chapters'],
            ],
            'withheld_needs_review',
            'source',
            'disclaimer',
        ]);

    expect($response->json('matches'))->not->toBeEmpty();
    expect($response->json('source'))->toContain('Where There Is No Doctor');
});

it('returns no matches for a query that matches nothing', function () {
    $response = $this->getJson('/api/book/symptoms/search?q=zzzzqqq');

    $response->assertStatus(200);
    expect($response->json('matches'))->toBeEmpty();
});

it('requires a query', function () {
    $response = $this->getJson('/api/book/symptoms/search');

    $response->assertStatus(422);
});
