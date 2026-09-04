# Docker — PrivateCloud (Faza 4)

## Wymagania

- Docker Engine + Compose v2 (`docker compose version`)

## Start

```bash
cd Drafts/prototype   # lub katalog tego repo
cp .env.example .env  # ustaw JWT_SECRET (min. ~32 znaki)
docker compose up --build
```

Aplikacja: **http://localhost:8080**

Port hosta zmienisz w `.env`: `HOST_PORT=8080`.

## Architektura kontenerów

| Serwis | Rola | Port |
|--------|------|------|
| `frontend` | nginx: static React + proxy `/api`, `/health`, `/ws` | `8080→80` |
| `backend` | Express API + SQLite | wewnętrzny `3000` |

Redis **nie** jest w Fazie 4 (kolejka sync → Faza 6).

## Wolumeny

| Host | Kontener | Zawartość |
|------|----------|-----------|
| `./backend/data` | `/data/db` | `cloud.db` |
| `./storage/data` | `/data/storage` | pliki per `userId` |

## Jak działa auth / pliki przez proxy

1. Przeglądarka ładuje UI z `http://localhost:8080`.
2. Build frontendu ma `VITE_API_URL=""` → requesty idą na ten sam origin (`/api/auth/login`, `/api/files`, …).
3. Nginx przekazuje `/api/` i `/health` do `backend:3000`.
4. JWT w `Authorization: Bearer …` przechodzi przez proxy bez zmian.
5. CORS nie jest potrzebny przy same-origin; backend nadal akceptuje `CORS_ORIGINS` przy bezpośrednim dostępie do API.

## Przydatne komendy

```bash
docker compose config          # walidacja YAML
docker compose up --build -d   # w tle
docker compose logs -f         # logi
docker compose down            # stop (dane na dysku zostają)
curl http://localhost:8080/health
```

## Tipowe problemy

- **Port zajęty** — zmień `HOST_PORT` w `.env`.
- **401 po restarcie z innym JWT_SECRET** — wyloguj się / wyczyść localStorage (stary token).
- **Pusty storage / nowa baza** — seed użytkowników uruchamia się przy pustej tabeli `users`.
- **Duże uploady** — limit nginx: `client_max_body_size 100m` w `deploy/nginx/default.conf`.
