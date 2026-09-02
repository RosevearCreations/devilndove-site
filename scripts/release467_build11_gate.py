#!/usr/bin/env python3
"""Fail-closed source contract for Release 467 Build 11 — Admin Operations Command Center."""
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FAIL: list[str] = []
BASE_SHA = "cba1fbe1c0acc71c9f2f0d29bdb6d5bef09e380a"
BASE_TREE = "c2de52782f96fa43d1e5d2eabd80b30a23c62ecd"
SYSTEM_GATE = 33635318725
BUILD10_PROOF = 33635318747


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
manifest = load("release467-build11-admin-operations-command-center.json")
build10 = load("release467-build10-it-control-tower-consolidation.json")
compat = load("development-release.json")
migrations = load("migrations/canonical/manifest.json")
admin_html = read("admin/index.html")
today_js = read("public/js/admin-today-tasks.js")
read_contract = read("functions/api/admin/contracts/operations-today-tasks-read.js")
action_endpoint = read("functions/api/admin/today-task-actions.js")
build10_gate = read("scripts/release467_build10_gate.py")
roadmap = read("PROJECT_STATUS_AND_ROADMAP.md")
handoff = read("AI_HANDOFF.md")
sanity = read("SANITY_HEALTH_CHECK.md")
index = read("MARKDOWN_INDEX.md")
ops_doc = read("docs/operations/RELEASE_467_BUILD_11_ADMIN_OPERATIONS_COMMAND_CENTER.md")

req(pointer.get("release") == 467 and pointer.get("build") == 11, "current authority pointer must identify Release 467 Build 11")
req(pointer.get("title") == "Admin Operations Command Center", "Build 11 title drifted")
req(pointer.get("state") == "DEVELOPMENT_CANDIDATE", "Build 11 pointer must remain DEVELOPMENT_CANDIDATE before merge")
req(pointer.get("source_base_sha") == BASE_SHA, "Build 11 source base drifted")
req(pointer.get("last_green_build") == 10, "Build 10 must be the exact last-green predecessor")
req(pointer.get("last_green_dev_sha") == BASE_SHA, "Build 10 predecessor SHA drifted")
req(pointer.get("last_green_dev_tree_sha") == BASE_TREE, "Build 10 predecessor tree drifted")
req(pointer.get("last_green_system_gate_run") == SYSTEM_GATE, "Build 10 System Gate evidence drifted")
req(pointer.get("last_green_build_proof_run") == BUILD10_PROOF, "Build 10 proof evidence drifted")
req(pointer.get("promotion_state") == "NO_AUTOMATIC_PROMOTION", "Build 11 cannot authorize automatic Production promotion")
req((pointer.get("current_release_authorities") or [None])[0] == "release467-build11-admin-operations-command-center.json", "Build 11 must be first current authority")
req("release467-build10-it-control-tower-consolidation.json" in (pointer.get("current_release_authorities") or []), "Build 10 provenance must remain retained")

compatibility = pointer.get("compatibility_authority") or {}
req(compatibility.get("role") == "INHERITED_REGRESSION_COMPATIBILITY", "Release 466 regression compatibility role drifted")
req(compatibility.get("runtime_release_header") == 466, "runtime compatibility header drifted")
req(compatibility.get("runtime_release_header_role") == "INHERITED_RUNTIME_COMPATIBILITY", "runtime compatibility role drifted")
req(compat.get("release") == 466, "development-release.json must remain inherited Release 466 compatibility evidence")

for key in (
    "schema_change_authorized", "d1_mutation_authorized", "r2_mutation_authorized",
    "provider_execution_authorized", "provider_publication_authorized",
    "cloudflare_access_mutation_authorized", "main_mutation_authorized",
    "production_mutation_authorized", "secret_values_emitted",
):
    req(pointer.get(key) is False, f"Build 11 pointer safety flag must remain false: {key}")

