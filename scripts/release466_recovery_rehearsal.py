#!/usr/bin/env python3
"""Verify an ephemeral restored Development D1 export; emit summary only, never raw business data."""
from __future__ import annotations

import argparse
import hashlib
import json
import sqlite3
from pathlib import Path

MIGRATIONS = (
    "0001_release464_migration_authority.sql",
    "0002_release464_operational_acceptance.sql",
    "0003_release464_business_growth.sql",
    "0004_release465_storefront_quality.sql",
)
BUILD3_TABLES = (
    "creative_project_profitability",
    "creative_project_profitability_extensions",
    "creative_work_projects",
    "creative_work_events",
    "accounting_payment_applications",
    "accounting_hst_gst_reviews",
    "accounting_period_closures",
    "accountant_export_packages",
    "accounting_evidence_attachments",
    "runtime_incidents",
    "operational_retention_reviews",
)


def scalar(db: sqlite3.Connection, sql: str, params: tuple = ()) -> int:
    row = db.execute(sql, params).fetchone()
    return int(row[0] if row else 0)


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--database", required=True)
    p.add_argument("--export-file", required=True)
    p.add_argument("--expected-application-tables", required=True, type=int)
    p.add_argument("--source-sha", required=True)
    p.add_argument("--output", required=True)
    args = p.parse_args()

    if args.expected_application_tables <= 0:
        raise SystemExit("expected application-table count must be positive")
    db_path = Path(args.database)
    export_path = Path(args.export_file)
    if not db_path.is_file() or db_path.stat().st_size <= 0:
        raise SystemExit("restored SQLite database is missing or empty")
    if not export_path.is_file() or export_path.stat().st_size <= 0:
        raise SystemExit("Development D1 export is missing or empty")

    export_hash = hashlib.sha256(export_path.read_bytes()).hexdigest()
    db = sqlite3.connect(str(db_path))
    try:
        integrity = str(db.execute("PRAGMA integrity_check").fetchone()[0])
        fk_violations = list(db.execute("PRAGMA foreign_key_check"))
        application_tables = scalar(db, "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%'")
        reserved_cf_tables = scalar(db, "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name LIKE '_cf_%'")
        app_modules = scalar(db, "SELECT COUNT(*) FROM app_modules")
        placeholders = ",".join("?" for _ in MIGRATIONS)
        migrations = scalar(db, f"SELECT COUNT(*) FROM d1_migrations WHERE name IN ({placeholders})", MIGRATIONS)
        proofs = scalar(db, f"SELECT COUNT(*) FROM app_schema_migration_proofs WHERE migration_name IN ({placeholders}) AND environment='development'", MIGRATIONS)
        triggers = scalar(db, "SELECT COUNT(*) FROM sqlite_master WHERE type='trigger' AND name LIKE 'release465_%'")
        table_placeholders = ",".join("?" for _ in BUILD3_TABLES)
        required_tables = scalar(db, f"SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name IN ({table_placeholders})", BUILD3_TABLES)
    finally:
        db.close()

    assert integrity.lower() == "ok", integrity
    assert not fk_violations, fk_violations[:20]
    assert application_tables == args.expected_application_tables, (application_tables, args.expected_application_tables)
    assert app_modules == 5, app_modules
    assert migrations == 4, migrations
    assert proofs == 4, proofs
    assert triggers == 4, triggers
    assert required_tables == 11, required_tables

    proof = {
        "release": 466,
        "build": 1,
        "kind": "development-d1-disaster-recovery-rehearsal",
        "status": "PASS",
        "source_sha": args.source_sha,
        "source_environment": "development",
        "restore_target": "ephemeral_local_sqlite",
        "export_sha256": export_hash,
        "export_bytes": export_path.stat().st_size,
        "integrity_check": integrity,
        "foreign_key_violations": len(fk_violations),
        "expected_application_tables": args.expected_application_tables,
        "restored_application_tables": application_tables,
        "restored_reserved_cf_tables": reserved_cf_tables,
        "reserved_cloudflare_tables_in_application_count": False,
        "app_modules": app_modules,
        "canonical_migrations": migrations,
        "migration_proofs": proofs,
        "release465_triggers": triggers,
        "build3_required_tables": required_tables,
        "raw_export_artifact_retained": False,
        "restored_database_artifact_retained": False,
        "production_contacted": False,
        "production_mutation": False,
    }
    Path(args.output).write_text(json.dumps(proof, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print("RELEASE 466 DEVELOPMENT D1 RECOVERY REHEARSAL: PASS")
    print(json.dumps(proof, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
