#!/usr/bin/env python3
"""Build 282 module ownership inventory using the locked taxonomy.

Scans the current checkout only. With --write, evidence is written beneath
.wrangler/build282/. No Cloudflare resource is contacted.
"""
from __future__ import annotations

import argparse
import json
import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / ".wrangler" / "build282"
OWNERS = (
    "CORE", "PLATFORM", "ADMIN", "PUBLIC", "CATALOG", "INVENTORY", "OPERATIONS",
    "CREATIVE", "CAIP", "PACKAGING", "CONTENT", "MARKETING", "ACCOUNTING", "LEGACY_REVIEW",
)
RULES = (
    ("CAIP", ("caip", "creative_asset", "creative-asset", "creative_assets", "derivative", "evidence_selection", "story_segment", "story-evidence", "media_upload")),
    ("PACKAGING", ("packaging", "label", "soap_", "soap-", "inci", "ingredient", "candle-top", "candle_top")),
    ("ACCOUNTING", ("accounting", "general_ledger", "journal", "reconciliation", "bank_", "bank-", "statement_import", "gifi", "accounts_payable", "accounts_receivable", "accountant_", "payment_refund", "payment_dispute", "stripe", "paypal")),
    ("OPERATIONS", ("custom_request", "custom-request", "customer_document", "customer-document", "gift_card", "gift-card", "membership", "member_", "member-", "pickup_", "vendor_", "community_event", "community-event", "fulfillment", "today_task", "today-task")),
    ("CONTENT", ("media-content", "media_content", "content-studio", "content_studio", "content_project", "content-project", "media_asset", "media-assignment", "before-after", "image_manifest", "image-manifest", "visual_enrichment", "visual-enrichment", "stage_photo", "stage-photo")),
    ("MARKETING", ("seo", "search_console", "search-console", "social", "pinterest", "campaign", "caption", "marketplace", "trust_block", "testimonial", "utm_", "analytics", "sitemap", "structured_data", "structured-data")),
    ("INVENTORY", ("inventory", "site_item", "site-item", "supplier", "consumable", "equipment", "material_usage", "material-usage", "amazon")),
    ("CREATIVE", ("creative_work", "creative-work", "creative_project", "creative-project", "creative_process", "creative-process", "project_material_review")),
    ("CATALOG", ("product", "catalog", "checkout", "cart", "order_item", "offer", "pricing", "featured", "merchandising", "tax_class", "movie_catalog", "movie-catalog")),
    ("PLATFORM", ("schema_migration", "schema-migration", "schema_drift", "schema-drift", "startup_readiness", "startup-readiness", "deployment", "deploy_", "deploy-", "release_control", "release-control", "runtime_incident", "runtime-incident", "route_usage", "route-usage", "public_api_health", "public-api-health", "operational_continuity", "operational-continuity", "r2_")),
    ("ADMIN", ("admin_action", "admin-action", "admin_log", "admin-log", "user_profile", "user-profile", "users", "access_tier", "access-tier", "role", "permission", "security", "command_center", "command-center", "app_settings")),
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
    if low.startswith("public/js/core/dd-module-") or low.endswith("dd-admin-module-shadow.mjs"):
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
    rows, seen = [], set()
    for name in names:
        if name.lower().startswith("sqlite_") or name in seen:
            continue
        seen.add(name)
        rows.append({"table": name, "owner": classify_text(name)})
    return rows


def source_location(path: str) -> str:
    if path.startswith("functions/api/admin/"):
        return "functions/api/admin/"
    if path.startswith("functions/api/"):
        return "functions/api/"
    if path.startswith("public/js/"):
        return "public/js/"
    if path.startswith("admin/"):
        return "admin/"
    if "/" not in path:
        return "root"
    return path.split("/", 1)[0] + "/"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--write", action="store_true")
    args = parser.parse_args()
    files = [{"path": rel.as_posix(), "owner": classify_file(rel)} for rel in relevant_source_files()]
    tables = table_inventory()
    file_counts = Counter(row["owner"] for row in files)
    table_counts = Counter(row["owner"] for row in tables)
    legacy_locations = Counter(source_location(row["path"]) for row in files if row["owner"] == "LEGACY_REVIEW")
    report = {
        "build": 282,
        "purpose": "locked module ownership discovery",
        "source_files": files,
        "tables": tables,
        "file_counts": dict(sorted(file_counts.items())),
        "table_counts": dict(sorted(table_counts.items())),
        "legacy_source_locations": dict(legacy_locations.most_common()),
        "owners": list(OWNERS),
    }
    print(f"Build 282 source files inventoried: {len(files)}")
    print(f"Build 282 D1 tables inventoried: {len(tables)}")
    for owner in OWNERS:
        print(f"{owner:<16} files={file_counts.get(owner, 0):>4} tables={table_counts.get(owner, 0):>4}")
    print("LEGACY_REVIEW source locations:")
    for location, count in legacy_locations.most_common():
        print(f"  {location:<28} {count:>4}")
    if args.write:
        OUT_DIR.mkdir(parents=True, exist_ok=True)
        target = OUT_DIR / "module-inventory.json"
        target.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
        print(f"Wrote: {target.relative_to(ROOT)}")
    print("No Cloudflare resource was contacted.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
