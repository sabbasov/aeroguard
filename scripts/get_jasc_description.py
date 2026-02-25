"""Resolve JASC/ATA codes to human-readable descriptions.

Reads the 'JASC Code Look-Up Table.pdf' from data/lookup/ and builds an
in-memory mapping so we can display 'Ignition System' instead of '7400'.

Usage:
    from scripts.get_jasc_description import jasc_lookup
    print(jasc_lookup("7400"))  # → "Ignition System"
"""

from __future__ import annotations

import re
from functools import lru_cache
from pathlib import Path

LOOKUP_DIR = Path(__file__).resolve().parent.parent / "data" / "lookup"
JASC_PDF = LOOKUP_DIR / "JASC Code Look-Up Table.pdf"


def _extract_text_from_pdf(pdf_path: Path) -> str:
    """Extract raw text from a PDF using PyMuPDF."""
    import fitz

    doc = fitz.open(str(pdf_path))
    text = "\n".join(page.get_text() for page in doc)
    doc.close()
    return text


@lru_cache(maxsize=1)
def _build_jasc_table() -> dict[str, str]:
    """Parse the JASC PDF into a {code: description} dict.

    The PDF format has codes on their own line followed by one or more
    lines of description text, terminated by the next code line.
    """
    if not JASC_PDF.exists():
        return {}

    raw = _extract_text_from_pdf(JASC_PDF)
    lines = raw.split("\n")

    table: dict[str, str] = {}
    current_code: str | None = None
    desc_parts: list[str] = []

    code_re = re.compile(r"^\s*(\d{4,5})\s*$")

    for line in lines:
        m = code_re.match(line)
        if m:
            if current_code and desc_parts:
                full = " ".join(desc_parts)
                full = re.sub(r"\s+", " ", full).strip()
                # Trim long descriptions to the first sentence
                dot = full.find(".")
                if dot != -1 and dot < 120:
                    full = full[: dot + 1]
                table[current_code] = full
            current_code = m.group(1)
            desc_parts = []
        elif current_code is not None:
            stripped = line.strip()
            if stripped:
                desc_parts.append(stripped)

    # Flush last entry
    if current_code and desc_parts:
        full = " ".join(desc_parts)
        full = re.sub(r"\s+", " ", full).strip()
        dot = full.find(".")
        if dot != -1 and dot < 120:
            full = full[: dot + 1]
        table[current_code] = full

    return table


def jasc_lookup(code: str | None) -> str | None:
    """Return the description for a JASC/ATA code, or None if unknown."""
    if code is None:
        return None
    table = _build_jasc_table()
    code = code.strip()
    if code in table:
        return table[code]
    # Try prefix match (e.g. "7603" → check "76" chapter level)
    if len(code) >= 2 and code[:2] + "00" in table:
        chapter = table[code[:2] + "00"]
        return f"{chapter} (sub-code {code})"
    return None


def main() -> None:
    """CLI: dump the full JASC table or look up a single code."""
    import sys

    table = _build_jasc_table()

    if len(sys.argv) > 1:
        code = sys.argv[1]
        desc = jasc_lookup(code)
        if desc:
            print(f"{code} → {desc}")
        else:
            print(f"Code {code} not found ({len(table)} codes loaded)")
    else:
        print(f"Loaded {len(table)} JASC codes from {JASC_PDF.name}\n")
        for code, desc in sorted(table.items()):
            print(f"  {code:>5}  {desc}")


if __name__ == "__main__":
    main()
