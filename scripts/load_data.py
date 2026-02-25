"""Parse FAA Service Difficulty Reports (SDRs) and insert into Supabase.

Usage: python scripts/load_data.py <sdr_file.txt>
"""

from __future__ import annotations

import os
import re
import sys
from pathlib import Path
from typing import Any

import httpx
from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_ROOT / ".env")

SUPABASE_URL: str = os.environ["SUPABASE_URL"]
SUPABASE_KEY: str = os.environ["SUPABASE_KEY"]
TABLE_NAME: str = "sdr_reports"

# ── Regex patterns (FAA SDR format) ──

REPORT_SPLIT_RE = re.compile(r"-+\s*End Of Report\s*-+", re.IGNORECASE)

# §1 Submitter
CONTROL_NUM_RE  = re.compile(r"\(a\)\s*Unique Control #:\s*(\S+)")
DIFFICULTY_DATE_RE = re.compile(r"\(b\)\s*Difficulty Date:\s*([\d/]+)")
REG_NUM_RE      = re.compile(r"\(c\)\s*Registration #\s*:\s*([A-Za-z0-9]+)")
SUBMITTER_TYPE_RE = re.compile(r"\(d\)\s*Submitter Type\s*:\s*(.+?)(?:\s{2,}|$)")
SUBMISSION_DATE_RE = re.compile(r"\(f\)\s*Submission Date:\s*(.+?)(?:\s{2,}|$)")

# §2 Codes
ATA_CODE_RE     = re.compile(r"\(c\)\s*JASC/ATA Code\s*:\s*(\S+)")
STAGE_OP_RE     = re.compile(r"\(d\)\s*Stage of Operation\s*:\s*(.+?)(?:\s{2,}|$)")
HOW_DISC_RE     = re.compile(r"\(e\)\s*How Discovered\s*:\s*(.+?)(?:\s{2,}|$)")
NATURE_COND_RE  = re.compile(r"\(f\)\s*Nature of Condition\s*:\s*([^\n]*?)\s*(?:\(g\)|$)")
PRECAUTION_RE   = re.compile(r"\(g\)\s*Precautionary Procedures:\s*(.+?)(?:\s{2,}|$)")

# §3 Equipment (pipe-delimited)
AIRCRAFT_ROW_RE = re.compile(
    r"\(a\)\s*Aircraft\s*\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|"
)
ENGINE_ROW_RE = re.compile(
    r"\(b\)\s*Engine\s*\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|"
)

# §4 Problem Description
PROBLEM_DESC_HEADER_RE = re.compile(
    r"4\.\s*Problem Description.*?-{5,}\s*\n(.*?)(?=\n\s*5\.\s*Specific Part)",
    re.DOTALL,
)

# §5 Specific Part
PART_NAME_RE    = re.compile(r"\(a\)\s*Part Name\s*:\s*(.+?)\s{2,}(?:\(b\))")
PART_MFR_RE     = re.compile(r"\(b\)\s*Manufacturer'?s? Name\s*:\s*([^(\n]+?)(?=\s{2,}|\n|$)")
PART_NUM_RE     = re.compile(r"\(c\)\s*Part Number\s*:\s*(.+?)(?:\s{2,}|\(d\))")
PART_COND_RE    = re.compile(r"\(e\)\s*Part Condition:\s*(.+?)(?:\s{2,}|\(f\))")
PART_LOC_RE     = re.compile(r"\(f\)\s*Part/Defect Location:\s*(.+?)(?:\s{2,}|$)")
PART_TIME_RE    = re.compile(r"5\..*?\(g\)\s*Total Time\s*:\s*(\S+)", re.DOTALL)


# ── Parsing ──

def _clean(value: str | None) -> str | None:
    """Normalize whitespace; return None for empty / placeholder values."""
    if value is None:
        return None
    value = re.sub(r"\s+", " ", value).strip()
    if value in ("", "N/A", "n/a", "NONE", "none", "-", "--"):
        return None
    return value


def _match(pattern: re.Pattern[str], text: str) -> str | None:
    m = pattern.search(text)
    return _clean(m.group(1)) if m else None


def _convert_date(value: str | None) -> str | None:
    """MM/DD/YYYY → YYYY-MM-DD."""
    if value is None:
        return None
    try:
        parts = value.split("/")
        if len(parts) == 3:
            month, day, year = parts
            return f"{year}-{month.zfill(2)}-{day.zfill(2)}"
    except (ValueError, IndexError):
        pass
    return value


