# Clinic digitization (scanning app)

Local-first setup: Postgres in Docker, FastAPI backend, Expo frontend.

## Prerequisites

- Docker (for Postgres)
- Python 3.12+ (backend)
- Node.js (frontend)

## 1. Database

From the repo root:

```bash
docker compose up -d
```

This starts PostgreSQL on port **5432** (`clinic` / `clinic_db`).

## 2. Backend

```bash
cd backend
cp .env.example .env
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

API docs: http://127.0.0.1:8000/docs

## 3. Frontend

```bash
cd frontend
cp .env.example .env   # if needed; set EXPO_PUBLIC_BACKEND_URL=http://127.0.0.1:8000
npm install
npx expo start
```

Press `w` for web or use the Expo Go app for a device.

## Environment

- **`backend/.env`** — `DATABASE_URL` must match Postgres (default in `.env.example`).
- **`frontend/.env`** — `EXPO_PUBLIC_BACKEND_URL` must point at the API (default `http://127.0.0.1:8000`).

For OpenAI-backed scanning features, set `OPENAI_API_KEY` in `backend/.env` (do not commit secrets).
