#!/usr/bin/env python3
"""Build a fail-closed Production rollback readiness plan without mutating Git or Cloudflare."""
from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CANONICAL = [
    "migrations/canonical/0001_release464_migration_authority.sql",
    "migrations/canonical/0002_release464_operational_acceptance.sql",
    "migrations/canonical/0003_release464_business_growth.sql",
    "migrations/canonical/0004_release465_storefront_quality.sql",
]


def run(*args: str, check: bool = True) -> subprocess.CompletedProcess[str]:
    return subprocess.run(args, cwd=ROOT, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=check)


def git_text(*args: str) -> str:
    return run("git", *args).stdout.strip()


def load_release_at(sha: str) -> dict:
    raw = git_text("show", f"{sha}:development-release.json")
    return json.loads(raw)


def migration_files(release: dict) -> list[str]:
    return [str(x.get("file") or "") for x in release.get("current_release_migrations", [])]


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--target-sha", required=True)
    p.add_argument("--current-sha", required=True)
    p.add_argument("--output", required=True)
    args = p.parse_args()

    target = git_text("rev-parse", "--verify", f"{args.target_sha}^{{commit}}")
    current = git_text("rev-parse", "--verify", f"{args.current_sha}^{{commit}}")
    if target == current:
        raise SystemExit("rollback target must differ from current Production source SHA")
    ancestor = run("git", "merge-base", "--is-ancestor", target, current, check=False)
    if ancestor.returncode != 0:
        raise SystemExit("rollback target must be an ancestor of current Production source")

    target_release = load_release_at(target)
    current_release = load_release_at(current)
    target_migrations = migration_files(target_release)
    current_migrations = migration_files(current_release)
    if target_migrations != CANONICAL:
        raise SystemExit(f"rollback target does not declare the current forward schema stream: {target_migrations}")
    if current_migrations != CANONICAL:
        raise SystemExit(f"current source migration authority drifted: {current_migrations}")
    if any(x.get("production_apply") != "applied_and_verified" for x in current_release.get("current_release_migrations", [])):
        raise SystemExit("current Production migration authority is not fully applied/proven")
    if int(target_release.get("release") or 0) < 465:
        raise SystemExit("rollback targets before Release 465 are not automatically schema-compatible")

    plan = {
        "release": 466,
        "build": 1,
        "kind": "production-rollback-readiness-plan",
        "status": "READY_FOR_PRIOR_DEPLOYMENT_LOOKUP",
        "current_sha": current,
        "target_sha": target,
        "target_release": int(target_release.get("release") or 0),
        "current_release": int(current_release.get("release") or 0),
        "canonical_migrations": [Path(x).name for x in CANONICAL],
        "schema_rollback_allowed": False,
        "business_data_restore_automatic": False,
        "code_rollback_only": True,
        "target_must_have_prior_successful_production_deployment": True,
        "production_business_snapshot_required_before_execution": True,
        "post_rollback_binding_and_public_smoke_required": True,
        "source_reconciliation_required_after_emergency_control_plane_rollback": True,
        "provider_execution_authorized": False,
        "raw_r2_delete_authorized": False,
    }
    out = Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(plan, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print("RELEASE 466 PRODUCTION ROLLBACK READINESS: PASS")
    print(json.dumps(plan, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
