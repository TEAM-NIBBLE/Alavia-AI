# Alavia-AI

Multilingual, voice-first AI health triage assistant for Nigeria. This MVP provides rule-based triage, first aid guidance, and smart hospital routing for Lagos. It is **not** a diagnosis or prescription system.

## Hackathon Demo Summary
- Voice-first triage: STT ? structured questions ? rule-based severity
- Multilingual: English, Pidgin, Yoruba, Hausa, Igbo
- Smart routing: ranked Lagos hospitals by distance + specialty + emergency readiness
- Admin tools: manage hospitals + analytics
- OpenAI: speech (STT/TTS) + optional phrasing

## What This Does
User flow:
1. User registers/logs in
2. Starts a consultation
3. Speaks symptoms ? STT ? triage questions
4. Rule engine decides severity + first aid + recommended specialty
5. Hospitals are ranked by location and suitability
6. TTS speaks responses back to the user

## Repo Structure
- `backend/alavia-api` — Laravel 12 REST API
- `frontend` — React + TypeScript (Vite)

## Backend Features
- Auth (Sanctum) + profile
- Consultations with encrypted messages (AES-256)
- Rule-based triage with optional AI category detection
- Lagos hospitals sync from Overpass API
- Hospitals search & routing with Haversine ranking
- Speech endpoints (STT / TTS)
- Admin CRUD + analytics
- OpenAPI + Postman collection + payload samples

## Frontend (Quick Start)
```bash
cd frontend
npm install
npm run dev
```

## Backend (Quick Start)
```bash
cd backend/alavia-api
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate
php artisan storage:link
```

### Required Backend Env Vars
- `APP_KEY`
- `DB_CONNECTION`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`
- `OPENAI_API_KEY` (or `OPENAI_KEY` fallback)
- `ENCRYPTION_KEY`
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`

### Optional Backend Env Vars
- `TRIAGE_AI_ENABLED` (false by default)
- `OVERPASS_URL`, `OVERPASS_LAGOS_BBOX`

## Demo Commands
Sync Lagos hospitals:
```bash
php artisan hospitals:sync-lagos --limit=50
```

Seed hospital meta (facilities/specialties templates):
```bash
php artisan db:seed --class=HospitalMetaSeeder
```

Run tests:
```bash
php artisan test
```

## Key API Endpoints
Auth:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`

Consultations:
- `POST /api/consultations/start`
- `POST /api/consultations/{id}/message`
- `GET /api/consultations/{id}`

Hospitals:
- `GET /api/hospitals` (filters + ranking)
- `GET /api/hospitals/{id}`

Speech:
- `POST /api/speech/stt`
- `POST /api/speech/tts`

Admin:
- `POST /api/admin/login`
- `GET/POST/PATCH/DELETE /api/admin/hospitals`
- `GET /api/admin/analytics/overview`

Full payload examples:
- `backend/alavia-api/docs/payloads.md`

OpenAPI spec:
- `backend/alavia-api/docs/openapi.yaml`

Postman collection:
- `backend/alavia-api/docs/postman_collection.json`

## Safety + Scope
This MVP:
- Does **not** diagnose or prescribe
- Uses deterministic rule-based severity
- Uses AI only for speech and optional phrasing/categorization

## License
Hackathon prototype. All rights reserved by the team.
