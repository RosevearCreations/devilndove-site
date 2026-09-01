#!/usr/bin/env python3
"""Canonical Release 465 + Release 463 environment forward sanity."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FAIL: list[str] = []
LABEL = "Business Intelligence and Release Hardening"
ALLOWED = {"release465_build3_source_candidate", "release465_complete_development_green"}
MIGRATIONS = [
    "migrations/canonical/0001_release464_migration_authority.sql",
    "migrations/canonical/0002_release464_operational_acceptance.sql",
    "migrations/canonical/0003_release464_business_growth.sql",
    "migrations/canonical/0004_release465_storefront_quality.sql",
]
PRODUCTION_APPLY_STATES = {
    "production_promotion_gate_managed_not_yet_promoted",
    "applied_and_verified",
}


def read(path: str) -> str:
    file = ROOT / path
    if not file.is_file():
        FAIL.append(f"missing file: {path}")
        return ""
    return file.read_text(encoding="utf-8", errors="replace")


def req(ok: bool, message: str) -> None:
    if not ok:
        FAIL.append(message)


r = json.loads(read("development-release.json") or "{}")
env = json.loads(read("release463-environment.json") or "{}")
manifest = json.loads(read("migrations/canonical/manifest.json") or "{}")
b1 = json.loads(read("release465-build1-storefront-quality.json") or "{}")
b2 = json.loads(read("release465-build2-inventory-creator-intelligence.json") or "{}")
b3 = json.loads(read("release465-build3-financial-it-hardening.json") or "{}")
state = r.get("convergence_state")

req(r.get("environment") == "development" and r.get("branch") == "dev", "application authority must remain Development/dev")
req(int(r.get("release") or 0) == 465 and r.get("label") == LABEL, "current Release 465 authority drifted")
req(state in ALLOWED, "Build 3 convergence state unsupported")
req(int(r.get("environment_release") or 0) == 463, "environment overlay must remain Release 463")
req(
    [x.get("key") for x in r.get("canonical_modules", [])] == ["storefront", "creators", "socials", "financials", "it-platform"],
    "five-module authority drifted",
)

dev = r.get("development_infrastructure") or {}
d1 = dev.get("d1") or {}
prod = r.get("production_infrastructure") or {}
pd1 = prod.get("d1") or {}
req(
    dev.get("pages_project") == "devilndove-site" and dev.get("pages_environment") == "preview" and dev.get("pages_branch") == "dev",
    "Development Pages boundary drifted",
)
req(
    d1.get("database_name") == "devilndove-dev" and d1.get("database_id") == "dbc1615b-dcbe-4951-973b-b47c99c73bfa",
    "Development D1 drifted",
)
req(
    prod.get("branch") == "main" and pd1.get("database_name") == "devilndove-prod-r462" and pd1.get("database_id") == "f34a741b-0000-45b0-9a96-6be08754d563",
    "Production authority drifted",
)
req(d1.get("database_id") != pd1.get("database_id"), "Development and Production D1 must remain isolated")

policy = r.get("release_policy") or {}
req(policy.get("historical_migration_replay") is False, "historical replay must remain false")
req(
    policy.get("production_promotion") == "exact_green_development_tree_only" and policy.get("main_only_application_patches") is False,
    "promotion boundary drifted",
)
req(
    policy.get("future_d1_schema_changes") == "migrations/canonical_only"
    and policy.get("development_first_schema_verification") is True
    and policy.get("production_migration_before_dependent_code") is True,
    "migration order/authority drifted",
)
req(
    policy.get("production_transactional_data_owned_by_production") is True and policy.get("blind_dev_to_production_data_overwrite") is False,
    "Production data ownership drifted",
)
req(
    policy.get("provider_execution") == "closed"
    and policy.get("provider_publication") == "closed"
    and policy.get("provider_live_authorization") == "closed",
    "provider boundary drifted",
)
req(
    policy.get("request_time_schema_mutation") == "blocked_by_runtime_firewall_and_source_gate"
    and policy.get("preview_access_must_not_be_weakened_for_smoke") is True,
    "runtime/Access safety drifted",
)

release_migrations = r.get("current_release_migrations") or []
req([x.get("file") for x in release_migrations] == MIGRATIONS, "current migration list must remain exact 0001-0004")
req(all(x.get("development_apply") == "applied_and_verified" for x in release_migrations), "Development migrations must remain proven")
production_apply_values = {x.get("production_apply") for x in release_migrations}
req(
    len(production_apply_values) == 1 and production_apply_values.issubset(PRODUCTION_APPLY_STATES),
    "Production migration state must be consistently pre-promotion or applied-and-verified",
)
req(
    [x.get("file") for x in manifest.get("migrations", [])] == [Path(x).name for x in MIGRATIONS],
    "manifest sequence drifted",
)

db = r.get("current_release_database_state") or {}
req(db.get("new_development_migration_required") is False, "Build 3 must not request a migration")
req(db.get("build2_schema_change_required") is False and db.get("build2_migration") == "none", "Build 2 schema boundary drifted")
req(db.get("build3_schema_change_required") is False and db.get("build3_migration") == "none", "Build 3 must remain schema-neutral")
req(
    int(db.get("development_native_migration_rows") or 0) == 4 and int(db.get("development_migration_proof_rows") or 0) == 4,
    "Development migration proof must remain 4/4",
)

req(b1.get("state") == "complete_development_green" and all(x.get("status") == "complete_development_green" for x in b1.get("items", [])), "Build 1 must remain green")
req(b2.get("state") == "complete_development_green" and all(x.get("status") == "complete_development_green" for x in b2.get("items", [])), "Build 2 must remain green")
req([x.get("id") for x in b3.get("items", [])] == [14, 15, 16, 17, 18, 19, 20], "Build 3 authority item identity drifted")

r3 = r.get("release465_build3") or []
req([x.get("id") for x in r3] == [14, 15, 16, 17, 18, 19, 20], "Build 3 release identity drifted")
planned = {int(x.get("build") or 0): x for x in r.get("planned_builds", [])}
if state == "release465_build3_source_candidate":
    req(b3.get("state") == "in_progress_source_candidate" and all(x.get("status") == "implemented_source_candidate" for x in r3), "Build 3 candidate state drifted")
    req(planned.get(3, {}).get("items") == [14, 15, 16, 17, 18, 19, 20], "Build 3 must remain in-progress")
else:
    req(b3.get("state") == "complete_development_green" and all(x.get("status") == "complete_development_green" for x in r3), "Build 3 closure state drifted")
    req(3 not in planned, "Completed Build 3 must not remain planned")
    evidence = r.get("current_release_evidence") or {}
    req(evidence.get("build3_development_green") is True, "Build 3 green evidence missing")
    req(
        int(evidence.get("development_native_migration_rows") or 0) == 4
        and int(evidence.get("development_migration_proof_rows") or 0) == 4
        and int(evidence.get("development_foreign_key_violations", -1)) == 0,
        "Build 3 D1 closure evidence drifted",
    )
    req(
        evidence.get("preview_smoke_pass") is True and evidence.get("preview_smoke_mode") == "CLOUDFLARE_ACCESS_PROTECTED",
        "Build 3 smoke evidence missing",
    )

req(int(env.get("environment_release") or 0) == 463 and env.get("canonical_pages_project") == "devilndove-site", "Release 463 environment authority drifted")
req((env.get("native_git_deployments") or {}).get("enabled") is False, "native Git-triggered Pages deploy must remain frozen")
req((env.get("production") or {}).get("d1", {}).get("id") == "f34a741b-0000-45b0-9a96-6be08754d563", "Production D1 environment authority drifted")
req((env.get("production") or {}).get("r2", {}).get("product") == "devilndove-toolshed-images", "Production Product R2 authority drifted")
req((env.get("production") or {}).get("r2", {}).get("caip") == "devilndove-caip-media", "Production CAIP R2 authority drifted")

wrangler = read("wrangler.toml")
req(
    'name = "devilndove-site"' in wrangler
    and 'migrations_dir = "migrations/canonical"' in wrangler
    and 'database_id = "dbc1615b-dcbe-4951-973b-b47c99c73bfa"' in wrangler,
    "tracked Wrangler Development authority drifted",
)
req(
    "f34a741b-0000-45b0-9a96-6be08754d563" not in wrangler and "account_id =" not in wrangler,
    "tracked Wrangler contains forbidden Production/account identity",
)

production_workflow = read(".github/workflows/production-pages-deploy.yml")
for token in (
    "branches: [main]",
    "python scripts/main_promotion_gate.py",
    "assert release['release']==465",
    "release465_complete_development_green",
    "--target production --apply --production-ack LIVE_SCHEMA_CHANGE",
    "release465-prod-business-before.json",
    "canonical_migrations",
    "migration_proofs",
    "release465_triggers",
    "build3_required_tables",
    "business_counts_preserved",
    "release465-production-control-plane-proof.json",
    "RELEASE 465 PRODUCTION PUBLIC SMOKE: PASS",
    "release465-production-promotion-proof",
):
    req(token in production_workflow, f"Release 465 Production promotion workflow missing contract: {token}")
req("assert release['release']==464" not in production_workflow, "Production workflow still contains stale Release 464 release assertion")
req("RELEASE 464 ISOLATED PRODUCTION D1 PREDEPLOY" not in production_workflow, "Production workflow still contains stale Release 464 D1 proof")

for path in (
    "AI_HANDOFF.md",
    "PROJECT_STATUS_AND_ROADMAP.md",
    "SANITY_HEALTH_CHECK.md",
    "docs/operations/RELEASE_465_THREE_BUILD_ROADMAP.md",
    "release465-build1-storefront-quality.json",
    "release465-build2-inventory-creator-intelligence.json",
    "release465-build3-financial-it-hardening.json",
    "release465-performance-budget.json",
    "scripts/release465_build1_gate.py",
    "scripts/release465_build2_gate.py",
    "scripts/release465_build3_gate.py",
    "scripts/release465_performance_budget_gate.py",
    "scripts/release465_regression_evidence.py",
):
    req((ROOT / path).is_file(), f"canonical authority missing: {path}")

print("PLATFORM FORWARD SANITY")
print("Application release: 465 —", LABEL)
print("Build 1: DEVELOPMENT GREEN")
print("Build 2: DEVELOPMENT GREEN")
print("Build 3:", "SOURCE CANDIDATE" if str(state).endswith("source_candidate") else "DEVELOPMENT GREEN")
print("Canonical D1: 0001-0004 / Build 3 migration NONE")
print("Production promotion workflow: RELEASE 465 READY")
if FAIL:
    for index, message in enumerate(FAIL, 1):
        print(f"{index:03d}. FAIL — {message}")
    raise SystemExit(1)
print("PLATFORM FORWARD SANITY: PASS")
