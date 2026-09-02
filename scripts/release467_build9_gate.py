#!/usr/bin/env python3
"""Fail-closed source contract for Release 467 Build 9 — Historical CI Retirement & Gate Fanout Reduction."""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FAIL: list[str] = []
BASE_SHA = "94a891d3cb0608a91550c90fb04acea05cff75b3"
BASE_TREE = "09d9f822c9987d3422921e819c913427af664184"
SYSTEM_GATE = 33631757568
BUILD8_PROOF = 33631758140
HISTORICAL_WORKFLOWS = [f".github/workflows/release466-build{i}-proof.yml" for i in range(1, 7)]
HISTORICAL_GATES = [f"scripts/release466_build{i}_gate.py" for i in range(1, 7)]


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


def trigger_header(body: str) -> str:
    before_permissions = body.split("permissions:", 1)[0]
    return before_permissions


def changed_files() -> list[str]:
    try:
        base = subprocess.check_output(["git", "merge-base", "HEAD", "origin/dev"], cwd=ROOT, text=True).strip()
        output = subprocess.check_output(["git", "diff", "--name-only", f"{base}...HEAD"], cwd=ROOT, text=True)
        return [line.strip() for line in output.splitlines() if line.strip()]
    except Exception:
        return []


pointer = load("current-development-authority.json")
manifest = load("release467-build9-historical-ci-retirement.json")
build8 = load("release467-build8-authority-convergence.json")
compat = load("development-release.json")

req(pointer.get("release") == 467 and pointer.get("build") == 9, "current authority pointer must identify Release 467 Build 9")
req(pointer.get("state") == "DEVELOPMENT_CANDIDATE", "Build 9 source pointer must remain DEVELOPMENT_CANDIDATE before merge")
req(pointer.get("source_base_sha") == BASE_SHA, "Build 9 pointer source base drifted")
req(pointer.get("last_green_build") == 8, "Build 8 must be the last green predecessor")
req(pointer.get("last_green_dev_sha") == BASE_SHA, "last green Build 8 dev SHA drifted")
req(pointer.get("last_green_dev_tree_sha") == BASE_TREE, "last green Build 8 tree drifted")
req(pointer.get("last_green_system_gate_run") == SYSTEM_GATE, "Build 8 System Gate evidence drifted")
req(pointer.get("last_green_build_proof_run") == BUILD8_PROOF, "Build 8 proof evidence drifted")
req(pointer.get("promotion_state") == "NO_AUTOMATIC_PROMOTION", "Build 9 cannot authorize automatic promotion")

for key in (
    "schema_change_authorized", "d1_mutation_authorized", "r2_mutation_authorized",
    "provider_execution_authorized", "provider_publication_authorized",
    "cloudflare_access_mutation_authorized", "main_mutation_authorized",
    "production_mutation_authorized", "secret_values_emitted",
):
    req(pointer.get(key) is False, f"current pointer safety flag must remain false: {key}")

req(manifest.get("release") == 467 and manifest.get("build") == 9, "Build 9 manifest identity drifted")
req(manifest.get("source_base_sha") == BASE_SHA and manifest.get("source_base_tree_sha") == BASE_TREE, "Build 9 exact predecessor drifted")
req(manifest.get("retirement_mode") == "MANUAL_ONLY_PROVENANCE", "Build 9 retirement mode drifted")
req(manifest.get("retired_automatic_workflows") == HISTORICAL_WORKFLOWS, "Build 9 must retire exactly Release 466 Build 1-6 auto workflows")
req(manifest.get("historical_proof_scripts_retained") is True, "historical proof scripts must remain retained")
req(manifest.get("historical_git_history_retained") is True, "historical git history must remain retained")
req(manifest.get("historical_actions_history_retained") is True, "historical Actions history must remain retained")
req(manifest.get("external_acceptance_state") == "HOLD_EXTERNAL", "Build 9 cannot infer external acceptance")
for key in (
    "schema_change_authorized", "request_time_schema_mutation", "d1_mutation_authorized",
    "r2_mutation_authorized", "provider_execution_authorized", "provider_publication_authorized",
    "cloudflare_access_policy_mutation_authorized", "main_mutation_authorized",
    "production_mutation_authorized", "secret_values_emitted",
):
    req(manifest.get(key) is False, f"Build 9 manifest safety flag must remain false: {key}")

