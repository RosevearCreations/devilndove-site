#!/usr/bin/env python3
"""Build 257 helper: audit the Media Studio curated static-page catalog against the repository.

The catalog is intentionally curated: transactional, product, inventory, tools and supplies
routes stay out of Media & Content Management Studio even if an index.html exists.
"""
from __future__ import annotations
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "public" / "data" / "media-content-page-catalog.json"


def main() -> int:
    data = json.loads(CATALOG.read_text(encoding="utf-8"))
    listed = []
    missing = []
    for group in data.get("groups", []):
        for page in group.get("pages", []):
            path = page["path"]
            listed.append(path)
            html = ROOT / ("index.html" if path == "/" else path.strip("/") + "/index.html")
            if not html.exists():
                missing.append((path, str(html.relative_to(ROOT))))
    duplicates = sorted({p for p in listed if listed.count(p) > 1})
    print(f"Catalog pages: {len(listed)}")
    print(f"Missing files: {len(missing)}")
    for path, file in missing:
        print(f"MISSING {path} -> {file}")
    print(f"Duplicate paths: {len(duplicates)}")
    for path in duplicates:
        print(f"DUPLICATE {path}")
    return 1 if missing or duplicates else 0


if __name__ == "__main__":
    raise SystemExit(main())