req(manifest.get("release") == 467 and manifest.get("build") == 11, "Build 11 manifest identity drifted")
req(manifest.get("source_base_sha") == BASE_SHA and manifest.get("source_base_tree_sha") == BASE_TREE, "Build 11 manifest predecessor drifted")
pred = manifest.get("predecessor") or {}
req(pred.get("release") == 467 and pred.get("build") == 10, "Build 11 predecessor must be Release 467 Build 10")
req(pred.get("merged_dev_sha") == BASE_SHA and pred.get("merged_dev_tree_sha") == BASE_TREE, "Build 11 exact Build 10 predecessor drifted")
req(pred.get("system_gate_run") == SYSTEM_GATE and pred.get("build10_proof_run") == BUILD10_PROOF, "Build 11 predecessor run evidence drifted")
runtime = manifest.get("runtime") or {}
req(runtime.get("workspace") == "/admin/", "Build 11 workspace authority drifted")
req(runtime.get("read_contract") == "/api/admin/contracts/operations-today-tasks-read", "Build 11 read contract drifted")
req(runtime.get("retained_action_authority") == "/api/admin/today-task-actions", "Build 11 action authority drifted")
req(runtime.get("action_requires_explicit_admin_click") is True, "Today Task action must require explicit administrator action")
req(runtime.get("automatic_task_action") is False, "Build 11 must not perform automatic Today Task actions")
req(runtime.get("new_mutation_authority") is False, "Build 11 must not introduce new mutation authority")
retained = manifest.get("retained_action_authority") or {}
req(retained.get("changed_by_build11") is False, "Build 11 must not change retained task mutation ownership")
req(retained.get("allowed_actions") == ["completed", "ignored", "snoozed"], "retained Today Task actions drifted")
req(manifest.get("external_acceptance_state") == "HOLD_EXTERNAL", "Build 11 cannot infer external acceptance")
for key in (
    "schema_change_authorized", "request_time_schema_mutation", "new_d1_mutation_authorized",
    "d1_mutation_authorized", "r2_mutation_authorized", "provider_execution_authorized",
    "provider_publication_authorized", "cloudflare_access_policy_mutation_authorized",
    "main_mutation_authorized", "production_mutation_authorized", "secret_values_emitted",
):
    req(manifest.get(key) is False, f"Build 11 manifest safety flag must remain false: {key}")

req(build10.get("release") == 467 and build10.get("build") == 10, "Build 10 manifest must remain present")
req(build10.get("external_acceptance_state") == "HOLD_EXTERNAL", "Build 10 external HOLD provenance drifted")

for marker in (
    "Release 467 Build 11",
    "Today Operations Command Center",
    "desktopTodayTasksMount",
    "/admin/today-tasks/",
    "four admin workspaces backed by five permission modules",
    "/public/js/admin-today-tasks.js?v=467b11",
    "Four workspaces, five permission modules",
):
    req(marker in admin_html, f"Admin Command Center marker missing: {marker}")
req(len(re.findall(r"<h1\b", admin_html, re.I)) == 1, "admin landing page must retain exactly one H1")

for marker in (
    "MODULE_BY_CATEGORY",
    "catalog: Object.freeze({ key: 'creators'",
    "customers: Object.freeze({ key: 'storefront'",
    "orders: Object.freeze({ key: 'financials'",
    "health: Object.freeze({ key: 'it-platform'",
    "/api/admin/contracts/operations-today-tasks-read",
    "/api/admin/today-task-actions",
    "data-today-complete",
    "data-today-ignore",
    "data-today-snooze",
    "task_label",
    "action_status: status",
    "snooze_hours: hours",
    "Admin Operations Command Center",
    "window.DDAuth.apiFetch",
):
    req(marker in today_js, f"Build 11 Today Tasks UI marker missing: {marker}")
req("window.fetch(" not in today_js, "Build 11 Today Tasks UI must keep authenticated DDAuth transport")
req("localStorage" not in today_js, "Build 11 Today Tasks UI must not persist task data in localStorage")

for marker in (
    "CONTRACT_ID = 'operations-today-tasks-read'",
    "action_authority: '/api/admin/today-task-actions'",
    "request_time_schema_mutation: false",
    "mutation_ownership_moved: false",
):
    req(marker in read_contract, f"retained Today Tasks read contract marker missing: {marker}")
for marker in (
    "const BUILD = 393",
    "database_today_task_actions_runtime_parity.sql",
    "request_time_schema_mutation: false",
    "['completed', 'ignored', 'snoozed']",
    "INSERT INTO today_task_actions",
):
    req(marker in action_endpoint, f"retained Today Task action authority marker missing: {marker}")
for forbidden in ("CREATE TABLE", "ALTER TABLE", "DROP TABLE"):
    req(forbidden not in action_endpoint, f"retained Today Task action endpoint contains request-time DDL marker: {forbidden}")

req("pointer_build >= 10" in build10_gate, "Build 10 gate must be forward-compatible with Build 11")
req("if pointer_build == 10" in build10_gate, "Build 10 exact scope must remain limited to Build 10 itself")
req("newer Release 467 authority must retain Build 10 as a closed predecessor" in build10_gate, "Build 10 provenance check missing")