pred = manifest.get("predecessor") or {}
req(pred.get("release") == 467 and pred.get("build") == 8, "Build 9 predecessor must be Release 467 Build 8")
req(pred.get("merged_dev_sha") == BASE_SHA, "Build 9 predecessor SHA drifted")
req(pred.get("system_gate_run") == SYSTEM_GATE, "Build 9 predecessor System Gate drifted")
req(pred.get("build8_proof_run") == BUILD8_PROOF, "Build 9 predecessor proof drifted")

req(build8.get("release") == 467 and build8.get("build") == 8, "Build 8 authority must remain present")
req(build8.get("external_acceptance_state") == "HOLD_EXTERNAL", "Build 8 external HOLD must remain")
req(compat.get("release") == 466, "development-release.json must remain compatibility evidence")
req((pointer.get("compatibility_authority") or {}).get("role") == "INHERITED_REGRESSION_COMPATIBILITY", "compatibility authority role drifted")

for workflow in HISTORICAL_WORKFLOWS:
    body = read(workflow)
    header = trigger_header(body)
    req("workflow_dispatch:" in header, f"{workflow} must remain manually dispatchable")
    req("pull_request:" not in header, f"{workflow} must not auto-run on pull requests")
    req("push:" not in header, f"{workflow} must not auto-run on pushes")
    req("branches: [dev]" not in header, f"{workflow} retained a dev auto-run branch trigger")

for gate in HISTORICAL_GATES:
    req((ROOT / gate).is_file(), f"historical proof source must remain available: {gate}")

build8_gate = read("scripts/release467_build8_gate.py")
req("pointer_build >= 8" in build8_gate, "Build 8 gate must be forward-compatible with newer Release 467 pointers")
req("current_pointer_build" in build8_gate, "Build 8 gate forward-compatibility evidence missing")

build6_gate = read("scripts/release467_build6_gate.py")
req("current authority must remain Release 467" in build6_gate, "Build 6 gate must use semantic current Release 467 handoff authority")
req("INHERITED_REGRESSION_COMPATIBILITY" in build6_gate, "Build 6 gate must permit Release 466 wording only as explicit compatibility evidence")

migration_manifest = load("migrations/canonical/manifest.json")
expected = [
    "0001_release464_migration_authority.sql",
    "0002_release464_operational_acceptance.sql",
    "0003_release464_business_growth.sql",
    "0004_release465_storefront_quality.sql",
]
req([row.get("file") for row in migration_manifest.get("migrations", [])] == expected, "Build 9 must preserve canonical migrations 0001-0004 exactly")
req(not list((ROOT / "migrations/canonical").glob("*467*build9*")), "Build 9 is schema-neutral but a Build 9 migration exists")

allowed = set(HISTORICAL_WORKFLOWS + [
    "current-development-authority.json",
    "release467-build9-historical-ci-retirement.json",
    "scripts/release467_build6_gate.py",
    "scripts/release467_build8_gate.py",
    "scripts/release467_build9_gate.py",
    ".github/workflows/release467-build9-proof.yml",
    "AI_HANDOFF.md",
    "PROJECT_STATUS_AND_ROADMAP.md",
    "SANITY_HEALTH_CHECK.md",
    "MARKDOWN_INDEX.md",
    "docs/operations/RELEASE_467_BUILD_9_HISTORICAL_CI_RETIREMENT.md",
])
changed = changed_files()
if changed:
    unexpected = [path for path in changed if path not in allowed]
    req(not unexpected, f"Build 9 changed files outside bounded CI/authority scope: {unexpected}")
    migration_changes = [path for path in changed if path.startswith("migrations/") or path.lower().endswith(".sql")]
    req(not migration_changes, f"Build 9 is schema-neutral but migration/SQL files changed: {migration_changes}")

if FAIL:
    print("FAIL Release 467 Build 9 historical CI retirement gate")
    for item in FAIL:
        print(f"- {item}")
    sys.exit(1)

print("PASS Release 467 Build 9 historical CI retirement gate")
print("release466_build1_6_workflows=MANUAL_ONLY_PROVENANCE")
print("historical_proof_scripts=RETAINED")
print("canonical_current_system_gate=RETAINED")
print(f"predecessor_dev_sha={BASE_SHA}")
print(f"predecessor_system_gate={SYSTEM_GATE}")
print(f"predecessor_build8_proof={BUILD8_PROOF}")
print("external_acceptance=HOLD_EXTERNAL")
print("schema_d1_r2_provider_access_main_production_mutation=NONE")
