# Elaris Island

A browser-based murder-mystery game that also works as a cognitive and emotional screening tool. Players investigate a death on an island through ten puzzle modules. Each puzzle is designed to exercise a specific cognitive domain, and the game records how the player performs. Short questions modelled on the DASS-21 scale (depression, anxiety, stress) are worked into the story's dialogue rather than given as a form.

> **Disclaimer:** this is a research prototype built for academic purposes. It does not diagnose, treat, or replace professional psychological assessment or mental healthcare.

**Stack:** Go (`net/http`) · SQLite (WAL) · vanilla JavaScript · HTML/CSS · Docker

## How it works

**Onboarding.** Players sign up, answer a short pre-boarding questionnaire, and get matched to a character identity. The rest of the story is written around that identity.

**Ten modules.** Each one is a self-contained puzzle in its own file under `frontend/js/modules/`:

| # | Module | Mechanic |
|---|---|---|
| 1 | Beach | find and inspect clues hidden in a scene |
| 2 | Lighthouse | repeat a growing colour sequence |
| 3 | Cabin | search a room and link evidence to suspects |
| 4 | Bonfire | identify who was poisoned from character dossiers |
| 5 | Baggage | drag-and-drop map reconstruction |
| 6 | Forest | navigate a path from riddle clues |
| 7 | Evidence | spot a suspect's details through glitched records |
| 8 | CCTV | put footage clips in chronological order |
| 9 | Storm shelter | unlock a keypad from alibi timestamps |
| 10 | Pathfinder | reconstruct the case step by step and name the killer |

Puzzle answers, the murderer and alibi codes are randomised per run.

**What gets measured.** Each module updates scores across ten domains: attention, memory, working memory, processing speed, decision-making, cognitive flexibility, error monitoring, persistence, distraction resistance and multitasking. The game also records reaction-time samples, accuracy, attempts and DASS responses.

**Admin dashboard (`admin.html`).** Lists every player session, with per-module scores, a domain profile, a DASS breakdown with severity bands, a reaction-time chart, a progress timeline and flags for low domain scores. Sessions can be filtered and exported to CSV or JSON, and players can be reset or deleted.

**Backend.** One Go server serves the frontend and a JSON API for registration and login, saving progress, session CRUD, and admin actions. Sessions live in SQLite, with indexes on user and last-updated time.

## Running locally

```bash
cd backend
go run .                 # http://localhost:8080, database at ../data/elaris.db
```

Or with Docker:

```bash
docker build -t elaris .
docker run -p 8080:8080 -v $(pwd)/data:/app/data elaris
```

## Structure

```
backend/main.go            Go server: API, SQLite schema, static file serving
frontend/game.html         game shell
frontend/js/state.js       game state and character data
frontend/js/modules/       the ten puzzle modules
frontend/js/dass.js        DASS response recording
frontend/js/dossier.js     suspect/victim dossier and clue unlocking
frontend/admin.html        researcher dashboard
frontend/phq9.html         pre-boarding questionnaire and identity match
```
