## Global Energy Dashboard

A full‑stack web application that visualizes worldwide electricity generation and installed capacity using the Global Power Plant Database (GPPD). It demonstrates end‑to‑end engineering across data modeling, API design, and interactive frontend visualizations.

- **Frontend**: Next.js 14 (App Router), Tailwind, React, Leaflet, Chart.js
- **Backend**: Node.js, Express, PostgreSQL (pg)
- **Data**: GPPD CSV imported into PostgreSQL via `pg-copy-streams`

### Links

- Notion Board: https://www.notion.so/245a6a2d651b80ee9681dde42e0e8efa?v=245a6a2d651b80ad87f4000c8f5218e4&source=copy_link
- Documentation (Google Drive): https://drive.google.com/drive/folders/1T6Hpops0zIDd23j3LneVjEXvUtvfEx2x?usp=sharing

---

## Features

- Interactive global map of power plants with filtering by country/fuel
- Top countries by total installed capacity
- Multi-country generation trends (2013–2019)
- Country-level overrides editor (capacity and annual generation)
- Robust API with API-key protection
- Docker-based deployment option
  
## Quick Start

### Option A: Docker (recommended)

Prereqs: Docker Desktop

1) Start services:
```bash
docker compose up -d
```

- Backend: http://localhost:3000
- Frontend: http://localhost:3001

2) Initialize database and import data (run from your host shell):
```bash
node database/scripts/setup_database.js
node database/scripts/import_power_plants.js
```

## API Overview (Backend)

Base URL: `http://localhost:3000/api` (protected by API key)

- `GET /power-plants`
  - Query: `country` (ISO-3), `fuel`, `limit`, `offset`, `bounds=west,south,east,north`
  - Returns plants with rounded coordinates/capacity for stable rendering

- `GET /countries/summary`
  - Returns list of available `{ country, country_long }`

- `GET /countries/stats/top?limit=25`
  - Top countries by total capacity (honors overrides)

- `GET /countries/details?countryName=<Country Long Name>`
  - Effective capacity for a country (override > base sum)

- `GET /countries/:country`
  - Summary, fuel breakdown, and recent plants for ISO-3 `:country`

- `GET /countries/:country/generation`
  - Yearly reported/estimated/effective generation for a country

- `GET /countries/:country/fuels`
  - Capacity breakdown by primary fuel

- `GET /generation?countries=CountryA,CountryB`
  - Multi-country generation series (merges override values)

- `GET /global/fuel-capacity`
  - Total capacity by primary fuel

Auth header example:
```http
X-API-Key: changeme-strong-key
```

---
### Tech Stack

- **Languages**
  - JavaScript (Node.js, React)

- **Backend**
  - Express 4 for API routing
  - PostgreSQL via `pg` with pooled connections
  - Environment config with `dotenv`
  - API key authentication middleware with constant‑time comparison
  - Structured routes: `countries`, `power-plants`, `generation`, `global`

- **Database**
  - PostgreSQL 13+
  - Schema `gppd` with `power_plants` table
  - Bulk CSV load using `pg-copy-streams` (COPY FROM STDIN)
  - Setup and import scripts in `database/scripts/*`

- **Frontend**
  - Next.js 14 (App Router)
  - React 18 with dynamic imports for heavy components
  - Tailwind CSS for styling
  - Server routes proxy to backend using `BACKEND_URL` and `BACKEND_API_KEY`

- **Maps & Charts**
  - Leaflet + React Leaflet for interactive map
  - Chart.js + `react-chartjs-2` for visualizations

- **UI & Utilities**
  - Lucide React icons
  - Utility components (cards, badges) and helpers

- **Testing**
  - Jest + Supertest for backend integration tests

- **Packaging & Ops**
  - Docker + docker‑compose for local orchestration
  - ETag and Cache‑Control headers for basic HTTP caching
  - `cross-env` for cross‑platform scripts

## Frontend

- Next.js App Router with server routes in `frontend/app/api/*` proxying to the backend using `BACKEND_URL` and `BACKEND_API_KEY`.
- Main dashboard UI: `frontend/app/page.js`
- Components: map, charts, KPI cards, country editor.

---

## Data Import

- Schema: `database/schema/power_plants.sql` into `gppd.power_plants`
- Import script truncates table and loads `database/seeds/global_power_plant_database_clean.csv` using COPY

Run:
```bash
node database/scripts/setup_database.js
node database/scripts/import_power_plants.js
```

---

## Testing

Backend tests (Jest):
```bash
cd backend
npm test
```
---

## Attribution

This project uses data derived from the Global Power Plant Database (GPPD). Please consult GPPD’s license and citation requirements where applicable.

---

## License

MIT — see `LICENSE`.
