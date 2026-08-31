#!/usr/bin/env python3
"""Canonical Release 464 application + Release 463 environment forward-sanity authority."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FAIL: list[str] = []
LABEL = "Platform Integrity and Migration Authority"


def read(path: str) -> str:
    file = ROOT / path
    if not file.is_file():
        FAIL.append(f"missing file: {path}")
        return ""
    return file.read_text(encoding="utf-8", errors="replace")


def req(ok: bool, message: str) -> None:
    if not ok:
        FAIL.append(message)


release = json.loads(read("development-release.json") or "{}")
env463 = json.loads(read("release463-environment.json") or "{}")
manifest = json.loads(read("migrations/canonical/manifest.json") or "{}")

req(release.get("environment") == "development" and release.get("branch") == "dev", "application authority must remain Development/dev")
req(int(release.get("release") or 0) == 464, "current application release must be 464")
req(release.get("label") == LABEL, "Release 464 label drifted")
req([x.get("key") for x in release.get("canonical_modules", [])] == ["storefront","creators","socials","financials","it-platform"], "canonical five-module authority drifted")

infra = release.get("development_infrastructure", {})
d1 = infra.get("d1", {})
req(d1.get("binding") == "DB", "Development D1 binding must remain DB")
req(d1.get("database_name") == "devilndove-dev" and d1.get("database_id") == "dbc1615b-dcbe-4951-973b-b47c99c73bfa", "Development D1 identity drifted")
req(int(d1.get("historical_schema_baseline_release") or 0) == 461, "historical schema baseline must remain Release 461")
req(d1.get("canonical_migrations_dir") == "migrations/canonical", "canonical migration directory drifted")
req(d1.get("native_migration_ledger") == "d1_migrations", "native D1 ledger authority missing")
req(d1.get("proof_table") == "app_schema_migration_proofs", "migration proof-table authority missing")

production = release.get("production_infrastructure", {})
prod_d1 = production.get("d1", {})
req(production.get("branch") == "main" and production.get("pages_project") == "devilndove-site", "Production branch/project authority drifted")
req(prod_d1.get("database_name") == "devilndove-prod-r462" and prod_d1.get("database_id") == "f34a741b-0000-45b0-9a96-6be08754d563", "Production D1 identity drifted")

policy = release.get("release_policy", {})
req(policy.get("historical_migration_replay") is False, "historical migration replay must remain forbidden")
req(policy.get("production_promotion") == "exact_green_development_tree_only", "exact Development-tree promotion policy missing")
req(policy.get("main_only_application_patches") is False, "main-only application patches must remain forbidden")
req(policy.get("future_d1_schema_changes") == "migrations/canonical_only", "future D1 change authority drifted")
req(policy.get("development_first_schema_verification") is True, "Development-first migration proof missing")
req(policy.get("production_migration_before_dependent_code") is True, "Production migration-before-code rule missing")
req(policy.get("production_transactional_data_owned_by_production") is True and policy.get("blind_dev_to_production_data_overwrite") is False, "Production data-ownership boundary drifted")
req(policy.get("provider_execution") == "closed" and policy.get("provider_publication") == "closed" and policy.get("provider_live_authorization") == "closed", "provider boundaries must remain closed")
req(policy.get("request_time_schema_mutation") == "blocked_by_runtime_firewall_and_source_gate", "runtime schema mutation blockade missing")

migrations = release.get("current_release_migrations", [])
req(len(migrations) >= 1, "Release 464 must declare the canonical bootstrap migration")
if migrations:
    req(migrations[0].get("file") == "migrations/canonical/0001_release464_migration_authority.sql", "Release 464 canonical bootstrap migration identity drifted")

req(manifest.get("stream") == "devilndove-canonical-forward", "canonical migration stream drifted")
rules = manifest.get("rules", {})
req(rules.get("development_first") is True and rules.get("production_before_dependent_code") is True, "canonical manifest safety order drifted")
req(rules.get("native_ledger") == "d1_migrations" and rules.get("proof_table") == "app_schema_migration_proofs", "canonical ledger/proof authority drifted")
manifest_migrations = [m.get("file") for m in manifest.get("migrations", [])]
req(bool(manifest_migrations) and manifest_migrations[0] == "0001_release464_migration_authority.sql", "canonical migration bootstrap drifted")
req(len(manifest_migrations) == len(set(manifest_migrations)), "canonical migration manifest contains duplicate filenames")

runtime = read("functions/api/_lib/releaseAuthority.js")
req("CURRENT_RELEASE = 464" in runtime and LABEL in runtime, "shared runtime Release 464 authority drifted")
firewall = read("functions/api/_lib/schemaSafeD1.js")
req("createSchemaSafeD1" in firewall and "runtime_schema_mutation_forbidden" in firewall, "runtime D1 schema firewall missing")
admin_audit = read("functions/api/_lib/adminAudit.js")
req("createSchemaSafeD1(env.DB || env.DD_DB)" in admin_audit, "shared admin D1 path is not schema-safe")

# Release 463 remains the environment/cutover overlay beneath Release 464 application work.
req(int(env463.get("environment_release") or 0) == 463, "environment release must remain 463")
req(env463.get("canonical_pages_project") == "devilndove-site", "canonical Pages project drifted")
req(env463.get("branches", {}).get("development") == "dev" and env463.get("branches", {}).get("production") == "main", "environment branch authority drifted")
req(env463.get("native_git_deployments", {}).get("enabled") is False, "native Git-triggered Pages deployments must remain frozen")
dev = env463.get("development", {})
prod = env463.get("production", {})
req(dev.get("d1", {}).get("id") == "dbc1615b-dcbe-4951-973b-b47c99c73bfa", "Release 463 Development D1 drifted")
req(prod.get("d1", {}).get("id") == "f34a741b-0000-45b0-9a96-6be08754d563", "Release 463 Production D1 drifted")
req(dev.get("d1", {}).get("id") != prod.get("d1", {}).get("id"), "Development and Production D1 must remain isolated")
req(dev.get("r2", {}).get("product") == "devilndove-toolshed-images-dev" and dev.get("r2", {}).get("caip") == "devilndove-caip-media-dev", "Development R2 authority drifted")
req(prod.get("r2", {}).get("product") == "devilndove-toolshed-images" and prod.get("r2", {}).get("caip") == "devilndove-caip-media", "Production R2 authority drifted")

wrangler = read("wrangler.toml")
req('name = "devilndove-site"' in wrangler and 'migrations_dir = "migrations/canonical"' in wrangler, "tracked Wrangler migration/project authority drifted")
req('database_name = "devilndove-dev"' in wrangler and 'database_id = "dbc1615b-dcbe-4951-973b-b47c99c73bfa"' in wrangler, "tracked Wrangler Development D1 authority drifted")
req("f34a741b-0000-45b0-9a96-6be08754d563" not in wrangler and "account_id =" not in wrangler, "tracked Wrangler configuration contains forbidden Production/account identity")

update1 = release.get("release464_update1", [])
req([x.get("id") for x in update1] == list(range(1, 8)), "Release 464 Update 1 must contain items 1-7")
planned = {int(x.get("update") or 0): x for x in release.get("planned_updates", [])}
req(planned.get(2, {}).get("items") == [8,9,10,11,12,13], "Update 2 roadmap drifted")
req(planned.get(3, {}).get("items") == [14,15,16,17,18,19,20], "Update 3 roadmap drifted")

for path in (
    "AI_HANDOFF.md",
    "PROJECT_STATUS_AND_ROADMAP.md",
    "SANITY_HEALTH_CHECK.md",
    "docs/operations/DEVELOPMENT_CLOUDFLARE_CONNECTION_AUTHORITY.md",
    "docs/operations/RELEASE_464_THREE_UPDATE_ROADMAP.md",
    "migrations/canonical/README.md",
    "scripts/d1_migrate.py",
    "scripts/main_promotion_gate.py",
    "scripts/migration_policy_gate.py",
    "scripts/runtime_schema_mutation_gate.py",
):
    req((ROOT / path).is_file(), f"canonical authority missing: {path}")

print("PLATFORM FORWARD SANITY")
print(f"Application release: 464 — {LABEL}")
print("Environment release: 463 — one Pages project with isolated Dev/Production D1 + R2")
print("Historical D1 baseline: Release 461 — provenance only, never replayed")
print("Forward D1 migration stream: migrations/canonical")
print("Request-time schema mutation capability: BLOCKED")
print("Production data ownership: PRODUCTION")
if FAIL:
    for index, item in enumerate(FAIL, 1):
        print(f"{index:03d}. FAIL — {item}")
    raise SystemExit(1)
print("PLATFORM FORWARD SANITY: PASS")