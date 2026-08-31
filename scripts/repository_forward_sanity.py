#!/usr/bin/env python3
"""Canonical Release 465 application + Release 463 environment forward-sanity authority."""
from __future__ import annotations
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FAIL = []
LABEL = "Business Intelligence and Release Hardening"
MIGRATIONS = [
    "migrations/canonical/0001_release464_migration_authority.sql",
    "migrations/canonical/0002_release464_operational_acceptance.sql",
    "migrations/canonical/0003_release464_business_growth.sql",
    "migrations/canonical/0004_release465_storefront_quality.sql",
]
MANIFEST_FILES = [Path(x).name for x in MIGRATIONS]
BUILD2_STATES = {"release465_build2_source_candidate", "release465_build2_complete_development_green"}

def read(path):
    p = ROOT / path
    if not p.is_file():
        FAIL.append(f"missing file: {path}")
        return ""
    return p.read_text(encoding="utf-8", errors="replace")

def req(ok, message):
    if not ok:
        FAIL.append(message)

release = json.loads(read("development-release.json") or "{}")
env463 = json.loads(read("release463-environment.json") or "{}")
manifest = json.loads(read("migrations/canonical/manifest.json") or "{}")
build1_authority = json.loads(read("release465-build1-storefront-quality.json") or "{}")
build2_authority = json.loads(read("release465-build2-inventory-creator-intelligence.json") or "{}")

req(release.get("environment") == "development" and release.get("branch") == "dev", "application authority must remain Development/dev")
req(int(release.get("release") or 0) == 465, "current application release must be 465")
req(release.get("label") == LABEL, "Release 465 label drifted")
state = release.get("convergence_state")
req(state in BUILD2_STATES, "Release 465 Build 2 state is unsupported")
req(int(release.get("environment_release") or 0) == 463, "environment overlay must remain Release 463")
req([x.get("key") for x in release.get("canonical_modules", [])] == ["storefront","creators","socials","financials","it-platform"], "canonical five-module authority drifted")

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
req([x.get("file") for x in migrations] == MIGRATIONS, "current canonical migration authority must remain exact 0001-0004 sequence")
req(all(x.get("development_apply") == "applied_and_verified" for x in migrations), "all four canonical migrations must remain Development applied and verified")
req(all(x.get("production_apply") == "production_promotion_gate_managed_not_yet_promoted" for x in migrations), "Production migrations must remain unpromoted")

db_state = release.get("current_release_database_state", {})
req(db_state.get("new_development_migration_required") is False, "Build 2 must not request a Development migration")
req(db_state.get("build2_schema_change_required") is False and db_state.get("build2_migration") == "none", "Build 2 schema boundary drifted")
req(int(db_state.get("development_native_migration_rows") or 0) == 4 and int(db_state.get("development_migration_proof_rows") or 0) == 4, "Build 2 must preserve 4 native migrations + 4 proof rows")

req(manifest.get("stream") == "devilndove-canonical-forward", "canonical migration stream drifted")
rules = manifest.get("rules", {})
req(rules.get("development_first") is True and rules.get("production_before_dependent_code") is True, "canonical manifest safety order drifted")
req(rules.get("native_ledger") == "d1_migrations" and rules.get("proof_table") == "app_schema_migration_proofs", "canonical manifest ledger/proof authority drifted")
manifest_files = [m.get("file") for m in manifest.get("migrations", [])]
req(manifest_files == MANIFEST_FILES and len(manifest_files) == len(set(manifest_files)), "canonical manifest must retain one exact immutable 0001-0004 sequence")

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
req("f34a741b-0000-45b0-9a96-6be08754d563" not in wrangler and "account_id =" not in wrangler, "tracked Wrangler contains forbidden Production/account identity")

for key, ids in (
    ("release464_update1", list(range(1,8))),
    ("release464_update2", [8,9,10,11,12,13]),
    ("release464_update3", [14,15,16,17,18,19,20]),
):
    entries = release.get(key, [])
    req([x.get("id") for x in entries] == ids, f"{key} identity drifted")
    req(all(str(x.get("status") or "").startswith("complete") for x in entries), f"{key} must remain complete")

