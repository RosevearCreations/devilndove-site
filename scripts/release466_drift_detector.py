#!/usr/bin/env python3
"""Compare Development/Production D1 structural identity without reading business rows."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

CANONICAL = {
    "0001_release464_migration_authority.sql",
    "0002_release464_operational_acceptance.sql",
    "0003_release464_business_growth.sql",
    "0004_release465_storefront_quality.sql",
}


def rows(value):
    found = []
    def walk(v):
        if isinstance(v, dict):
            results = v.get("results")
            if isinstance(results, list):
                for row in results:
                    if isinstance(row, dict) and {"kind", "type", "name"}.issubset(row):
                        found.append(row)
            for child in v.values():
                walk(child)
        elif isinstance(v, list):
            for child in v:
                walk(child)
    walk(value)
    return found


def load(path: str) -> list[dict]:
    return rows(json.loads(Path(path).read_text(encoding="utf-8")))


def identities(source: list[dict], kind: str) -> set[str]:
    return {str(x.get("name") or "") for x in source if str(x.get("kind") or "") == kind and str(x.get("name") or "")}


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--development", required=True)
    p.add_argument("--production", required=True)
    p.add_argument("--source-sha", required=True)
    p.add_argument("--output", required=True)
    p.add_argument("--fail-on-drift", action="store_true")
    args = p.parse_args()

    dev = load(args.development)
    prod = load(args.production)
    if not dev or not prod:
        raise SystemExit("structural query returned no comparable rows")

    dev_schema = identities(dev, "schema")
    prod_schema = identities(prod, "schema")
    dev_migrations = identities(dev, "migration")
    prod_migrations = identities(prod, "migration")
    dev_proofs = identities(dev, "proof")
    prod_proofs = identities(prod, "proof")

    missing_schema = sorted(dev_schema - prod_schema)
    extra_schema = sorted(prod_schema - dev_schema)
    migration_drift = sorted(dev_migrations ^ prod_migrations)
    proof_drift = sorted(dev_proofs ^ prod_proofs)
    current_migrations_ready = dev_migrations == CANONICAL and prod_migrations == CANONICAL
    current_proofs_ready = dev_proofs == CANONICAL and prod_proofs == CANONICAL
    drift = bool(missing_schema or extra_schema or migration_drift or proof_drift or not current_migrations_ready or not current_proofs_ready)

    proof = {
        "release": 466,
        "build": 1,
        "kind": "development-production-structural-drift",
        "status": "DRIFT" if drift else "PASS",
        "source_sha": args.source_sha,
        "comparison_scope": "schema_identity_and_canonical_migration_authority_only",
        "business_rows_read": False,
        "production_mutation": False,
        "development_schema_identities": len(dev_schema),
        "production_schema_identities": len(prod_schema),
        "missing_in_production": missing_schema,
        "extra_in_production": extra_schema,
        "canonical_migrations_match": current_migrations_ready,
        "canonical_proofs_match": current_proofs_ready,
        "migration_identity_drift": migration_drift,
        "proof_identity_drift": proof_drift,
    }
    Path(args.output).write_text(json.dumps(proof, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print("RELEASE 466 DEVELOPMENT/PRODUCTION STRUCTURAL DRIFT:", proof["status"])
    print(json.dumps(proof, indent=2, sort_keys=True))
    if drift and args.fail_on_drift:
        raise SystemExit(1)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
