# API Payloads & Responses

Base URL: `http://localhost`

## Auth

### POST /api/auth/register
Request:
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+2348000000000",
  "password": "Password123!",
  "password_confirmation": "Password123!",
  "language": "EN",
  "emergency_contact_name": "John Doe",
  "emergency_contact_phone": "+2348000000001"
}
```
Response (201):
```json
{
  "user": { "id": 1, "email": "jane@example.com" },
  "token": "..."
}
```

### POST /api/auth/login
Request:
```json
{
  "email": "jane@example.com",
  "password": "Password123!"
}
```
Response (200):
```json
{
  "user": { "id": 1, "email": "jane@example.com" },
  "token": "..."
}
```

### POST /api/auth/logout
Headers: `Authorization: Bearer {token}`
Response (200):
```json
{ "status": "ok" }
```

### POST /api/auth/forgot-password
Request:
```json
{ "email": "jane@example.com" }
```
Response (200):
```json
{ "reset_token": "..." }
```

### POST /api/auth/reset-password
Request:
```json
{
  "email": "jane@example.com",
  "token": "...",
  "password": "NewPassword123!",
  "password_confirmation": "NewPassword123!"
}
```
Response (200):
```json
{ "status": "ok" }
```

## User

### GET /api/user/profile
Headers: `Authorization: Bearer {token}`
Response (200):
```json
{
  "id": 1,
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+2348000000000",
  "language": "EN",
  "emergency_contact_name": "John Doe",
  "emergency_contact_phone": "+2348000000001",
  "created_at": "2026-02-21T10:00:00Z",
  "updated_at": "2026-02-21T10:00:00Z"
}
```

### PATCH /api/user/profile
Headers: `Authorization: Bearer {token}`
Request (any subset):
```json
{
  "name": "Jane D.",
  "phone": "+2348000000002",
  "language": "PIDGIN",
  "emergency_contact_name": "Mary Doe",
  "emergency_contact_phone": "+2348000000003"
}
```
Response (200):
```json
{
  "user": {
    "id": 1,
    "email": "jane@example.com",
    "name": "Jane D."
  }
}
```

## Hospitals

### GET /api/hospitals
Query params (optional): `lat`, `lng`, `specialty`, `facility`, `severity`, `is_public`, `is_24_hours`, `emergency_ready`, `min_rating`
Response (200):
```json
{
  "data": [
    {
      "id": 10,
      "name": "General Hospital",
      "lat": 6.52,
      "lng": 3.37,
      "distance_km": 2.4
    }
  ]
}
```

### GET /api/hospitals/{id}
Response (200):
```json
{
  "data": {
    "id": 10,
    "name": "General Hospital",
    "lat": 6.52,
    "lng": 3.37
  }
}
```

## Consultations (auth required)

### POST /api/consultations/start
Headers: `Authorization: Bearer {token}`
Request (optional):
```json
{ "initial_message": "I have chest pain." }
```
Response (201):
```json
{
  "consultation_id": 1,
  "message": { "id": 1, "role": "AI", "content": "What symptoms are you feeling right now?" }
}
```

### POST /api/consultations/{id}/message
Headers: `Authorization: Bearer {token}`
Request:
```json
{ "content": "Yes, I am having trouble breathing." }
```
Response (200):
```json
{
  "consultation_id": 1,
  "status": "ACTIVE",
  "severity": null,
  "message": { "id": 2, "role": "AI", "content": "Is the pain spreading to your left arm or jaw?" }
}
```

### GET /api/consultations/{id}
Headers: `Authorization: Bearer {token}`
Response (200):
```json
{
  "consultation": {
    "id": 1,
    "status": "COMPLETED",
    "severity": "CRITICAL",
    "category": "CHEST",
    "recommended_specialty": "Cardiology / Emergency Medicine",
    "first_aid": ["Sit upright and rest."],
    "warnings": ["Trouble breathing"],
    "summary": "CHEST triage completed with severity CRITICAL."
  },
  "messages": [
    { "id": 1, "role": "AI", "content": "..." }
  ]
}
```

### GET /api/consultations/history
Headers: `Authorization: Bearer {token}`
Response (200):
```json
{
  "data": [
    { "id": 1, "status": "COMPLETED", "severity": "CRITICAL", "category": "CHEST", "summary": "..." }
  ]
}
```

### DELETE /api/consultations/{id}
Headers: `Authorization: Bearer {token}`
Response (200):
```json
{ "status": "ok" }
```

## Speech

### POST /api/speech/stt
Request (multipart):
- `audio`: file
- `language` (optional)
Response (200):
```json
{ "transcript": "I have chest pain since this morning" }
```

### POST /api/speech/tts
Request:
```json
{
  "text": "Are you having difficulty breathing?",
  "language": "YORUBA",
  "voice": "alloy"
}
```
Response (200):
```json
{ "audio_url": "http://localhost/storage/tts/uuid.mp3" }
```

## Admin

### POST /api/admin/login
Request:
```json
{ "email": "admin@example.com", "password": "AdminPass123!" }
```
Response (200):
```json
{
  "admin": { "id": 1, "email": "admin@example.com", "role": "SUPERADMIN" },
  "token": "..."
}
```

### GET /api/admin/hospitals
Headers: `Authorization: Bearer {adminToken}`
Response (200):
```json
{ "data": [ { "id": 10, "name": "General Hospital" } ] }
```

### POST /api/admin/hospitals
Headers: `Authorization: Bearer {adminToken}`
Request:
```json
{
  "osm_type": "node",
  "osm_id": 999999,
  "name": "Test Hospital",
  "lat": 6.5,
  "lng": 3.4,
  "state": "Lagos"
}
```
Response (201):
```json
{ "data": { "id": 10, "name": "Test Hospital" } }
```

### PATCH /api/admin/hospitals/{id}
Headers: `Authorization: Bearer {adminToken}`
Request:
```json
{ "is_public": true, "emergency_ready": true }
```
Response (200):
```json
{ "data": { "id": 10, "is_public": true } }
```

### DELETE /api/admin/hospitals/{id}
Headers: `Authorization: Bearer {adminToken}`
Response (200):
```json
{ "status": "ok" }
```

### POST /api/admin/hospitals/{id}/specialties
Headers: `Authorization: Bearer {adminToken}`
Request:
```json
{ "specialties": ["Cardiology", "Emergency Medicine"] }
```
Response (200):
```json
{ "status": "ok" }
```

### POST /api/admin/hospitals/{id}/facilities
Headers: `Authorization: Bearer {adminToken}`
Request:
```json
{ "facilities": ["Emergency Unit", "ICU"] }
```
Response (200):
```json
{ "status": "ok" }
```

### GET /api/admin/analytics/overview
Headers: `Authorization: Bearer {adminToken}`
Response (200):
```json
{
  "users": 120,
  "consultations": 45,
  "severity_breakdown": { "LOW": 10, "MEDIUM": 20, "HIGH": 10, "CRITICAL": 5 },
  "last_7_days": { "2026-02-15": 4, "2026-02-16": 8 }
}
```
