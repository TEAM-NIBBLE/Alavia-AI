# Alavia-AI

Alavia-AI is a multilingual, voice-first AI health triage assistant built for Nigeria. It provides guided symptom collection, rule-based triage, first-aid guidance, and smart hospital routing. It is an MVP and is not a replacement for medical advice, diagnosis, or prescription.

**What the AI does**
- Collects user symptoms via voice (STT) or text and keeps a short, conversational triage flow.
- Uses a deterministic rule engine (and optional AI categorization) to assess severity and recommend first-aid steps.
- Routes users to nearby hospitals ranked by distance, specialty, and emergency readiness.
- Speaks responses back to users using TTS; supports multiple Nigerian languages.

**How it works (high level)**
- Frontend sends user input to the backend consultation endpoints.
- Backend runs the triage flow: emits the next question, evaluates answers against rules, and updates consultation status.
- If the consultation is marked complete, backend produces first-aid advice, severity, and recommended specialty, and returns a consultation detail summary.
- Speech endpoints handle STT (audio → transcript) and TTS (text → audio URL). The UI auto-plays TTS and either opens the keyboard or starts the mic depending on how the session was started.

Tech stack
- Frontend: React + TypeScript, Vite, Tailwind CSS, framer-motion, react-i18next
- Backend: Laravel (PHP) REST API (Sanctum for auth)
- Speech & AI: Backend connects to speech services / AI providers for STT/TTS and optional language-aware instructions

Tools & technologies used
- YarnGPT TTS API for Nigerian voices and speech
- OpenStreetMap (OSM) data for hospital locations
- Web Speech API (browser) for natural text-to-speech fallback
- GitHub Copilot and OpenAI Codex for debugging and development assistance
- Google Gemini for logo generation
- Lucide React for icons
- PostCSS + Autoprefixer (frontend build pipeline)

Repository layout
- `frontend/` — React + TypeScript app (Vite)
- `backend/alavia-api/` — Laravel API and business logic

Quick start (frontend)

1. Navigate to the frontend folder:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create the environment file:
```bash
# Create a .env file in the frontend/ folder with the following content:
VITE_API_BASE_URL=https://api.tmb.it.com
```
On Windows (PowerShell):
```powershell
"VITE_API_BASE_URL=https://api.tmb.it.com" | Out-File -Encoding utf8 .env
```
On Mac/Linux:
```bash
echo "VITE_API_BASE_URL=https://api.tmb.it.com" > .env
echo "VITE_VOICE_MODEL_API=+3sN@7Q2nsJ1rR" >> .env
echo "VITE_YARNGPT_TTS_ENDPOINT=https://yarngpt.ai/api/v1/tts" >> .env
```

4. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173` by default.

Quick start (backend)
```
cd backend/alavia-api
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate
php artisan storage:link
```

Key API endpoints (examples)
- `POST /api/auth/register` — register user
- `POST /api/auth/login` — login
- `POST /api/consultations/start` — start a consultation
- `POST /api/consultations/{id}/message` — send a follow-up message
- `GET /api/consultations/{id}` — consultation detail
- `POST /api/speech/stt` — speech-to-text
- `POST /api/speech/tts` — text-to-speech

Team
- Project built by TEAM NIBBLE
- Members: Toluwani Bakare, Onaade Abdulmuqtadir, Olanrewaju Olamide, Yusuf Masroor Ahmad

License & usage
This project is a hackathon prototype and may not be used, copied, distributed, or modified without explicit permission from the TEAM NIBBLE contributors. If you wish to use this project in whole or part, please contact the maintainers to request permission.

## Safety & scope
- This MVP does **not** provide medical diagnoses or prescriptions.
- It uses deterministic triage rules; AI is used only for speech processing and optional phrasing/categorization.

For full payload examples and API documentation, see `backend/alavia-api/docs/payloads.md` and `backend/alavia-api/docs/openapi.yaml`.
