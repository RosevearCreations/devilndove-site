#!/usr/bin/env python3
"""Canonical Release 465 application + Release 463 environment forward-sanity authority."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FAIL: list[str] = []
LABEL = "Business Intelligence and Release Hardening"
STATE = "release465_build1_complete_development_green"
MIGRATIONS = [
    "migrations/canonical/0001_release464_migration_authority.sql",
    "migrations/canonical/0002_release464_operational_acceptance.sql",
    "migrations/canonical/0003_release464_business_growth.sql",
    "migrations/canonical/0004_release465_storefront_quality.sql",
]
MANIFEST_FILES = [Path(x).name for x in MIGRATIONS]


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
build1_authority = json.loads(read("release465-build1-storefront-quality.json") or "{}")

req(release.get("environment") == "development" and release.get("branch") == "dev", "application authority must remain Development/dev")
req(int(release.get("release") or 0) == 465, "current application release must be 465")
req(release.get("label") == LABEL, "Release 465 label drifted")
req(release.get("convergence_state") == STATE, "Release 465 Build 1 must be documented Development green")
req(int(release.get("environment_release") or 0) == 463, "environment overlay must remain Release 463")
req([x.get("key") for x in release.get("canonical_modules", [])] == ["storefront", "creators", "socials", "financials", "it-platform"], "canonical five-module authority drifted")

previous = release.get("previous_release", {})
req(int(previous.get("release") or 0) == 464 and previous.get("state") == "complete_development_green", "Release 464 must remain the completed prior application release")

infra = release.get("development_infrastructure", {})
d1 = infra.get("d1", {})
req(d1.get("binding") == "DB", "Development D1 binding must remain DB")
req(d1.get("database_name") == "devilndove-dev" and d1.get("database_id") == "dbc1615b-dcbe-4951-973b-b47c99c73bfa", "Development D1 identity drifted")
req(int(d1.get("historical_schema_baseline_release") or 0) == 461, "historical schema baseline must remain Release 461")
req(d1.get("canonical_migrations_dir") == "migrations/canonical", "canonical migration directory drifted")
req(d1.get("native_migration_ledger") == "d1_migrations" and d1.get("proof_table") == "app_schema_migration_proofs", "Development migration ledger/proof authority drifted")

production = release.get("production_infrastructure", {})
prod_d1 = production.get("d1", {})
req(production.get("branch") == "main" and production.get("pages_project") == "devilndove-site", "Production branch/project authority drifted")
req(prod_d1.get("database_name") == "devilndove-prod-r462" and prod_d1.get("database_id") == "f34a741b-0000-45b0-9a96-6be08754d563", "Production D1 identity drifted")

policy = release.get("release_policy", {})
req(policy.get("historical_migration_replay") is False, "historical migration replay must remain forbidden")
req(policy.get("production_promotion") == "exact_green_development_tree_only", "exact Development-tree promotion rule missing")
req(policy.get("main_only_application_patches") is False, "main-only application patches must remain forbidden")
req(policy.get("future_d1_schema_changes") == "migrations/canonical_only", "future D1 change authority drifted")
req(policy.get("development_first_schema_verification") is True and policy.get("production_migration_before_dependent_code") is True, "Development-first / Production-before-code migration order drifted")
req(policy.get("production_transactional_data_owned_by_production") is True and policy.get("blind_dev_to_production_data_overwrite") is False, "Production data ownership boundary drifted")
req(policy.get("provider_execution") == "closed" and policy.get("provider_publication") == "closed" and policy.get("provider_live_authorization") == "closed", "provider boundaries must remain closed")
req(policy.get("request_time_schema_mutation") == "blocked_by_runtime_firewall_and_source_gate", "runtime schema mutation blockade missing")
req(policy.get("preview_access_must_not_be_weakened_for_smoke") is True, "Preview smoke must preserve Cloudflare Access")

migrations = release.get("current_release_migrations", [])
req([x.get("file") for x in migrations] == MIGRATIONS, "current canonical migration authority must be exact 0001-0004 sequence")
req(all(x.get("development_apply") == "applied_and_verified" for x in migrations), "all four canonical migrations must be Development applied and verified")
req(all(x.get("production_apply") == "production_promotion_gate_managed_not_yet_promoted" for x in migrations), "Production migrations must remain unpromoted")

req(manifest.get("stream") == "devilndove-canonical-forward", "canonical migration stream drifted")
rules = manifest.get("rules", {})
req(rules.get("development_first") is True and rules.get("production_before_dependent_code") is True, "canonical manifest safety order drifted")
req(rules.get("native_ledger") == "d1_migrations" and rules.get("proof_table") == "app_schema_migration_proofs", "canonical manifest ledger/proof authority drifted")
manifest_files = [m.get("file") for m in manifest.get("migrations", [])]
req(manifest_files == MANIFEST_FILES and len(manifest_files) == len(set(manifest_files)), "canonical manifest must contain one exact immutable 0001-0004 sequence")

runtime = read("functions/api/_lib/releaseAuthority.js")
req("CURRENT_RELEASE = 465" in runtime and LABEL in runtime, "shared runtime Release 465 authority drifted")
firewall = read("functions/api/_lib/schemaSafeD1.js")
req("createSchemaSafeD1" in firewall and "runtime_schema_mutation_forbidden" in firewall, "runtime D1 schema firewall missing")
admin_audit = read("functions/api/_lib/adminAudit.js")
req("createSchemaSafeD1(env.DB || env.DD_DB)" in admin_audit, "shared admin D1 path is not schema-safe")

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

for key, ids in (
    ("release464_update1", list(range(1, 8))),
    ("release464_update2", [8, 9, 10, 11, 12, 13]),
    ("release464_update3", [14, 15, 16, 17, 18, 19, 20]),
):
    rows = release.get(key, [])
    req([x.get("id") for x in rows] == ids, f"{key} identity drifted")
    req(all(str(x.get("status") or "").startswith("complete") for x in rows), f"{key} must remain complete")

build1 = release.get("release465_build1", [])
req([x.get("id") for x in build1] == list(range(1, 8)), "Release 465 Build 1 must contain items 1-7")
req(all(x.get("status") == "complete_development_green" for x in build1), "Release 465 Build 1 items must be Development green")
planned = {int(x.get("build") or 0): x for x in release.get("planned_builds", [])}
req(1 not in planned, "Completed Build 1 must not remain planned")
req(planned.get(2, {}).get("items") == [8, 9, 10, 11, 12, 13], "Build 2 must remain the next planned block")
req(planned.get(3, {}).get("items") == [14, 15, 16, 17, 18, 19, 20], "Build 3 must remain planned behind Build 2")

evidence = release.get("current_release_evidence", {})
req(evidence.get("release464_updates_1_3_development_green") is True, "Release 464 inherited green evidence missing")
req(evidence.get("build1_development_green") is True, "Build 1 green evidence missing")
req(evidence.get("build1_technical_green_source_sha") == "4359862e1d7a9d8dfc53841d0d25c6a219f134c3", "Build 1 technical-green SHA drifted")
req(int(evidence.get("build1_system_gate_run") or 0) == 33428268265, "Build 1 System Gate run drifted")
req(int(evidence.get("development_d1_tables") or 0) >= 583, "Development D1 table count regressed")
req(int(evidence.get("development_native_migration_rows") or 0) == 4 and int(evidence.get("development_migration_proof_rows") or 0) == 4, "Build 1 must retain 4 native migration + 4 proof rows")
req(int(evidence.get("development_foreign_key_violations", -1)) == 0, "Development FK authority drifted")
req(int(evidence.get("release465_publication_triggers") or 0) == 4, "Release 465 publication trigger proof missing")
req(evidence.get("preview_smoke_pass") is True and evidence.get("preview_smoke_mode") == "CLOUDFLARE_ACCESS_PROTECTED", "Build 1 Preview smoke evidence missing")
req(int(evidence.get("preview_smoke_auth_headers_used") or 0) == 0 and evidence.get("preview_access_weakened") is False, "Build 1 Preview smoke must use zero auth headers and preserve Access")
req(evidence.get("production_mutation_executed_for_build1") is False, "Build 1 must not mutate Production")
req(evidence.get("provider_execution_enabled") is False and evidence.get("provider_publication_enabled") is False and evidence.get("raw_caip_r2_delete_enabled") is False, "provider/R2 safety boundaries drifted")

req(build1_authority.get("state") == "complete_development_green", "Release 465 Build 1 authority must be complete Development green")
req(all(x.get("status") == "complete_development_green" for x in build1_authority.get("items", [])), "Release 465 Build 1 authority item status drifted")
dev_evidence = build1_authority.get("development_evidence") or {}
req(dev_evidence.get("source_sha") == "4359862e1d7a9d8dfc53841d0d25c6a219f134c3", "Build 1 authority technical-green SHA drifted")
req(int(dev_evidence.get("native_migration_rows") or 0) == 4 and int(dev_evidence.get("proof_rows") or 0) == 4 and int(dev_evidence.get("foreign_key_violations", -1)) == 0, "Build 1 authority D1 proof drifted")

for path in (
    "AI_HANDOFF.md",
    "PROJECT_STATUS_AND_ROADMAP.md",
    "SANITY_HEALTH_CHECK.md",
    "docs/operations/RELEASE_465_THREE_BUILD_ROADMAP.md",
    "release465-build1-storefront-quality.json",
    "docs/operations/DEVELOPMENT_CLOUDFLARE_CONNECTION_AUTHORITY.md",
    "migrations/canonical/README.md",
    "scripts/d1_migrate.py",
    "scripts/main_promotion_gate.py",
    "scripts/migration_policy_gate.py",
    "scripts/runtime_schema_mutation_gate.py",
    "scripts/release465_build1_gate.py",
):
    req((ROOT / path).is_file(), f"canonical authority missing: {path}")

print("PLATFORM FORWARD SANITY")
print(f"Application release: 465 — {LABEL}")
print("Release 465 Build 1: DEVELOPMENT GREEN")
print("Next bounded work: Build 2 items 8-13 only")
print("Environment release: 463 — one Pages project with isolated Dev/Production D1 + R2")
print("Historical D1 baseline: Release 461 — provenance only, never replayed")
print("Forward D1 migration stream: migrations/canonical (0001 + 0002 + 0003 + 0004)")
print("Request-time schema mutation capability: BLOCKED")
print("Production data ownership: PRODUCTION")
if FAIL:
    for index, item in enumerate(FAIL, 1):
        print(f"{index:03d}. FAIL — {item}")
    raise SystemExit(1)
print("PLATFORM FORWARD SANITY: PASS")
