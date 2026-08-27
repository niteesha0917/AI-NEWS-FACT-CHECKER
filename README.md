# Veritas AI — AI-Powered News Fact-Checker

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen.svg)]()
[![Deployment: Render](https://img.shields.io/badge/Deployed%20to-Render-darkviolet.svg)](https://ai-news-fact-checker-yevd.onrender.com)

---

## Overview
Veritas AI is a modern, full-stack application designed to combat misinformation and verify news credibility. Combining an Express.js backend, a MongoDB database, and a high-fidelity React + Vite frontend, the platform provides automated fact-checking, claims breakdown, source credibility evaluation, and dynamic data visualizations.

**Live Demo:** https://ai-news-fact-checker-yevd.onrender.com  
**API Health Check:** https://ai-news-fact-checker-yevd.onrender.com/api/health

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite 5, React Router DOM 6, Axios, Vanilla CSS (Stitch Design System) |
| **Backend** | Express.js, Node.js, Morgan, CORS, UUID, dotenv |
| **Database** | MongoDB, Mongoose ORM |
| **AI/ML Model** | scikit-learn, Pandas, NumPy (Python 3.12, model.pkl) |
| **Deployment** | Render, Procfile |

---

## Features

- 🔍 **Check News Center** — Submit text, news URLs, or upload files with drag-and-drop support for immediate analysis.
- 📊 **Truth Gauge** — Dynamic, animated SVG gauge showing a credibility score from 0-100% with color-coded status.
- 📋 **Claims Breakdown** — Granular extraction of claims with individual verdicts, explanations, and supporting evidence.
- 🌐 **Source Credibility** — Lists extracted references and publishers with credibility scores and stance matching.
- 📈 **Analyst Dashboard** — Interactive dashboard featuring KPI metrics cards, category distributions, recent analyses, and verdict charts.
- 🎨 **Design System** — Modern glassmorphism UI built entirely on customized Stitch design tokens (Inter, Source Serif 4).
- 💾 **Hybrid Data Mode** — Fallback to memory storage when MongoDB is unavailable, ensuring maximum uptime.

---

## Prerequisites

- **Node.js** v18+
- **Python** 3.12+ (to run/verify the pickle model, optional)
- **MongoDB** (local community edition or Atlas connection string)

---

## Getting Started

### 1. Clone & Configure
```bash
git clone https://github.com/niteesha0917/AI-NEWS-FACT-CHECKER.git
cd AI-NEWS-FACT-CHECKER
cp backend/.env.example backend/.env
```

### 2. Configure Environment Variables
Edit `backend/.env` with your settings:
```env
MONGODB_URI=mongodb://localhost:27017/verifact
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### 3. Local Development

#### Using Windows Launcher (Recommended)
Double-click `start.bat` at the root directory. It will:
- Check for Node.js
- Install dependencies for both backend and frontend automatically
- Launch backend on `http://localhost:5000`
- Launch frontend on `http://localhost:5173`
- Open your default browser to the application

#### Manual Run

##### Setup Backend:
```bash
cd backend
npm install
npm run dev
```

##### Setup Frontend:
```bash
cd ../frontend
npm install
npm run dev
```

---

## Project Structure

```
AI NEWS FACT CHECKER AGENT/
├── backend/                  ← Express.js + MongoDB API
│   ├── server.js             ← Main server entry point
│   ├── .env                  ← Environment variables
│   ├── models/
│   │   └── FactCheck.js      ← Mongoose schemas
│   └── routes/
│       ├── factcheck.js      ← POST/GET fact-check endpoints
│       └── dashboard.js      ← Dashboard stats endpoints
│
├── frontend/                 ← React + Vite SPA
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx           ← React Router setup
│       ├── main.jsx          ← React entry point
│       ├── index.css         ← Stitch design system tokens
│       ├── components/
│       │   ├── Navbar.jsx    ← Top header navigation
│       │   ├── Sidebar.jsx   ← App sidebar navigation
│       │   └── TruthGauge.jsx ← Animated SVG score gauge
│       └── pages/
│           ├── LandingPage.jsx ← Public landing page
│           ├── CheckNews.jsx   ← Fact-check input page
│           ├── Analysis.jsx    ← Results detail page
│           └── Dashboard.jsx   ← Analyst dashboard
│
├── load_model.py             ← Python model loader
├── model.pkl                 ← Scikit-learn model artifact
├── requirements.txt          ← Python dependencies
└── start.bat                 ← Automated Windows launcher
```

---

## API Documentation

The backend exposes the following REST endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| **POST** | `/api/factcheck` | Submit new content for fact-checking analysis |
| **GET** | `/api/factcheck/history` | Retrieve paginated history of past checks |
| **GET** | `/api/factcheck/:id` | Get details of a specific fact-check analysis |
| **GET** | `/api/dashboard/stats` | Retrieve aggregated dashboard KPI metrics |
| **GET** | `/api/dashboard/recent` | Retrieve list of the 10 most recent checks |
| **GET** | `/api/health` | Check backend server status & MongoDB health |

---

## Database Schemas

### `FactCheck` Collection
Stores the input content, meta-information, and final analysis results.

```js
{
  inputType: { type: String, enum: ['url', 'text', 'headline'] },
  inputContent: { type: String, required: true },
  title: { type: String },
  verdict: { type: String, enum: ['TRUE', 'MOSTLY_TRUE', 'MISLEADING', 'MOSTLY_FALSE', 'FALSE', 'UNVERIFIED'] },
  truthScore: { type: Number, min: 0, max: 100 },
  summary: { type: String },
  category: { type: String, enum: ['Politics', 'Health', 'Science', 'Economy', 'Technology', 'Environment', 'World', 'Other'] },
  processingTime: { type: Number }, // in ms
  status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'] },
  claims: [
    {
      text: { type: String, required: true },
      verdict: { type: String },
      explanation: { type: String },
      confidence: { type: Number },
      supportingEvidence: { type: String },
      sourceComparison: { type: String },
      unsupportedStatements: { type: String },
      reasoningSummary: { type: String },
      evidenceStatus: { type: String },
      sources: [{ title: String, publisher: String, publicationDate: String, url: String }]
    }
  ],
  sources: [
    {
      name: { type: String, required: true },
      url: { type: String },
      credibilityScore: { type: Number },
      stance: { type: String, enum: ['supports', 'contradicts', 'neutral'] },
      excerpt: { type: String }
    }
  ],
  analystId: { type: String, default: 'anonymous' }
}
```

---

## Deployment

The application is configured to build and run seamlessly on cloud services like **Render**.

### Root Configuration (`package.json`)
The root package.json automatically chains commands for easy hosting deployment:
```json
"scripts": {
  "install-backend": "cd backend && npm install",
  "install-frontend": "cd frontend && npm install",
  "build-frontend": "cd frontend && npm run build",
  "build": "npm run install-backend && npm run install-frontend && npm run build-frontend",
  "start": "cd backend && npm start"
}
```

- **Build Command:** `npm run build`
- **Start Command:** `npm start`
- **Web Service Profile:** Configured in `Procfile` (`web: npm start`)

---

## Security & Best Practices

- **CORS Protection:** Configured in the Express backend using permitted Origins.
- **Request Limits:** Express body parser configured with safety limits (`10mb`).
- **Input Isolation:** Structured MongoDB indexes for rapid, indexed lookups on `createdAt`, `verdict`, and `category`.
- **Hybrid Availability:** Backend features fallback data-simulation in case of database timeout, keeping the app interactive even under server stress.

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

Built with ❤️ by the Veritas AI Team