def parse_sdr_block(block: str) -> dict[str, Any] | None:
    """Extract all fields from a single SDR report block."""
    if "Submitter Information" not in block and "Unique Control" not in block:
        return None

    record: dict[str, Any] = {}

    # §1 Submitter
    record["control_number"] = _match(CONTROL_NUM_RE, block)
    record["difficulty_date"] = _convert_date(_match(DIFFICULTY_DATE_RE, block))
    record["tail_number"]    = _match(REG_NUM_RE, block)
    record["submitter"]      = _match(SUBMITTER_TYPE_RE, block)

    # §2 Codes
    record["jasc_code"]              = _match(ATA_CODE_RE, block)
    record["stage_of_operation"]     = _match(STAGE_OP_RE, block)
    record["nature_of_condition"]    = _match(NATURE_COND_RE, block)
    record["precautionary_procedure"] = _match(PRECAUTION_RE, block)

    # §3 Equipment
    ac = AIRCRAFT_ROW_RE.search(block)
    if ac:
        record["aircraft_make"]  = _clean(ac.group(1))
        record["aircraft_model"] = _clean(ac.group(2))
        record["aircraft_serial"] = _clean(ac.group(3))
        record["total_aircraft_time"] = _clean(ac.group(4))
    else:
        record["aircraft_make"] = None
        record["aircraft_model"] = None
        record["aircraft_serial"] = None
        record["total_aircraft_time"] = None

    eng = ENGINE_ROW_RE.search(block)
    if eng:
        record["engine_make"]  = _clean(eng.group(1))
        record["engine_model"] = _clean(eng.group(2))
    else:
        record["engine_make"] = None
        record["engine_model"] = None

    # §4 Description
    desc_match = PROBLEM_DESC_HEADER_RE.search(block)
    record["description"] = _clean(desc_match.group(1)) if desc_match else None

    # §5 Part info (scoped to avoid §6 field-label collisions)
    sec5_match = re.search(
        r"5\.\s*Specific Part.*?-{5,}\s*\n(.*?)(?=\n\s*6\.\s*Component)",
        block,
        re.DOTALL,
    )
    sec5 = sec5_match.group(1) if sec5_match else ""

    record["part_name"]         = _match(PART_NAME_RE, sec5)
    record["part_manufacturer"] = _match(PART_MFR_RE, sec5)
    record["part_number"]       = _match(PART_NUM_RE, sec5)
    record["part_condition"]    = _match(PART_COND_RE, sec5)
    record["part_location"]     = _match(PART_LOC_RE, sec5)

    if all(v is None for v in record.values()):
        return None

    return record


def parse_sdr_file(filepath: str | Path) -> list[dict[str, Any]]:
    """Parse an SDR text file into a list of record dicts."""
    text = Path(filepath).read_text(encoding="utf-8", errors="replace")
    blocks = REPORT_SPLIT_RE.split(text)
    records: list[dict[str, Any]] = []

    for block in blocks:
        block = block.strip()
        if not block:
            continue
        parsed = parse_sdr_block(block)
        if parsed is not None:
            records.append(parsed)

    return records


# ── Supabase insertion ──

BATCH_SIZE = 500


def _api_headers() -> dict[str, str]:
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation,resolution=merge-duplicates",
    }


def _upsert_aircraft_registry(client: httpx.Client, records: list[dict[str, Any]]) -> int:
    """Pre-populate aircraft_registry so the FK constraint is satisfied."""
    seen: dict[str, dict[str, Any]] = {}
    for r in records:
        tn = r.get("tail_number")
        if tn and tn not in seen:
            seen[tn] = {
                "tail_number": tn,
                "make": r.get("aircraft_make"),
                "model": r.get("aircraft_model"),
                "engine_type": r.get("engine_make"),
            }

    if not seen:
        return 0

    rows = list(seen.values())
    url = f"{SUPABASE_URL}/rest/v1/aircraft_registry"
    headers = _api_headers()

    total = 0
    for i in range(0, len(rows), BATCH_SIZE):
        batch = rows[i : i + BATCH_SIZE]
        resp = client.post(url, headers=headers, json=batch)
        if resp.status_code >= 400:
            print(f"  ⚠ aircraft_registry upsert {resp.status_code}: {resp.text}")
        else:
            total += len(resp.json()) if resp.text else 0

    return total


def insert_records(records: list[dict[str, Any]]) -> int:
    """Batch-insert parsed SDR records into Supabase via PostgREST."""
    url = f"{SUPABASE_URL}/rest/v1/{TABLE_NAME}"
    headers = _api_headers()

    total = 0

    with httpx.Client(timeout=30) as client:
        reg_count = _upsert_aircraft_registry(client, records)
        print(f"  ↳ aircraft_registry: upserted {reg_count} aircraft")

        for i in range(0, len(records), BATCH_SIZE):
            batch = records[i : i + BATCH_SIZE]
            response = client.post(url, headers=headers, json=batch)
            if response.status_code >= 400:
                print(f"  ✗ Supabase error {response.status_code}: {response.text}")
                response.raise_for_status()
            inserted = len(response.json()) if response.text else 0
            total += inserted
            print(f"  ↳ sdr_reports batch {i // BATCH_SIZE + 1}: inserted {inserted} rows")

    return total


# ── CLI ──

def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python scripts/load_data.py <sdr_file.txt>")
        sys.exit(1)

    filepath = Path(sys.argv[1])
    if not filepath.exists():
        print(f"✗ File not found: {filepath}")
        sys.exit(1)

    print(f"⏳ Parsing SDR file: {filepath}")
    records = parse_sdr_file(filepath)
    print(f"✓ Parsed {len(records)} SDR record(s)")

    if not records:
        print("  Nothing to insert — exiting.")
        return

    with_tail = sum(1 for r in records if r.get("tail_number"))
    print(f"  ↳ {with_tail} record(s) have a tail number, "
          f"{len(records) - with_tail} are missing / empty")

    print(f"⏳ Connecting to Supabase …")
    total = insert_records(records)
    print(f"✓ Done — {total} row(s) written to '{TABLE_NAME}'")


if __name__ == "__main__":
    main()
