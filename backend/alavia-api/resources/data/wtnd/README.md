# Where There Is No Doctor: symptom index

Symptom-by-symptom index derived from "Where There Is No Doctor: A Village
Health Care Handbook" by David Werner, with Carol Thuman and Jane Maxwell
(Hesperian Health Guides, 2025 edition, ISBN 978-0-942364-15-6), built from
Hesperian's official free chapter PDFs.

## Files

- `part-01.json` ... `part-06.json`: JSON arrays that together hold 267
  symptom entries. The retrieval service loads every part file in this
  directory and merges them.
- Entry fields: `symptom`, `alternate_names`, `source_chapters`, `summary`,
  `danger_signs`, `when_to_seek_care`, `citation`, `status`, `review_note`.

## Safety rules (do not weaken these)

- Entries with status NEEDS-REVIEW (18 at the time of writing) must NOT be
  served to users until a clinician has checked them against the book.
- No medicine dosages are included in this index by design. Dosage questions
  point to the book's green medicine pages and to a health worker.
- This index is health information from the book, not a medical diagnosis,
  and it does not replace a trained health worker or doctor.

## Permission

Hesperian's Open Copyright Policy asks for written permission before any use
in a digital format and before any translation. A permission request was sent
to permissions@hesperian.org on 2026-10-24 and is pending. Do not ship a
commercial edition of anything built on this index until that permission is
granted. Credit Hesperian in the app wherever book content is shown.
