#!/usr/bin/env python3
"""Build 281 local Devil n Dove module ownership inventory.

Scans the current checkout. It does not contact Cloudflare or modify application
source. With --write it writes local evidence under .wrangler/build281/.
"""

from __future__ import annotations

import argparse
import json
import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / ".wrangler" / "build281"

OWNERS = (
    "CORE", "PUBLIC", "CATALOG", "INVENTORY", "CREATIVE", "CAIP",
    "PACKAGING", "CONTENT", "MARKETING", "ACCOUNTING", "ADMIN", "LEGACY_REVIEW",
)

RULES = (
    ("CAIP", ("caip", "creative_asset", "creative-asset", "creative_assets", "derivative", "evidence_selection", "story_segment", "story-evidence", "media_upload")),
    ("PACKAGING", ("packaging", "label", "soap_", "soap-", "inci", "ingredient", "candle-top", "candle_top")),
    ("ACCOUNTING", ("accounting", "general_ledger", "journal", "reconciliation", "bank_", "bank-", "statement_import", "gifi", "accounts_payable", "accounts_receivable")),
    ("CONTENT", ("media-content", "media_content", "content-studio", "content_studio", "content_project", "content-project", "media_asset", "media-assignment", "before-after")),
    ("MARKETING", ("seo", "social", "pinterest", "campaign", "caption", "marketplace_csv", "trust_block", "testimonial", "utm_")),
    ("INVENTORY", ("inventory", "site_item", "site-item", "supplier", "consumable", "equipment", "material_usage", "material-usage", "amazon")),
    ("CREATIVE", ("creative_work", "creative-work", "creative_project", "creative-project", "creative_process", "creative-process", "project_material_review")),
    ("CATALOG", ("product", "catalog", "checkout", "cart", "order", "offer", "pricing", "featured", "merchandising", "tax_class")),
    ("ADMIN", ("startup", "readiness", "release", "deploy", "smoke", "admin_action", "admin-action", "user_access", "user-access", "role", "permission", "command_center")),
    ("CORE", ("auth", "session", "_lib", "api-client", "api_client", "error-handler", "error_handler", "shared")),
)

SKIP_PARTS = {".git", "node_modules", ".wrangler", "__pycache__"}
SOURCE_SUFFIXES = {".html", ".js", ".mjs"}


def norm(path: Path) -> str:
    return path.as_posix().lower()


def classify_text(text: str, *, public_fallback: bool = False) -> str:
    lowered = text.lower()
    for owner, tokens in RULES:
        if any(token in lowered for token in tokens):
            return owner
    return "PUBLIC" if public_fallback else "LEGACY_REVIEW"


def relevant_source_files() -> list[Path]:
    files: list[Path] = []
    for path in ROOT.rglob("*"):
        if not path.is_file() or any(part in SKIP_PARTS for part in path.parts):
            continue
        rel = path.relative_to(ROOT)
        low = norm(rel)
        if path.suffix.lower() not in SOURCE_SUFFIXES:
            continue
        if low.startswith("functions/api/") or low.startswith("admin/") or low.startswith("public/js/") or (len(rel.parts) == 1 and path.suffix.lower() in {".html", ".js"}):
            files.append(rel)
    return sorted(files, key=lambda p: p.as_posix().lower())


def classify_file(rel: Path) -> str:
    low = norm(rel)
    if low.startswith("public/js/core/dd-module-"):
        return "CORE"
    public_fallback = rel.suffix.lower() == ".html" and not low.startswith("admin/")
    return classify_text(low, public_fallback=public_fallback)


def schema_file() -> Path | None:
    for candidate in (ROOT / "database_full_schema.sql", ROOT / "database_schema_current.sql", ROOT / "database.sql"):
        if candidate.exists():
            return candidate
    return None


def table_inventory() -> list[dict[str, str]]:
    path = schema_file()
    if not path:
        return []
    text = path.read_text(encoding="utf-8", errors="replace")
    names = re.findall(r"CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[\"`\[]?([A-Za-z0-9_]+)", text, flags=re.IGNORECASE)
    seen = set()
    rows = []
    for name in names:
        if name.lower().startswith("sqlite_") or name in seen:
            continue
        seen.add(name)
        rows.append({"table": name, "owner": classify_text(name)})
    return rows


def build_report() -> dict:
    file_rows = [{"path": rel.as_posix(), "owner": classify_file(rel)} for rel in relevant_source_files()]
    tables = table_inventory()
    return {
        "build": 281,
        "purpose": "module ownership discovery",
        "source_files": file_rows,
        "tables": tables,
        "file_counts": dict(sorted(Counter(row["owner"] for row in file_rows).items())),
        "table_counts": dict(sorted(Counter(row["owner"] for row in tables).items())),
        "owners": list(OWNERS),
    }


def markdown(report: dict) -> str:
    lines = [
        "# Build 281 Generated Module Ownership Inventory", "",
        "> Generated locally by `scripts/build281_module_inventory.py --write`.",
        "> Classification is architectural evidence, not authorization logic.", "",
        "## Summary", "", "### Source files", "", "| Owner | Count |", "|---|---:|",
    ]
    for owner in OWNERS:
        lines.append(f"| {owner} | {report['file_counts'].get(owner, 0)} |")
    lines += ["", "### D1 tables discovered", "", "| Owner | Count |", "|---|---:|"]
    for owner in OWNERS:
        lines.append(f"| {owner} | {report['table_counts'].get(owner, 0)} |")
    lines += ["", "## Source file ownership", "", "| Owner | Path |", "|---|---|"]
    for row in report["source_files"]:
        lines.append(f"| {row['owner']} | `{row['path']}` |")
    lines += ["", "## D1 table ownership", "", "| Owner | Table |", "|---|---|"]
    for row in report["tables"]:
        lines.append(f"| {row['owner']} | `{row['table']}` |")
    lines += ["", "## Review rule", "", "Start with `LEGACY_REVIEW`. Move an item only after its real business authority is understood.", "Do not move files merely to make this report look cleaner.", ""]
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--write", action="store_true", help="write JSON/Markdown evidence under .wrangler/build281")
    args = parser.parse_args()
    report = build_report()
    print(f"Build 281 source files inventoried: {len(report['source_files'])}")
    print(f"Build 281 D1 tables inventoried: {len(report['tables'])}")
    print(f"LEGACY_REVIEW source files: {report['file_counts'].get('LEGACY_REVIEW', 0)}")
    print(f"LEGACY_REVIEW D1 tables: {report['table_counts'].get('LEGACY_REVIEW', 0)}")
    if args.write:
        OUT_DIR.mkdir(parents=True, exist_ok=True)
        (OUT_DIR / "module-inventory.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
        (OUT_DIR / "MODULE_INVENTORY.generated.md").write_text(markdown(report), encoding="utf-8")
        print(f"Wrote: {OUT_DIR.relative_to(ROOT) / 'module-inventory.json'}")
        print(f"Wrote: {OUT_DIR.relative_to(ROOT) / 'MODULE_INVENTORY.generated.md'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
