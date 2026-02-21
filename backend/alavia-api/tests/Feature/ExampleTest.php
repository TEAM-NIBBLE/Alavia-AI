<?php

it('returns a successful response', function () {
    $response = $this->getJson('/api/health');

    $response->assertStatus(200)
        ->assertJson(['status' => 'ok']);
});
