#!/usr/bin/env python3
"""Fail-closed source contract for Release 467 Build 8 — Authority Convergence and Restart Safety."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FAIL: list[str] = []


def req(ok: bool, message: str) -> None:
    if not ok:
        FAIL.append(message)


def read(path: str) -> str:
    p = ROOT / path
    if not p.is_file():
        FAIL.append(f"missing required file: {path}")
        return ""
    return p.read_text(encoding="utf-8", errors="replace")


def load(path: str) -> dict:
    body = read(path)
    if not body:
        return {}
    try:
        value = json.loads(body)
    except json.JSONDecodeError as exc:
        FAIL.append(f"invalid JSON {path}: {exc}")
        return {}
    req(isinstance(value, dict), f"{path} must contain a JSON object")
    return value if isinstance(value, dict) else {}


BASE_SHA = "5eef764a67466dc2989a4681c6a7cc782b9d4df9"
TREE_SHA = "f7327733dc423982016829d717521ceab2029f35"
SYSTEM_GATE = 33591744817
BUILD7_PROOF = 33591744787

pointer = load("current-development-authority.json")
manifest = load("release467-build8-authority-convergence.json")
build7 = load("release467-build7-external-commercial-acceptance.json")
compat = load("development-release.json")

pointer_build = int(pointer.get("build") or 0)
req(pointer.get("release") == 467 and pointer_build >= 8, "current authority pointer must remain Release 467 Build 8 or newer")
req(pointer.get("state") in {"DEVELOPMENT_CANDIDATE", "DEVELOPMENT_GREEN"}, "current authority pointer state drifted")
if pointer_build == 8:
    req(pointer.get("source_base_sha") == BASE_SHA, "Build 8 source base must be the exact merged Build 7 SHA")
    req(pointer.get("last_green_build") == 7, "Build 7 must remain the last proven predecessor until Build 8 closure")
    req(pointer.get("last_green_dev_sha") == BASE_SHA, "last green dev SHA drifted")
    req(pointer.get("last_green_dev_tree_sha") == TREE_SHA, "last green dev tree SHA drifted")
    req(pointer.get("last_green_system_gate_run") == SYSTEM_GATE, "Build 7 System Gate evidence drifted")
    req(pointer.get("last_green_build_proof_run") == BUILD7_PROOF, "Build 7 proof evidence drifted")
else:
    req(int(pointer.get("last_green_build") or 0) >= 8, "newer Release 467 pointer must preserve Build 8 as a closed predecessor")
    req(bool(pointer.get("last_green_dev_sha")), "newer Release 467 pointer must retain a last-green Development SHA")
    req(bool(pointer.get("last_green_system_gate_run")), "newer Release 467 pointer must retain a last-green System Gate run")
    req(bool(pointer.get("last_green_build_proof_run")), "newer Release 467 pointer must retain a last-green build proof run")
req(pointer.get("development_target") == "https://dev.devilndove-site.pages.dev", "canonical Development target drifted")
req((pointer.get("development_d1") or {}).get("name") == "devilndove-dev", "Development D1 name drifted")
req((pointer.get("development_d1") or {}).get("id") == "dbc1615b-dcbe-4951-973b-b47c99c73bfa", "Development D1 id drifted")
req(pointer.get("promotion_authority") == "release467-build5-production-promotion-readiness.json", "promotion authority drifted")
req(pointer.get("promotion_state") == "NO_AUTOMATIC_PROMOTION", "Build 8 must not authorize automatic promotion")

for key in (
    "schema_change_authorized",
    "d1_mutation_authorized",
    "r2_mutation_authorized",
    "provider_execution_authorized",
    "provider_publication_authorized",
    "cloudflare_access_mutation_authorized",
    "main_mutation_authorized",
    "production_mutation_authorized",
    "secret_values_emitted",
):
    req(pointer.get(key) is False, f"current pointer safety flag must remain false: {key}")

compat_pointer = pointer.get("compatibility_authority") or {}
req(compat_pointer.get("file") == "development-release.json", "compatibility authority file drifted")
req(compat_pointer.get("role") == "INHERITED_REGRESSION_COMPATIBILITY", "development-release compatibility role drifted")
req(compat_pointer.get("top_level_release_remains") == 466, "development-release top-level compatibility release must remain 466")

req(manifest.get("release") == 467 and manifest.get("build") == 8, "Build 8 manifest identity drifted")
req(manifest.get("source_base_sha") == BASE_SHA, "Build 8 manifest source base drifted")
req(manifest.get("external_acceptance_state") == "HOLD_EXTERNAL", "Build 8 must preserve external HOLD")
for key in (
    "schema_change_authorized",
    "request_time_schema_mutation",
    "d1_mutation_authorized",
    "r2_mutation_authorized",
    "provider_execution_authorized",
    "provider_publication_authorized",
    "cloudflare_access_policy_mutation_authorized",
    "main_mutation_authorized",
    "production_mutation_authorized",
    "secret_values_emitted",
):
    req(manifest.get(key) is False, f"Build 8 manifest safety flag must remain false: {key}")

predecessor = manifest.get("predecessor") or {}
req(predecessor.get("release") == 467 and predecessor.get("build") == 7, "Build 8 predecessor must be Release 467 Build 7")
req(predecessor.get("merged_dev_sha") == BASE_SHA, "Build 8 predecessor SHA drifted")
req(predecessor.get("tree_sha") == TREE_SHA, "Build 8 predecessor tree SHA drifted")
req(predecessor.get("system_gate_run") == SYSTEM_GATE, "Build 8 predecessor System Gate drifted")
req(predecessor.get("build7_proof_run") == BUILD7_PROOF, "Build 8 predecessor proof drifted")

req(build7.get("release") == 467 and build7.get("build") == 7, "Build 7 authority must remain present")
req(build7.get("external_acceptance_state") == "HOLD_EXTERNAL", "Build 7 external acceptance must remain truthful HOLD")
req(build7.get("main_mutation_authorized") is False and build7.get("production_mutation_authorized") is False, "Build 7 Production boundary widened")

# development-release.json is intentionally retained as inherited Release 466 regression compatibility.
req(compat.get("release") == 466, "development-release.json must remain Release 466 compatibility evidence")
req(compat.get("convergence_state") == "release466_build3_development_green_external_ruleset_pending", "Release 466 compatibility convergence state drifted")
prod = compat.get("production_infrastructure") or {}
req(prod.get("current_production_release") == 465, "inherited Production compatibility release drifted")
req(prod.get("current_production_source_sha") == "d5009d9c622bdf84232b3aa7bd24a1c3d61581b2", "inherited Production compatibility SHA drifted")

manifest_migrations = load("migrations/canonical/manifest.json")
expected_migrations = [
    "0001_release464_migration_authority.sql",
    "0002_release464_operational_acceptance.sql",
    "0003_release464_business_growth.sql",
    "0004_release465_storefront_quality.sql",
]
req([row.get("file") for row in manifest_migrations.get("migrations", [])] == expected_migrations, "Build 8 must preserve canonical migrations 0001-0004 exactly")
req(not list((ROOT / "migrations/canonical").glob("*467*build8*")), "Build 8 is schema-neutral but a Build 8 canonical migration exists")

required_docs = {
    "AI_HANDOFF.md": ["Release 467 Build 8", "current-development-authority.json", "INHERITED_REGRESSION_COMPATIBILITY", "HOLD_EXTERNAL"],
    "PROJECT_STATUS_AND_ROADMAP.md": ["Release 467 Build 8", BASE_SHA, "HOLD_EXTERNAL", "Production"],
    "SANITY_HEALTH_CHECK.md": ["Release 467 Build 8", BASE_SHA, str(SYSTEM_GATE), str(BUILD7_PROOF), "HOLD_EXTERNAL"],
    "MARKDOWN_INDEX.md": ["Release 467 Build 8", "current-development-authority.json", "development-release.json", "compatibility"],
    "docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md": ["current-development-authority.json", "AI_HANDOFF.md", "INHERITED_REGRESSION_COMPATIBILITY", "devilndove-dev"],
    "docs/operations/RELEASE_467_BUILD_8_AUTHORITY_CONVERGENCE.md": ["Release 467 Build 8", "Authority Convergence", BASE_SHA, "development-release.json"],
}
for path, tokens in required_docs.items():
    body = read(path)
    for token in tokens:
        req(token in body, f"{path} missing Build 8 authority token: {token}")

index = read("MARKDOWN_INDEX.md")
req(index.find("current-development-authority.json") < index.find("AI_HANDOFF.md"), "Markdown index must put current authority pointer before AI handoff")
req(index.find("AI_HANDOFF.md") < index.find("development-release.json"), "development-release compatibility evidence must not precede current Release 467 handoff")

preflight = read("docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md")
req("1. Read `current-development-authority.json`" in preflight, "I.T. preflight startup step 1 must read current authority pointer")
req("2. Read `AI_HANDOFF.md`" in preflight, "I.T. preflight startup step 2 must read AI handoff")

if FAIL:
    print("FAIL Release 467 Build 8 authority convergence gate")
    for item in FAIL:
        print(f"- {item}")
    sys.exit(1)

print("PASS Release 467 Build 8 authority convergence gate")
print(f"locked_build8_predecessor_dev_sha={BASE_SHA}")
print(f"locked_build8_predecessor_system_gate={SYSTEM_GATE}")
print(f"locked_build8_predecessor_build7_proof={BUILD7_PROOF}")
print(f"current_pointer_build={pointer_build}")
print("development-release.json=INHERITED_REGRESSION_COMPATIBILITY")
print("external_acceptance=HOLD_EXTERNAL")
print("schema_d1_r2_provider_access_main_production_mutation=NONE")
