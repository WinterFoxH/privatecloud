# PrivateCloud — prototyp

Interaktywny prototyp systemu chmury prywatnej (praca dyplomowa).
Frontend: React + Vite. Backend: Express + SQLite (Fazy 1–3).

## Development (lokalnie)

```bash
# Backend
cd backend
cp .env.example .env   # ustaw JWT_SECRET
npm install
npm run dev            # http://localhost:3000

# Frontend (osobny terminal)
cd ..
echo 'VITE_API_URL=http://localhost:3000' > .env
npm install
npm run dev            # http://localhost:5173
```

### Konta demo (seed)

| Email | Hasło | Rola |
|-------|-------|------|
| `jan@dom.local` | `demo1234` | user |
| `admin@cloud.local` | `admin1234` | admin |

## Docker Compose (Faza 4)

Jedno polecenie — UI + API przez nginx na porcie **8080**:

```bash
cp .env.example .env          # ustaw JWT_SECRET
docker compose up --build
```

Otwórz http://localhost:8080

- `/` → React (SPA)
- `/api/*` → backend (proxy)
- `/health` → health check API

Persystencja: `./backend/data` (SQLite), `./storage/data` (pliki użytkowników).

Zatrzymanie: `Ctrl+C` lub `docker compose down`. Dane w wolumenach zostają.

Szczegóły: [DOCKER.md](./DOCKER.md).

## Mapowanie na przypadki użycia

| Ekran | UC |
|-------|-----|
| Logowanie | UC-LOG |
| Pliki | UC-FILE |
| Multimedia | UC-MEDIA |
| Synchronizacja | UC-SYNC |
| Udostępnianie | UC-SHR |
| Dashboard | UC-DASH |
| Pula dyskowa | UC-POOL |
