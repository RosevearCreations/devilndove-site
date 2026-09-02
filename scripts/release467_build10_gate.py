#!/usr/bin/env python3
"""Fail-closed source contract for Release 467 Build 10 — I.T. Control Tower Consolidation and Self-Diagnostics."""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FAIL: list[str] = []
BASE_SHA = "d8a9ffba03f980b9632643d91d9aa69b25bd94fd"
BASE_TREE = "949f2523d31e0f47ed1e19ff7655de2762fbc1df"
SYSTEM_GATE = 33633043297
BUILD9_PROOF = 33633043229


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


def changed_files() -> list[str]:
    try:
        base = subprocess.check_output(["git", "merge-base", "HEAD", "origin/dev"], cwd=ROOT, text=True).strip()
        output = subprocess.check_output(["git", "diff", "--name-only", f"{base}...HEAD"], cwd=ROOT, text=True)
        return [line.strip() for line in output.splitlines() if line.strip()]
    except Exception:
        return []


pointer = load("current-development-authority.json")
manifest = load("release467-build10-it-control-tower-consolidation.json")
compat = load("development-release.json")
migrations = load("migrations/canonical/manifest.json")
endpoint = read("functions/api/admin/it-operations-control-tower.js")
ui = read("public/js/admin-it-control-tower.js")
html = read("admin/it/index.html")
build1_gate = read("scripts/release467_build1_gate.py")
build9_gate = read("scripts/release467_build9_gate.py")

req(pointer.get("release") == 467 and pointer.get("build") == 10, "current authority pointer must identify Release 467 Build 10")
req(pointer.get("title") == "I.T. Control Tower Consolidation and Self-Diagnostics", "Build 10 title drifted")
req(pointer.get("state") == "DEVELOPMENT_CANDIDATE", "Build 10 pointer must remain DEVELOPMENT_CANDIDATE before merge")
req(pointer.get("source_base_sha") == BASE_SHA, "Build 10 source base drifted")
req(pointer.get("last_green_build") == 9, "Build 9 must be the exact last-green predecessor")
req(pointer.get("last_green_dev_sha") == BASE_SHA, "Build 9 predecessor SHA drifted")
req(pointer.get("last_green_dev_tree_sha") == BASE_TREE, "Build 9 predecessor tree drifted")
req(pointer.get("last_green_system_gate_run") == SYSTEM_GATE, "Build 9 System Gate evidence drifted")
req(pointer.get("last_green_build_proof_run") == BUILD9_PROOF, "Build 9 proof evidence drifted")
req(pointer.get("promotion_state") == "NO_AUTOMATIC_PROMOTION", "Build 10 cannot authorize automatic Production promotion")
req("release467-build10-it-control-tower-consolidation.json" in (pointer.get("current_release_authorities") or []), "Build 10 authority must be first-class current authority")

compatibility = pointer.get("compatibility_authority") or {}
req(compatibility.get("role") == "INHERITED_REGRESSION_COMPATIBILITY", "Release 466 regression compatibility role drifted")
req(compatibility.get("runtime_release_header") == 466, "runtime compatibility header must remain explicitly classified")
req(compatibility.get("runtime_release_header_role") == "INHERITED_RUNTIME_COMPATIBILITY", "runtime compatibility role drifted")
req(compat.get("release") == 466, "development-release.json must remain inherited Release 466 compatibility evidence")

for key in (
    "schema_change_authorized", "d1_mutation_authorized", "r2_mutation_authorized",
    "provider_execution_authorized", "provider_publication_authorized",
    "cloudflare_access_mutation_authorized", "main_mutation_authorized",
    "production_mutation_authorized", "secret_values_emitted",
):
    req(pointer.get(key) is False, f"Build 10 pointer safety flag must remain false: {key}")

req(manifest.get("release") == 467 and manifest.get("build") == 10, "Build 10 manifest identity drifted")
req(manifest.get("source_base_sha") == BASE_SHA and manifest.get("source_base_tree_sha") == BASE_TREE, "Build 10 manifest predecessor drifted")
pred = manifest.get("predecessor") or {}
req(pred.get("release") == 467 and pred.get("build") == 9, "Build 10 predecessor must be Release 467 Build 9")
req(pred.get("merged_dev_sha") == BASE_SHA and pred.get("merged_dev_tree_sha") == BASE_TREE, "Build 10 exact Build 9 predecessor drifted")
req(pred.get("system_gate_run") == SYSTEM_GATE and pred.get("build9_proof_run") == BUILD9_PROOF, "Build 10 predecessor run evidence drifted")
req((manifest.get("runtime") or {}).get("endpoint") == "/api/admin/it-operations-control-tower", "Build 10 endpoint authority drifted")
req((manifest.get("runtime") or {}).get("read_only") is True, "Build 10 runtime must remain read-only")
req((manifest.get("runtime") or {}).get("automatic_repair") is False, "Build 10 must not automatically repair findings")
req(manifest.get("external_acceptance_state") == "HOLD_EXTERNAL", "Build 10 cannot infer external acceptance")

