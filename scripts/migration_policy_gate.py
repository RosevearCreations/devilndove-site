#!/usr/bin/env python3
"""Static gate for the canonical forward-only D1 migration stream."""
from __future__ import annotations

import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIR = ROOT / "migrations" / "canonical"
MANIFEST = DIR / "manifest.json"
FAIL: list[str] = []


def req(ok: bool, message: str) -> None:
    if not ok:
        FAIL.append(message)


def read(path: Path) -> str:
    if not path.is_file():
        FAIL.append(f"missing required file: {path.relative_to(ROOT)}")
        return ""
    return path.read_text(encoding="utf-8", errors="replace")


try:
    manifest = json.loads(read(MANIFEST) or "{}")
except json.JSONDecodeError as exc:
    FAIL.append(f"invalid canonical manifest JSON: {exc}")
    manifest = {}

req(manifest.get("stream") == "devilndove-canonical-forward", "canonical migration stream id drifted")
req((manifest.get("rules") or {}).get("native_ledger") == "d1_migrations", "native d1_migrations authority missing")
req((manifest.get("rules") or {}).get("proof_table") == "app_schema_migration_proofs", "migration proof-table authority missing")
req((manifest.get("rules") or {}).get("development_first") is True, "Development-first migration policy missing")
req((manifest.get("rules") or {}).get("production_before_dependent_code") is True, "Production-before-dependent-code policy missing")

items = manifest.get("migrations") if isinstance(manifest.get("migrations"), list) else []
req(bool(items), "canonical migration manifest is empty")
seen: set[str] = set()
for expected, item in enumerate(items, 1):
    req(isinstance(item, dict), f"migration entry {expected} is not an object")
    if not isinstance(item, dict):
        continue
    version = int(item.get("version") or 0)
    filename = str(item.get("file") or "")
    recovery = str(item.get("recovery") or "").strip()
    description = str(item.get("description") or "").strip()
    req(version == expected, f"migration versions are not contiguous at {filename or expected}")
    req(bool(re.fullmatch(rf"{expected:04d}_[a-z0-9][a-z0-9_\-]*\.sql", filename)), f"invalid canonical migration filename: {filename}")
    req(filename not in seen, f"duplicate canonical migration filename: {filename}")
    seen.add(filename)
    req(len(recovery) >= 24, f"recovery note is too weak for {filename}")
    req(len(description) >= 12, f"description is too weak for {filename}")
    path = DIR / filename
    body = read(path)
    req(bool(body.strip()), f"empty canonical migration file: {filename}")
    # Canonical migrations are forward files, not shell/wrangler scripts or hidden
    # Production targeting instructions. Target selection belongs to d1_migrate.py.
    upper = body.upper()
    req("WRANGLER" not in upper and "CLOUDFLARE_API_TOKEN" not in upper, f"migration contains deployment/tooling instructions: {filename}")
    req("DATABASE_ID" not in upper and "DEVILNDOVE-PROD" not in upper, f"migration contains environment-specific target identity: {filename}")

sql_files = sorted(path.name for path in DIR.glob("*.sql"))
req(sql_files == [str(item.get("file") or "") for item in items if isinstance(item, dict)], "canonical SQL directory and manifest are not an exact ordered match")

wrangler = read(ROOT / "wrangler.toml")
req('migrations_dir = "migrations/canonical"' in wrangler, "wrangler.toml does not point to the canonical migration stream")
req('database_name = "devilndove-dev"' in wrangler and 'database_id = "dbc1615b-dcbe-4951-973b-b47c99c73bfa"' in wrangler, "tracked Wrangler Development D1 authority drifted")
req("f34a741b-0000-45b0-9a96-6be08754d563" not in wrangler, "tracked Wrangler configuration contains the Production D1 id")
req("account_id =" not in wrangler, "tracked Wrangler configuration must never contain account_id")

applicator = read(ROOT / "scripts" / "d1_migrate.py")
for token in (
    'choices=("development", "production")',
    'LIVE_SCHEMA_CHANGE',
    'verify_development_before_production',
    'IMMUTABILITY FAILURE',
    'PRAGMA foreign_key_check',
    'd1", "migrations", "apply"',
):
    req(token in applicator, f"canonical applicator missing safety contract: {token}")

print("CANONICAL D1 MIGRATION POLICY")
print(f"Manifest SHA-256: {hashlib.sha256(MANIFEST.read_bytes()).hexdigest() if MANIFEST.is_file() else 'missing'}")
print(f"Canonical migrations: {len(items)}")
if FAIL:
    print("CANONICAL D1 MIGRATION POLICY: FAIL")
    for index, message in enumerate(FAIL, 1):
        print(f"{index:02d}. {message}")
    raise SystemExit(1)

print("CANONICAL D1 MIGRATION POLICY: PASS")
print("Historical migrations: PROVENANCE ONLY")
print("Development-first: REQUIRED")
print("Production-before-dependent-code: REQUIRED")
print("Migration identity: SHA-256 + source SHA + recovery-note SHA-256")
