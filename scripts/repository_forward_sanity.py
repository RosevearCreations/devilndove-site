#!/usr/bin/env python3
"""Canonical current-release and repository forward-sanity authority."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
failures: list[str] = []


def require(condition: bool, message: str) -> None:
    if not condition:
        failures.append(message)


def text(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8", errors="replace")


release = json.loads(text("development-release.json"))
require(release.get("environment") == "development", "current release must target Development")
require(release.get("branch") == "dev", "current release branch must remain dev")
require(release.get("release") == 452, "current Development release must be Release 452")
require(release.get("label") == "Application Streamlining & UX/SEO Depth", "Release 452 label drifted")
require(release.get("release_track") == "single-current-release", "single current release track is required")
require(release.get("pages_project") == "devilndove-site-dev", "Development Pages project authority drifted")
require(release.get("convergence_state") == "application_streamlining_ux_seo_depth_source_proven_no_new_d1_migration", "Release 452 convergence state drifted")

previous = release.get("previous_release", {})
require(previous.get("release") == 451, "Release 451 must be the immediate previous release")
require(previous.get("state") == "complete_source_proven_no_new_d1_migration", "Release 451 completion authority missing")
require(previous.get("focused_source_gate_run") == 33252042376, "Release 451 focused source proof drifted")
require(previous.get("system_gate_run") == 33252156030, "Release 451 System Gate proof drifted")

module_keys = [row.get("key") for row in release.get("canonical_modules", [])]
require(module_keys == ["storefront", "creators", "socials", "financials", "it-platform"], f"canonical module authority drifted: {module_keys}")
require(all(row.get("status") == "active" for row in release.get("canonical_modules", [])), "all five canonical modules must remain active")
client_keys = [row.get("key") for row in release.get("clients", [])]
require(client_keys == ["web", "phone", "desktop"], f"canonical client authority drifted: {client_keys}")
require(all(row.get("status") == "active" for row in release.get("clients", [])), "Web/Phone/Desktop must remain active")

policy = release.get("release_policy", {})
require(policy.get("one_current_release") is True, "one-current-release policy must remain enabled")
require(policy.get("production_promotion") == "closed", "Production promotion must remain closed")
require(policy.get("provider_publication") == "closed", "marketplace provider publication must remain closed")
require(policy.get("current_release_d1_migration_required") is False, "Release 452 must not invent a D1 migration")
require(policy.get("request_time_schema_mutation") == "forbidden_for_marketplace_surfaces", "marketplace request-time schema mutation must remain forbidden")
require(policy.get("seo_gate_required") is True and policy.get("seo_depth_gate_required") is True, "both SEO gates must remain mandatory")
require(policy.get("repository_hygiene_gate_required") is True, "Release 452 repository hygiene must remain mandatory")

infra = release.get("development_infrastructure", {})
require(infra.get("cloudflare_account_id") == "c0d5bc25df16ae5b7d47c985c4b7b787", "Development Cloudflare account authority drifted")
d1 = infra.get("d1", {})
require(d1.get("binding") == "DB", "Development D1 binding drifted")
require(d1.get("database_name") == "devilndove-dev", "Development D1 name drifted")
require(d1.get("database_id") == "dbc1615b-dcbe-4951-973b-b47c99c73bfa", "Development D1 ID drifted")
require(d1.get("schema_current_through_release") == 450, "Release 452 must preserve verified D1 schema through Release 450")
require(infra.get("local_access_preflight") == "python scripts/cloudflare_development_access.py --auth-only", "Development Cloudflare access preflight drifted")
require(infra.get("connection_authority") == "docs/operations/DEVELOPMENT_CLOUDFLARE_CONNECTION_AUTHORITY.md", "future-chat D1 connection authority drifted")
require(infra.get("github_d1_credential", {}).get("secret_name") == "CLOUDFLARE_API_TOKEN", "GitHub D1 credential reference drifted")
r2 = {(row.get("binding"), row.get("bucket_name")) for row in infra.get("r2", [])}
require(r2 == {("PRODUCT_MEDIA_BUCKET", "devilndove-toolshed-images-dev"), ("CAIP_PRIVATE_MEDIA_BUCKET", "devilndove-caip-media-dev")}, f"Development R2 authority drifted: {r2}")
startup = " ".join(infra.get("startup_sequence", []))
for marker in ("new chat is not a migration event", "never replay Releases 447/448/449/450", "source/local gates", "read-only remote verifier", "Production"):
    require(marker.lower() in startup.lower(), f"Development startup sequence missing {marker!r}")

baseline = release.get("database_baseline", {})
require(baseline.get("release") == 447 and baseline.get("apply_status") == "applied_and_verified_development", "Release 447 verified database baseline drifted")
require(release.get("current_release_migrations") == [], "Release 452 current_release_migrations must be empty")
state = release.get("current_release_database_state", {})
require(state.get("new_migration_required") is False, "Release 452 database state must say no migration required")
require(state.get("last_verified_schema_release") == 450, "Release 450 must remain the last independently verified schema release")
require(state.get("historical_migration_replay") is False, "historical migration replay must remain false")

history = {row.get("release"): row for row in release.get("release_history", [])}
require(history.get(449, {}).get("verification_workflow_run") == 33235075008, "Release 449 completion evidence missing")
require(history.get(450, {}).get("mutation_workflow_run") == 33235769850, "Release 450 mutation evidence missing")
require(history.get(450, {}).get("verification_workflow_run") == 33235803838, "Release 450 verification evidence missing")
require(history.get(451, {}).get("system_gate_run") == 33252156030, "Release 451 carried-forward completion evidence missing")

batch = release.get("release452_batch", [])
require(len(batch) == 26, f"Release 452 batch must contain exactly 26 changes; found {len(batch)}")
require([item.get("id") for item in batch] == list(range(1, 27)), "Release 452 batch IDs must be exactly 1..26")
require(all(item.get("status") == "implemented" for item in batch), "all 26 Release 452 source changes must be implemented")

work = {row.get("key"): row for row in release.get("workstreams", [])}
for key in (
    "storefront-merchandising", "product-material-lineage", "manufacturer-provenance-reviews",
    "product-image-quality", "inventory-operations-intelligence", "tool-lifecycle",
    "supply-sourcing-replenishment", "caip-reviewed-content-handoff", "it-integration-registry",
    "financials-accounting", "marketplace-readiness", "marketplace-draft-exports",
    "marketplace-mapping", "marketplace-calibration", "seo-compliance", "seo-depth",
    "repository-hygiene", "product-breadcrumb-seo",
):
    require(key in work, f"current/carry-forward workstream missing: {key}")
require(work.get("product-breadcrumb-seo", {}).get("authority") == "public/js/product-breadcrumb-seo.js", "Product breadcrumb SEO authority drifted")

wrangler = text("wrangler.toml")
for marker in (
    'name = "devilndove-site-dev"', 'binding = "DB"', 'database_name = "devilndove-dev"',
    'database_id = "dbc1615b-dcbe-4951-973b-b47c99c73bfa"',
    'bucket_name = "devilndove-toolshed-images-dev"', 'bucket_name = "devilndove-caip-media-dev"',
):
    require(marker in wrangler, f"Development infrastructure marker missing: {marker}")
require("account_id =" not in wrangler, "Pages wrangler.toml must never contain account_id")

access = text("scripts/cloudflare_development_access.py")
for marker in (
    "EXPECTED_ACCOUNT_ID = 'c0d5bc25df16ae5b7d47c985c4b7b787'",
    "EXPECTED_DATABASE_NAME = 'devilndove-dev'",
    "EXPECTED_DATABASE_ID = 'dbc1615b-dcbe-4951-973b-b47c99c73bfa'",
    "env['CLOUDFLARE_ACCOUNT_ID'] = EXPECTED_ACCOUNT_ID",
    "Credentials printed: NEVER",
):
    require(marker in access, f"Development Cloudflare access safeguard missing: {marker}")

required_files = (
    "database_full_schema.sql",
    "scripts/cloudflare_development_access.py",
    "scripts/development_runtime_acceptance.py",
    "scripts/public_seo_gate.py",
    "scripts/public_seo_depth_gate.py",
    "scripts/release450_marketplace_seo_gate.py",
    "scripts/release451_marketplace_calibration_gate.py",
    "scripts/repository_hygiene_gate.py",
    "scripts/release452_application_streamlining_gate.py",
    "public/js/product-breadcrumb-seo.js",
    "admin/marketplace-readiness/index.html",
    "admin/marketplace-calibration/index.html",
    "functions/api/_lib/marketplaceReadiness.js",
    "functions/api/_lib/marketplaceCalibration.js",
    "docs/operations/DEVELOPMENT_CLOUDFLARE_CONNECTION_AUTHORITY.md",
    "docs/operations/RELEASE_451_D1_STATE.md",
    "docs/operations/RELEASE_452_APPLICATION_STREAMLINING.md",
)
for required in required_files:
    require((ROOT / required).exists(), f"required current authority missing: {required}")

require(not list(ROOT.glob("BUILD*.sql")), "historical root BUILD*.sql verification files must not ship; Git history is the archive")
require(not list(ROOT.glob("BUILD*.md")), "historical BUILD*.md files must not exist in repository root")
require(not (ROOT / "docs" / "archive").exists(), "docs/archive must not ship; Git history is the archive")
require(not (ROOT / "docs" / "releases").exists(), "docs/releases must not ship; current release belongs in development-release.json")
require(not (ROOT / "tmp").exists(), "tmp must not ship in repository")

connection = text("docs/operations/DEVELOPMENT_CLOUDFLARE_CONNECTION_AUTHORITY.md")
require("Release 452" in connection and "Release 450" in connection, "Development connection authority must identify current Release 452 and schema-through-450 state")
require("A new chat is not a migration event" in connection, "Development connection authority lost the new-chat migration rule")
roadmap = text("PROJECT_STATUS_AND_ROADMAP.md")
handoff = text("AI_HANDOFF.md")
require("Release 452" in roadmap and "Release 452" in handoff, "active human authorities must identify Release 452")

workflow = text(".github/workflows/system-gate.yml")
require("python scripts/repository_hygiene_gate.py" in workflow, "System Gate must validate repository hygiene")
require("python scripts/release452_application_streamlining_gate.py" in workflow, "System Gate must validate Release 452")
require("python scripts/release451_marketplace_calibration_gate.py" in workflow, "System Gate must carry Release 451 forward")
require("python scripts/release450_marketplace_seo_gate.py" in workflow, "System Gate must carry Release 450 forward")
require("python scripts/public_seo_gate.py" in workflow and "python scripts/public_seo_depth_gate.py" in workflow, "System Gate must validate both public SEO authorities")
require("python scripts/development_runtime_acceptance.py --self-check" in workflow, "System Gate must validate Development runtime acceptance safety")
require("node --check public/js/product-breadcrumb-seo.js" in workflow, "System Gate must syntax-check Product breadcrumb SEO runtime")
require("Production mutation capability: NONE" in workflow, "System Gate Production safety statement missing")

version_pattern = re.compile(r"([?&]v=)(\d+)(?:[.-][\w-]+)?(?=[\"'&#\s)]|$)")
runtime_files = list(ROOT.glob("*.html")) + list((ROOT / "admin").rglob("*.html")) + list((ROOT / "js").rglob("*.js")) + list((ROOT / "public/js").rglob("*.js")) + list((ROOT / "css").rglob("*.css"))
future = []
for path in sorted(set(runtime_files)):
    content = path.read_text(encoding="utf-8", errors="replace")
    for match in version_pattern.finditer(content):
        if int(match.group(2)) > int(release["release"]):
            future.append(f"{path.relative_to(ROOT)}:{match.group(2)}")
require(not future, f"future cache majors found: {future[:12]}")

print("PLATFORM FORWARD SANITY")
print(f"Current release: {release['release']} — {release['label']}")
print("Release 449: COMPLETE / REMOTE DEVELOPMENT D1 VERIFIED")
print("Release 450: COMPLETE / DEVELOPMENT D1 APPLIED + INDEPENDENTLY VERIFIED")
print("Release 451: COMPLETE / SOURCE-ONLY / NO D1 MIGRATION")
print("Release 452 source batch implemented: 26/26")
print("Release 452 new D1 migration: NONE REQUIRED")
print("Development D1: devilndove-dev / EXACT ID PINNED / SCHEMA CURRENT THROUGH 450")
print("Repository hygiene: REQUIRED")
print("Pages wrangler account_id: FORBIDDEN")
print("Provider publication: CLOSED")
print("Public structural + SEO depth gates: REQUIRED")
print("Production mutation capability: NONE")
if failures:
    for i, failure in enumerate(failures, 1):
        print(f"{i:03d}. FAIL — {failure}")
    raise SystemExit(1)
print("PLATFORM FORWARD SANITY: PASS")
