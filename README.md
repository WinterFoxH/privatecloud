# PrivateCloud — prototyp (mock)

Interaktywny prototyp interfejsu systemu chmury prywatnej z pracy dyplomowej.

## Uruchomienie

```bash
cd prototype
npm install
npm run dev
```

Otwórz http://localhost:5173

## Demo logowania

- **Użytkownik końcowy** — pliki, multimedia, synchronizacja, udostępnianie
- **Administrator** — dodatkowo dashboard i pula dyskowa

Hasło dowolne (to mock bez backendu).

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

Zrzuty ekranu prototypu (Rys. 2–5) oraz diagramy UML (Rys. 1, 6–8) znajdują się w pracy dyplomowej i w katalogu `diagrams/` (źródła PlantUML).