for key in (
    "schema_change_authorized", "request_time_schema_mutation", "d1_mutation_authorized",
    "r2_mutation_authorized", "provider_execution_authorized", "provider_publication_authorized",
    "cloudflare_access_policy_mutation_authorized", "main_mutation_authorized",
    "production_mutation_authorized", "secret_values_emitted",
):
    req(manifest.get(key) is False, f"Build 10 manifest safety flag must remain false: {key}")

required_endpoint = [
    "getReadinessControlTower",
    "const BUILD = 10",
    "recoveryQueue(subsystems",
    "external_policy: EXTERNAL_POLICY",
    "recovery_queue: queue",
    "next_action: queue[0] || null",
    "compatibility_runtime_release_header: 466",
    "root_admin_full_manage",
    "canonical_migrations",
    "foreign_key_violations",
    "secret_values_emitted: false",
    "provider_execution: false",
    "main_mutation: false",
    "production_mutation: false",
]
for marker in required_endpoint:
    req(marker in endpoint, f"Build 10 endpoint marker missing: {marker}")
for marker in ("method: 'POST'", 'method: "POST"', "method: 'PUT'", "method: 'PATCH'", "method: 'DELETE'", "wrangler", "d1 execute", "stripe.refunds", "paypal.com"):
    req(marker not in endpoint, f"Build 10 endpoint contains forbidden execution marker: {marker}")

required_ui = [
    "/api/admin/it-operations-control-tower",
    "Release ${esc(current.release || data.release)} • Build ${esc(current.build || data.build)}",
    "I.T. Operations Control Tower",
    "Prioritized recovery queue",
    "External acceptance policy",
    "Runtime deployed SHA",
    "Root admin",
    "Migrations / proofs",
    "runtime compatibility",
    "The Control Tower never performs these repairs automatically",
]
for marker in required_ui:
    req(marker in ui, f"Build 10 UI marker missing: {marker}")
req("Release 467 Build 10" in html, "I.T. workspace must name Release 467 Build 10")
req("consolidates current release/deployment authority" in html, "I.T. workspace Build 10 purpose missing")
req("/public/js/admin-it-control-tower.js?v=467" in html, "I.T. control tower script mount drifted")

req("direct_ui or wrapped_ui" in build1_gate, "Build 1 gate must allow the newer wrapper while retaining its original readiness engine")
req("getReadinessControlTower" in build1_gate, "Build 1 gate wrapper proof marker missing")
req("pointer_build >= 9" in build9_gate, "Build 9 gate must be forward-compatible with Build 10")
req("if pointer_build == 9" in build9_gate, "Build 9 exact changed-file scope must be limited to Build 9 itself")
req("newer Release 467 authority must retain Build 9 provenance" in build9_gate, "Build 9 provenance retention check missing")

expected_migrations = [
    "0001_release464_migration_authority.sql",
    "0002_release464_operational_acceptance.sql",
    "0003_release464_business_growth.sql",
    "0004_release465_storefront_quality.sql",
]
req([row.get("file") for row in migrations.get("migrations", [])] == expected_migrations, "Build 10 must preserve canonical migrations 0001-0004 exactly")
req(not list((ROOT / "migrations/canonical").glob("*467*build10*")), "Build 10 is schema-neutral but a Build 10 migration exists")

allowed = {
    "current-development-authority.json",
    "release467-build10-it-control-tower-consolidation.json",
    "scripts/release467_build1_gate.py",
    "scripts/release467_build9_gate.py",
    "scripts/release467_build10_gate.py",
    ".github/workflows/release467-build10-proof.yml",
    "functions/api/admin/it-operations-control-tower.js",
    "public/js/admin-it-control-tower.js",
    "admin/it/index.html",
    "AI_HANDOFF.md",
    "PROJECT_STATUS_AND_ROADMAP.md",
    "SANITY_HEALTH_CHECK.md",
    "MARKDOWN_INDEX.md",
    "docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md",
    "docs/operations/RELEASE_467_BUILD_10_IT_CONTROL_TOWER.md",
}
changed = changed_files()
if changed:
    unexpected = [path for path in changed if path not in allowed]
    req(not unexpected, f"Build 10 changed files outside bounded I.T./authority scope: {unexpected}")
    migration_changes = [path for path in changed if path.startswith("migrations/") or path.lower().endswith(".sql")]
    req(not migration_changes, f"Build 10 is schema-neutral but migration/SQL files changed: {migration_changes}")

if FAIL:
    print("FAIL Release 467 Build 10 I.T. control tower gate")
    for item in FAIL:
        print(f"- {item}")
    sys.exit(1)

print("PASS Release 467 Build 10 I.T. control tower gate")
print(f"predecessor_dev_sha={BASE_SHA}")
print(f"predecessor_system_gate={SYSTEM_GATE}")
print(f"predecessor_build9_proof={BUILD9_PROOF}")
print("control_tower=CONSOLIDATED_READ_ONLY")
print("build1_readiness_engine=RETAINED_THROUGH_WRAPPER_OR_DIRECT_UI")
print("recovery_queue=PRIORITIZED_NO_AUTOMATIC_REPAIR")
print("external_acceptance=HOLD_EXTERNAL")
print("schema_d1_r2_provider_access_main_production_mutation=NONE")
