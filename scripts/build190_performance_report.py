#!/usr/bin/env python3
"""Build 190 static performance and image-compression report."""
from __future__ import annotations
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
OUT = ROOT / "data" / "site" / "build190-performance-report.json"
IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif", ".svg"}


def public_usage_count(asset_path: str) -> int:
    needle = f"/{asset_path}"
    count = 0
    for pattern in ("*.html", "*.js", "*.css"):
        for path in ROOT.rglob(pattern):
            if any(part in {".git", "node_modules", "docs"} for part in path.parts):
                continue
            try:
                count += path.read_text(encoding="utf-8", errors="ignore").count(needle)
            except OSError:
                pass
    return count


def row(path: Path) -> dict:
    rel = path.relative_to(ROOT).as_posix()
    size = path.stat().st_size
    optimized = None
    candidates = {
        "assets/logo-clear.png": "assets/logo-clear-nav.webp",
        "assets/banner-spicing-it-up.png": "assets/banner-spicing-it-up.webp",
        "assets/mainpage-collage.jpeg": "assets/mainpage-collage.webp",
        "assets/mark.png": "assets/mark-display.webp",
    }
    if rel in candidates and (ROOT / candidates[rel]).exists():
        optimized = ROOT / candidates[rel]
    optimized_size = optimized.stat().st_size if optimized else 0
    savings = round((1 - optimized_size / size) * 100, 1) if optimized and size else 0
    if optimized:
        status = "optimized_variant_ready"
    elif size > 1_000_000:
        status = "oversized_needs_optimization"
    elif size > 350_000:
        status = "review_size"
    else:
        status = "within_static_budget"
    return {
        "asset_path": rel,
        "original_bytes": size,
        "optimized_asset_path": optimized.relative_to(ROOT).as_posix() if optimized else "",
        "optimized_bytes": optimized_size,
        "savings_percent": savings,
        "public_usage_count": public_usage_count(rel),
        "compression_status": status,
    }


def html_checks() -> dict:
    pages = []
    for path in ROOT.rglob("*.html"):
        if any(part in {".git", "node_modules", "docs"} for part in path.parts):
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        h1_count = len(re.findall(r"<h1\b", text, flags=re.I))
        img_count = len(re.findall(r"<img\b", text, flags=re.I))
        lazy_count = len(re.findall(r"<img\b[^>]*\bloading=[\"']lazy[\"']", text, flags=re.I))
        pages.append({
            "path": path.relative_to(ROOT).as_posix(),
            "bytes": path.stat().st_size,
            "h1_count": h1_count,
            "image_count": img_count,
            "lazy_image_count": lazy_count,
            "status": "pass" if h1_count <= 1 else "blocker_multiple_h1",
        })
    return {
        "total_pages": len(pages),
        "multiple_h1_pages": [p for p in pages if p["h1_count"] > 1],
        "pages": pages,
    }


def main() -> int:
    assets = [row(path) for path in ASSETS.rglob("*") if path.is_file() and path.suffix.lower() in IMAGE_EXTS]
    assets.sort(key=lambda item: item["original_bytes"], reverse=True)
    report = {
        "build_label": "Build 190",
        "summary": {
            "image_assets": len(assets),
            "total_image_bytes": sum(item["original_bytes"] for item in assets),
            "optimized_variants": sum(1 for item in assets if item["optimized_asset_path"]),
            "oversized_assets": sum(1 for item in assets if item["compression_status"] == "oversized_needs_optimization"),
        },
        "assets": assets,
        "html": html_checks(),
        "notes": [
            "Optimized WebP display variants keep original source assets for rollback and metadata compatibility.",
            "Real product/workshop photos still require consent, useful alt text, compression, and mobile review before replacing placeholders.",
            "One H1 per exposed page remains a deployment guardrail.",
        ],
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report["summary"], indent=2))
    if report["html"]["multiple_h1_pages"]:
        print("Multiple-H1 blockers found")
        return 1
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
