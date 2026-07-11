# Veritas AI — Full-Stack Application

## Project Structure

```
AI NEWS FACT CHECKER AGENT/
├── backend/                  ← Express.js + MongoDB API
│   ├── server.js             ← Main server entry point
│   ├── .env                  ← Environment variables
│   ├── models/
│   │   └── FactCheck.js      ← Mongoose schema
│   └── routes/
│       ├── factcheck.js      ← POST/GET fact-check endpoints
│       └── dashboard.js      ← Dashboard stats endpoints
│
└── frontend/                 ← React + Vite SPA
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── App.jsx           ← React Router setup
        ├── main.jsx          ← React entry point
        ├── index.css         ← Stitch design system tokens
        ├── components/
        │   ├── Navbar.jsx    ← Landing page top nav
        │   ├── Sidebar.jsx   ← App sidebar navigation
        │   └── TruthGauge.jsx ← Animated SVG score gauge
        ├── pages/
        │   ├── LandingPage.jsx ← Public landing page
        │   ├── CheckNews.jsx   ← Fact-check input page
        │   ├── Analysis.jsx    ← Results detail page
        │   └── Dashboard.jsx   ← Analyst dashboard
        └── utils/
            └── api.js        ← Axios API client
```

## Setup & Installation

### Prerequisites
- Node.js v18+ (https://nodejs.org)
- MongoDB (local or MongoDB Atlas)

### 1. Backend Setup

```bash
cd "AI NEWS FACT CHECKER AGENT/backend"
npm install
```

Copy `.env.example` to `.env` and update MONGODB_URI if needed:
```
MONGODB_URI=mongodb://localhost:27017/verifact
PORT=5000
FRONTEND_URL=http://localhost:5173
```

Start backend:
```bash
npm run dev
```

Backend runs at: http://localhost:5000
Health check: http://localhost:5000/api/health

### 2. Frontend Setup

```bash
cd "AI NEWS FACT CHECKER AGENT/frontend"
npm install
npm run dev
```

Frontend runs at: http://localhost:5173

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/factcheck` | Submit content for fact-checking |
| GET | `/api/factcheck/history` | Paginated history |
| GET | `/api/factcheck/:id` | Get specific analysis |
| GET | `/api/dashboard/stats` | Aggregated statistics |
| GET | `/api/dashboard/recent` | Recent 10 analyses |
| GET | `/api/health` | Server health check |

## Features

- ✅ **Landing Page** — Hero, features grid, stats, testimonials, CTA
- ✅ **Check News** — Text / URL / File upload with drag-drop support
- ✅ **Analysis Page** — Animated Truth Gauge, claims breakdown, source credibility
- ✅ **Dashboard** — KPI cards, category bars, verdict chart, recent table
- ✅ **Design System** — Full Stitch token extraction (colors, fonts, spacing)
- ✅ **MongoDB** — Persistent storage with in-memory fallback
- ✅ **Mock AI** — Realistic fact-check simulation (swap in real AI API)

## Design Tokens (from Stitch)

| Token | Value |
|-------|-------|
| Primary | `#004ac6` |
| Surface | `#f8f9ff` |
| Font (UI) | Inter |
| Font (Display) | Source Serif 4 |
| Font (Mono) | Geist Mono |
| Radius (xl) | 12px |
| Gutter | 24px |
