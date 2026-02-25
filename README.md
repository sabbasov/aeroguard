# AeroGuard

Aviation safety & compliance platform. Cross-references FAA Service Difficulty Reports (SDRs) with Airworthiness Directives (ADs) for risk analysis by tail number.

## Stack

- **Frontend** — Next.js, React, TypeScript, Tailwind CSS
- **Backend** — Supabase (PostgREST + Postgres)
- **Data Pipeline** — Python (httpx), FAA SDR text parser

## Getting Started

```bash
npm install
npm run dev
```

### Load SDR data

```bash
python scripts/load_data.py <sdr_file.txt>
```
