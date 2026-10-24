<?php

namespace App\Services;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;

/**
 * Retrieval over the Where There Is No Doctor symptom index.
 *
 * The index lives in resources/data/wtnd/part-*.json (267 entries derived
 * from Hesperian's 2025 edition). Answers are grounded in the book: every
 * match carries its source chapters and citation, danger signs are kept
 * separate from general guidance, and entries flagged NEEDS-REVIEW are
 * never served to users until a clinician has checked them.
 *
 * This is health information, not a diagnosis. Dosages are deliberately
 * absent from the index; dosage questions belong to the book's green
 * medicine pages and to a health worker.
 */
class WtndSymptomRetrieval
{
    public const SOURCE = 'Where There Is No Doctor (Hesperian Health Guides, 2025 edition)';

    public const DISCLAIMER = 'Health information from Where There Is No Doctor. This is not a medical diagnosis and does not replace a trained health worker or doctor. In an emergency, seek care immediately.';

    /** @var array<int, array>|null */
    private ?array $entries = null;

    /**
     * @return array{query: string, matches: array<int, array>, withheld_needs_review: int, source: string, disclaimer: string}
     */
    public function search(string $query, int $limit = 5): array
    {
        $normalized = TriageLexicon::normalize($query);
        $tokens = array_values(array_filter(explode(' ', $normalized)));

        if ($tokens === []) {
            return $this->result($query, [], 0);
        }

        $scored = [];
        $withheld = 0;

        foreach ($this->entries() as $entry) {
            $score = $this->score($entry, $normalized, $tokens);

            if ($score === 0) {
                continue;
            }

            if (($entry['status'] ?? '') === 'NEEDS-REVIEW') {
                $withheld++;
                continue;
            }

            $scored[] = ['score' => $score, 'entry' => $entry];
        }

        usort($scored, function (array $a, array $b): int {
            if ($a['score'] !== $b['score']) {
                return $b['score'] <=> $a['score'];
            }

            return strcmp((string) $a['entry']['symptom'], (string) $b['entry']['symptom']);
        });

        $matches = array_map(function (array $item): array {
            $entry = $item['entry'];

            return [
                'symptom' => $entry['symptom'] ?? '',
                'alternate_names' => $entry['alternate_names'] ?? [],
                'summary' => $entry['summary'] ?? '',
                'danger_signs' => $entry['danger_signs'] ?? [],
                'when_to_seek_care' => $entry['when_to_seek_care'] ?? '',
                'citation' => $entry['citation'] ?? '',
                'source_chapters' => $entry['source_chapters'] ?? [],
            ];
        }, array_slice($scored, 0, $limit));

        return $this->result($query, $matches, $withheld);
    }

    private function result(string $query, array $matches, int $withheld): array
    {
        return [
            'query' => $query,
            'matches' => $matches,
            'withheld_needs_review' => $withheld,
            'source' => self::SOURCE,
            'disclaimer' => self::DISCLAIMER,
        ];
    }

    /**
     * Score an entry against the query. Exact symptom and alternate-name
     * matches win; otherwise the score follows token overlap, with at least
     * half the query tokens required to match so vague queries do not
     * return weak guesses.
     */
    private function score(array $entry, string $query, array $tokens): int
    {
        $names = [TriageLexicon::normalize((string) ($entry['symptom'] ?? ''))];

        foreach ((array) ($entry['alternate_names'] ?? []) as $alt) {
            $names[] = TriageLexicon::normalize((string) $alt);
        }

        foreach ($names as $name) {
            if ($name !== '' && $name === $query) {
                return 100;
            }
        }

        foreach ($names as $name) {
            if ($name !== '' && str_contains($name, $query)) {
                return 80;
            }
        }

        $best = 0;

        foreach ($names as $name) {
            $matched = 0;

            foreach ($tokens as $token) {
                if (str_contains($name, $token)) {
                    $matched++;
                }
            }

            if ($matched > 0 && $matched >= (int) ceil(count($tokens) / 2)) {
                $best = max($best, (int) round(60 * $matched / count($tokens)));
            }
        }

        return $best;
    }

    /** @return array<int, array> */
    private function entries(): array
    {
        if ($this->entries !== null) {
            return $this->entries;
        }

        $this->entries = [];
        $dir = resource_path('data/wtnd');

        if (! File::isDirectory($dir)) {
            Log::warning('WTND symptom index directory is missing.', ['dir' => $dir]);

            return $this->entries;
        }

        $files = File::files($dir);

        usort($files, fn ($a, $b) => strcmp($a->getFilename(), $b->getFilename()));

        foreach ($files as $file) {
            if ($file->getExtension() !== 'json') {
                continue;
            }

            $decoded = json_decode($file->getContents(), true);

            if (is_array($decoded)) {
                array_push($this->entries, ...$decoded);
            }
        }

        return $this->entries;
    }
}