expected_migrations = [
    "0001_release464_migration_authority.sql",
    "0002_release464_operational_acceptance.sql",
    "0003_release464_business_growth.sql",
    "0004_release465_storefront_quality.sql",
]
req([row.get("file") for row in migrations.get("migrations", [])] == expected_migrations, "Build 11 must preserve canonical migrations 0001-0004 exactly")
req(not list((ROOT / "migrations/canonical").glob("*467*build11*")), "Build 11 is schema-neutral but a Build 11 migration exists")

required_docs = {
    "PROJECT_STATUS_AND_ROADMAP.md": ["Release 467 Build 11", BASE_SHA, str(SYSTEM_GATE), str(BUILD10_PROOF), "HOLD_EXTERNAL"],
    "AI_HANDOFF.md": ["Release 467 Build 11", "Admin Operations Command Center", "Release 467 Build 10", "HOLD_EXTERNAL"],
    "SANITY_HEALTH_CHECK.md": ["Release 467 Build 11", BASE_SHA, str(SYSTEM_GATE), str(BUILD10_PROOF), "HOLD_EXTERNAL"],
    "MARKDOWN_INDEX.md": ["Release 467 Build 11", "release467-build11-admin-operations-command-center.json", "development-release.json"],
    "docs/operations/RELEASE_467_BUILD_11_ADMIN_OPERATIONS_COMMAND_CENTER.md": ["Release 467 Build 11", "Admin Operations Command Center", BASE_SHA, "/api/admin/today-task-actions"],
}
for path, tokens in required_docs.items():
    body = {"PROJECT_STATUS_AND_ROADMAP.md": roadmap, "AI_HANDOFF.md": handoff, "SANITY_HEALTH_CHECK.md": sanity, "MARKDOWN_INDEX.md": index, "docs/operations/RELEASE_467_BUILD_11_ADMIN_OPERATIONS_COMMAND_CENTER.md": ops_doc}[path]
    for token in tokens:
        req(token in body, f"{path} missing Build 11 authority token: {token}")
req(index.find("current-development-authority.json") < index.find("AI_HANDOFF.md"), "Markdown index must put current authority pointer before AI handoff")
req(index.find("AI_HANDOFF.md") < index.find("development-release.json"), "compatibility evidence must not precede current handoff")

allowed = {
    "admin/index.html",
    "public/js/admin-today-tasks.js",
    "current-development-authority.json",
    "release467-build11-admin-operations-command-center.json",
    "scripts/release467_build10_gate.py",
    "scripts/release467_build11_gate.py",
    ".github/workflows/release467-build11-proof.yml",
    "PROJECT_STATUS_AND_ROADMAP.md",
    "AI_HANDOFF.md",
    "SANITY_HEALTH_CHECK.md",
    "MARKDOWN_INDEX.md",
    "docs/operations/RELEASE_467_BUILD_11_ADMIN_OPERATIONS_COMMAND_CENTER.md",
}
changed = changed_files()
if changed:
    unexpected = [path for path in changed if path not in allowed]
    req(not unexpected, f"Build 11 changed files outside bounded Admin Operations scope: {unexpected}")
    migration_changes = [path for path in changed if path.startswith("migrations/") or path.lower().endswith(".sql")]
    req(not migration_changes, f"Build 11 is schema-neutral but migration/SQL files changed: {migration_changes}")
    req("functions/api/admin/today-task-actions.js" not in changed, "Build 11 must not move or rewrite retained Today Task mutation authority")
    req("functions/api/admin/contracts/operations-today-tasks-read.js" not in changed, "Build 11 must not rewrite the owned Today Tasks read contract")

if FAIL:
    print("FAIL Release 467 Build 11 Admin Operations Command Center gate")
    for item in FAIL:
        print(f"- {item}")
    sys.exit(1)

print("PASS Release 467 Build 11 Admin Operations Command Center gate")
print(f"predecessor_dev_sha={BASE_SHA}")
print(f"predecessor_system_gate={SYSTEM_GATE}")
print(f"predecessor_build10_proof={BUILD10_PROOF}")
print("desktop_admin_today_tasks=MOUNTED")
print("today_tasks_read_contract=RETAINED")
print("today_task_action_authority=RETAINED_EXPLICIT_ADMIN_ONLY")
print("automatic_task_mutation=NONE")
print("external_acceptance=HOLD_EXTERNAL")
print("schema_new_d1_r2_provider_access_main_production_mutation=NONE")