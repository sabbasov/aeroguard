# AeroGuard

> Aviation safety & compliance intelligence — cross-reference FAA Service Difficulty Reports (SDRs) with Airworthiness Directives (ADs) for risk analysis by tail number.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?logo=supabase)](https://supabase.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss)](https://tailwindcss.com)

---

## Overview

AeroGuard is a full-stack web application that gives pilots, mechanics, and aviation safety professionals a fast way to assess the maintenance risk profile of any FAA-registered aircraft. Enter an N-number (tail number), and AeroGuard:

1. Looks up the aircraft in the **FAA Civil Aviation Registry** (manufacturer, model, serial number).
2. Queries a Supabase database of **FAA Service Difficulty Reports** for that aircraft or model.
3. Cross-references applicable **Airworthiness Directives** via a model-mapping table.
4. Fetches the full text of each AD and runs it through **local pattern analysis** — falling back to **Gemini AI** (Google) for low-confidence cases — to determine whether the specific serial number is affected.
5. Calculates a **0-100 risk score** and surfaces the most common failure modes.

---

## Features

- **Tail number lookup** — resolves any FAA N-number to manufacturer, model, year, serial number, and registrant via a live registry scrape
- **SDR cross-reference** — searches by exact tail number; falls back to model-wide SDR data when no tail-specific reports exist
- **Airworthiness Directive analysis** — model-based AD retrieval with per-serial-number applicability determination
- **Hybrid AI pipeline** — local regex/heuristic analysis first; Gemini 2.5 Flash Lite used only when confidence is below 80%
- **Risk score** — weighted 0-100 score based on applicable ADs, failed/cracked parts, and excess wear findings
- **Search history** — last 10 tail numbers persisted to `localStorage`
- **Theme toggle** — dark / light / system (OS preference) with smooth transitions
- **Copy to clipboard** — one-click summary export for reports
- **Keyboard shortcut** — `Cmd/Ctrl + K` focuses the search input from anywhere on the page
- **Live stats banner** — SDR count, AD count, and total aircraft tracked refreshed from the database on load
- **Security headers** — HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and Permissions-Policy applied via `next.config.ts`

---

## Architecture

```
Browser (Next.js / React)
      │
      ├─ GET  /api/stats    ──► Supabase (sdr_reports + airworthiness_directives)
      │
      └─ POST /api/analyze
               │
               ├─ fetchFAARegistry(nNumber)       ──► FAA Civil Aviation Registry (HTML scrape)
               │
               ├─ supabaseAdmin.sdr_reports       ──► Supabase Postgres
               │
               ├─ supabaseAdmin.ad_model_mapping  ──► Supabase Postgres
               │
               ├─ supabaseAdmin.airworthiness_directives
               │
               ├─ fetchADContent(ad_link)         ──► federalregister.gov / rgl.faa.gov / drs.faa.gov
               │
               ├─ analyzeADLocally()              (regex/heuristic, no external call)
               │
               └─ analyzeADWithGemini()           ──► Google Generative Language API
                                                       (only when local confidence < 80 %)
```

### Database tables

| Table | Description |
|---|---|
| `sdr_reports` | Parsed FAA Service Difficulty Reports (part name, condition, date, tail number, model) |
| `airworthiness_directives` | AD number, subject, and link to the full-text document |
| `ad_model_mapping` | Many-to-many mapping of aircraft model codes to AD numbers |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| UI | React 19, Tailwind CSS v4 |
| Database | Supabase (Postgres + PostgREST) |
| AI | Google Gemini 2.5 Flash Lite (`gemini-2.5-flash-lite`) |
| Data pipeline | Python 3, `httpx`, `openpyxl`, `pymupdf` |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project with the three tables above
- (Optional) A [Google AI Studio](https://aistudio.google.com) API key for Gemini-powered AD analysis

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env.local` file in the project root:

```env
# Supabase — public (used in the browser and server components)
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-public-key>

# Supabase — service role (server-side only, never exposed to the browser)
SUPABASE_SERVICE_ROLE_KEY=<service-role-secret-key>

# Google Gemini (optional — local heuristics work without it)
GEMINI_API_KEY=<your-gemini-api-key>
```

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Data Pipeline

The Python scripts (excluded from version control via `.gitignore`) load raw FAA data into Supabase. Run them once to seed the database, or re-run whenever the source files are updated.

### One-time setup

```bash
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install httpx python-dotenv openpyxl pymupdf
```

Create a `scripts/.env` (or project-root `.env`) with:

```env
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_KEY=<service-role-secret-key>
```

### Load Airworthiness Directives

```bash
# 1. Load AD records from Search_Results.xlsx (downloaded from FAA DRS)
python scripts/load_ads.py

# 2. Populate the model→AD mapping table
python scripts/populate_ad_model_mapping.py
```

> **Order matters:** run `load_ads.py` before `populate_ad_model_mapping.py`.

### Load SDR data

```bash
# Load a raw SDR text file downloaded from the FAA SDR database
python scripts/load_data.py data.txt
```

All scripts are **idempotent** — safe to re-run without creating duplicate records.

---

## API Reference

### `POST /api/analyze`

Performs a full risk analysis for a given tail number.

**Request body**

```json
{ "tailNumber": "N12345" }
```

**Response**

```json
{
  "tailNumber": "N12345",
  "matchType": "tail_number",
  "registry": {
    "manufacturer": "CESSNA",
    "model": "172S",
    "serialNumber": "172S8001",
    "year": "1998",
    "registrant": "JOHN DOE"
  },
  "count": 7,
  "topFailures": [
    { "partName": "NOSE GEAR STRUT", "count": 3 }
  ],
  "ads": [
    {
      "adNumber": "2021-03-09",
      "subject": "Fuel System Inspection",
      "adLink": "https://rgl.faa.gov/...",
      "applicable": true,
      "confidence": 92,
      "reasoning": "Serial number falls within the affected range."
    }
  ],
  "riskScore": 60,
  "failedCount": 2,
  "excessWearCount": 1,
  "applicableCount": 1,
  "totalADsMatched": 4
}
```

**Risk score formula**

```
riskScore = min(10 + applicableADs × 40 + failedParts × 10 + excessWear × 2, 100)
```

| Score | Label |
|---|---|
| 0-30 | Low |
| 31-70 | Moderate |
| 71-100 | High |

---

### `GET /api/stats`

Returns aggregate database statistics shown in the dashboard header.

**Response**

```json
{
  "sdrCount": 18423,
  "adCount": 1204,
  "aircraftTracked": 56041,
  "supabaseOk": true
}
```

---

## Deployment

The app is designed for **zero-config Vercel deployment**:

1. Push the repository to GitHub.
2. Import the project in the [Vercel dashboard](https://vercel.com/new).
3. Add the four environment variables from the [Configuration](#2-configure-environment-variables) section.
4. Deploy — Vercel automatically detects Next.js and builds the project.

The Python data pipeline is **not** deployed to Vercel; it runs locally or in a CI/CD job to seed the Supabase database.

---

## License

MIT