build1 = release.get("release465_build1", [])
req([x.get("id") for x in build1] == list(range(1,8)), "Release 465 Build 1 must contain items 1-7")
req(all(x.get("status") == "complete_development_green" for x in build1), "Release 465 Build 1 items must remain Development green")
req(build1_authority.get("state") == "complete_development_green", "Build 1 authority must remain complete Development green")

build2 = release.get("release465_build2", [])
req([x.get("id") for x in build2] == [8,9,10,11,12,13], "Release 465 Build 2 must contain items 8-13")
req(build2_authority.get("state") in ("in_progress_source_candidate", "complete_development_green"), "Build 2 authority state drifted")
req(build2_authority.get("schema_change_required") is False and build2_authority.get("migration") is None, "Build 2 must remain schema-neutral")

planned = {int(x.get("build") or 0): x for x in release.get("planned_builds", [])}
if state == "release465_build2_source_candidate":
    req(all(x.get("status") == "implemented_source_candidate" for x in build2), "Build 2 source candidate statuses drifted")
    req(build2_authority.get("state") == "in_progress_source_candidate", "Build 2 authority must be source candidate before technical green")
    req(planned.get(2, {}).get("items") == [8,9,10,11,12,13], "Build 2 must remain planned/in-progress during source candidate")
else:
    req(all(x.get("status") == "complete_development_green" for x in build2), "Build 2 complete statuses drifted")
    req(build2_authority.get("state") == "complete_development_green", "Build 2 authority must be complete after closure")
    req(2 not in planned, "Completed Build 2 must not remain planned")
    evidence = release.get("current_release_evidence", {})
    req(evidence.get("build2_development_green") is True, "Build 2 green evidence missing")
    req(bool(evidence.get("build2_final_restart_sha")), "Build 2 final restart SHA missing")
    req(int(evidence.get("build2_final_system_gate_run") or 0) > 0, "Build 2 final System Gate run missing")
    req(str(evidence.get("build2_final_exact_preview") or "").startswith("https://"), "Build 2 final exact Preview missing")
    req(int(evidence.get("development_native_migration_rows") or 0) == 4 and int(evidence.get("development_migration_proof_rows") or 0) == 4, "Build 2 closure must preserve 4/4 D1 migration proof")
    req(int(evidence.get("development_foreign_key_violations", -1)) == 0, "Build 2 closure FK authority drifted")

req(planned.get(3, {}).get("items") == [14,15,16,17,18,19,20], "Build 3 must remain planned behind Build 2")

for path in (
    "AI_HANDOFF.md","PROJECT_STATUS_AND_ROADMAP.md","SANITY_HEALTH_CHECK.md","docs/operations/RELEASE_465_THREE_BUILD_ROADMAP.md",
    "release465-build1-storefront-quality.json","release465-build2-inventory-creator-intelligence.json","docs/operations/DEVELOPMENT_CLOUDFLARE_CONNECTION_AUTHORITY.md",
    "migrations/canonical/README.md","scripts/d1_migrate.py","scripts/main_promotion_gate.py","scripts/migration_policy_gate.py","scripts/runtime_schema_mutation_gate.py",
    "scripts/release465_build1_gate.py","scripts/release465_build2_gate.py",
):
    req((ROOT / path).is_file(), f"canonical authority missing: {path}")

print("PLATFORM FORWARD SANITY")
print(f"Application release: 465 — {LABEL}")
print("Release 465 Build 1: DEVELOPMENT GREEN")
print("Release 465 Build 2:", "DEVELOPMENT GREEN" if state.endswith("complete_development_green") else "SOURCE CANDIDATE")
print("Build 2 D1 migration: NONE; canonical stream remains 0001-0004")
print("Build 3: CLOSED until Build 2 Development green")
print("Environment release: 463 — one Pages project with isolated Dev/Production D1 + R2")
print("Historical D1 baseline: Release 461 — provenance only, never replayed")
print("Request-time schema mutation capability: BLOCKED")
print("Production data ownership: PRODUCTION")
if FAIL:
    for index, item in enumerate(FAIL, 1): print(f"{index:03d}. FAIL — {item}")
    raise SystemExit(1)
print("PLATFORM FORWARD SANITY: PASS")
