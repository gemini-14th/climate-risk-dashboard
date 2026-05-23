# 🌍 ClimateWatch Kenya — Impact-Based Climate Risk Dashboard

An interactive climate risk dashboard for Kenya that visualizes real-time flood risk maps, drought alerts, 7-day rainfall forecasts, and affected population estimates across all 47 counties. Built to support disaster preparedness and humanitarian response planning aligned with Kenya's NDMA protocols.

> **Live Demo:** [your-app.vercel.app](#) &nbsp;|&nbsp; **API:** [your-api.onrender.com/api/health](#)

---

## Screenshots

> _Add screenshots here after deployment._

---

## Tech Stack

| Layer      | Technology                                          |
|------------|-----------------------------------------------------|
| Frontend   | React.js (Vite), Tailwind CSS, Vanilla CSS          |
| Mapping    | Leaflet.js, react-leaflet, GADM GeoJSON             |
| Charts     | Chart.js, react-chartjs-2, SVG sparklines           |
| Backend    | Node.js 18+, Express                                |
| Database   | MySQL 8.0 (local) / Railway (production)            |
| HTTP       | Axios                                               |
| Scheduling | node-cron (every 6 hours)                           |
| Deployment | Vercel (frontend) · Render (backend) · Railway (DB) |

---

## Data Sources & Methodology

| Source         | Description                                               | Update Cadence |
|----------------|-----------------------------------------------------------|----------------|
| Open-Meteo API | 7-day rainfall forecasts for all 47 counties              | Every 6 hours  |
| NASA POWER API | 30-year monthly precipitation climatology (1993–2022)     | Once on boot   |
| KNBS 2019      | Population census data for population-at-risk estimation  | Static         |
| GADM v4.1      | Kenya county boundary polygons (admin level 1)            | Static         |

### SPI Methodology
The dashboard computes **SPI-3** (3-month Standardized Precipitation Index) using NASA POWER 30-year monthly rainfall baselines. The formula is:

```
SPI = (observed_3month_mm − mean_30yr_mm) / stddev_30yr_mm
```

| SPI Range     | Classification  |
|---------------|-----------------|
| SPI < −2.0    | Extreme Drought |
| −2.0 to −1.5  | Severe Drought  |
| −1.5 to −1.0  | Moderate Drought|
| SPI > −1.0    | Normal          |

### Flood Risk Score (0–100)
A weighted composite score combining three factors:

| Factor               | Weight | Data Source             |
|----------------------|--------|-------------------------|
| Peak rainfall (7-day)| 40%    | Open-Meteo API          |
| Elevation            | 30%    | County metadata (DEM)   |
| Soil drainage + slope| 30%    | KARI-FAO / manual class |

---

## Local Development Setup

### Prerequisites
- Node.js ≥ 18
- MySQL ≥ 8.0

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/climate-risk-dashboard.git
cd climate-risk-dashboard
```

### 2. Install dependencies
```bash
cd client && npm install
cd ../server && npm install
```

### 3. Create the database
```bash
mysql -u root -p < server/db/schema.sql
mysql -u root -p < server/db/phase3_migrate.sql
```

### 4. Configure environment
```bash
cp .env.example server/.env
# Edit server/.env with your MySQL password
```

`server/.env`:
```
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=YourPassword
DB_NAME=climate_dashboard
```

`client/.env`:
```
VITE_API_BASE_URL=http://localhost:5000
```

### 5. Run both servers
```bash
# Terminal 1 — Backend (start first, wait for pipeline)
cd server && npm run dev
# Watch for: [DataFetcher] Pipeline complete in XX.Xs

# Terminal 2 — Frontend
cd client && npm run dev
```

Then open **http://localhost:5173**

---

## Deployment

Deployed on: **Vercel** (frontend) + **Render** (backend) + **Railway** (MySQL)

### Quick summary
| Service | Platform | URL pattern                            |
|---------|----------|----------------------------------------|
| Frontend| Vercel   | `https://your-app.vercel.app`          |
| Backend | Render   | `https://climatewatch-kenya-api.onrender.com` |
| Database| Railway  | Internal TCP — not public-facing       |

See the full deployment guide in the project docs for step-by-step instructions.

---

## Phase Roadmap

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 | ✅ Complete | Scaffolding, Leaflet map, backend health-check, dummy data |
| Phase 2 | ✅ Complete | MySQL, Open-Meteo API, SPI calculation, population risk, cron job |
| Phase 3 | ✅ Complete | NASA POWER 30-yr baselines, weighted flood scoring, county drill-down |
| Phase 4 | ✅ Complete | Production deployment — Vercel + Render + Railway |

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check (used by UptimeRobot) |
| GET | `/api/forecast?county=Nairobi` | 7-day rainfall for one county |
| GET | `/api/risk` | Risk summary + all 47 county scores |
| GET | `/api/alerts` | Active drought/flood alerts |
| GET | `/api/county/:name` | Full county detail (forecast, SPI, population) |

---

## Author

**Samuel Anindo** — CUEA (The Catholic University of Eastern Africa)

---

*ClimateWatch Kenya · Built for climate resilience in the Horn of Africa · Data: Open-Meteo, NASA POWER, KNBS 2019*
