"""Load Airworthiness Directives from Search_Results.xlsx into Supabase.

Reads the original FAA spreadsheet so we can preserve the DRS hyperlinks
embedded in the 'Document Number' column (A).

Usage: python scripts/load_ads.py

Prerequisites:
    pip install openpyxl httpx python-dotenv
    SQL:  ALTER TABLE airworthiness_directives ADD COLUMN ad_link TEXT;
"""

from __future__ import annotations

import os
import re
from pathlib import Path

import httpx
import openpyxl
from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_ROOT / ".env")

SUPABASE_URL: str = os.environ["SUPABASE_URL"]
SUPABASE_KEY: str = os.environ["SUPABASE_KEY"]
XLSX_PATH = PROJECT_ROOT / "Search_Results.xlsx"

MODEL_RE = re.compile(r"CESSNA\s+((?:Model\s+)?[\w/-]+)", re.IGNORECASE)


def _headers() -> dict[str, str]:
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation,resolution=merge-duplicates",
    }


def _extract_model(title: str) -> str | None:
    m = MODEL_RE.search(title)
    if not m:
        return None
    raw = m.group(1).strip()
    raw = re.sub(r"^Model\s+", "", raw, flags=re.IGNORECASE)
    return raw


def load_ads() -> None:
    if not XLSX_PATH.exists():
        print(f"✗ File not found: {XLSX_PATH}")
        return

    wb = openpyxl.load_workbook(XLSX_PATH)
    ws = wb.active

    rows: dict[str, dict[str, str | None]] = {}
    for row in ws.iter_rows(min_row=2, max_col=2):
        cell_a, cell_b = row[0], row[1]
        ad = (cell_a.value or "").strip()
        if not ad:
            continue
        title = (cell_b.value or "").strip()
        link = cell_a.hyperlink.target if cell_a.hyperlink else None
        rows[ad] = {
            "ad_number": ad,
            "subject": title,
            "model_affected": _extract_model(title),
            "ad_link": link,
            "full_text": None,
        }

    records = list(rows.values())
    print(f"⏳ Parsed {len(records)} unique ADs from {XLSX_PATH.name}")

    url = f"{SUPABASE_URL}/rest/v1/airworthiness_directives"
    with httpx.Client(timeout=30) as client:
        resp = client.post(url, headers=_headers(), json=records)
        if resp.status_code >= 400:
            print(f"✗ Supabase error {resp.status_code}: {resp.text}")
            resp.raise_for_status()

        inserted = len(resp.json()) if resp.text else 0
        print(f"✓ Upserted {inserted} ADs into airworthiness_directives")

    wb.close()


if __name__ == "__main__":
    load_ads()
