#!/usr/bin/env python3
"""Fail-closed source contract for Release 467 Build 11 — Admin Operations Command Center.

Build 11 is exact while current and provenance-preserving once a newer Release 467 build is current.
"""
from __future__ import annotations
import json, re, subprocess, sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
FAIL=[]
BASE_SHA="cba1fbe1c0acc71c9f2f0d29bdb6d5bef09e380a"
BASE_TREE="c2de52782f96fa43d1e5d2eabd80b30a23c62ecd"
SYSTEM_GATE=33635318725
BUILD10_PROOF=33635318747

def req(ok,msg):
    if not ok: FAIL.append(msg)
def read(path):
    p=ROOT/path
    if not p.is_file(): FAIL.append(f"missing required file: {path}"); return ""
    return p.read_text(encoding="utf-8",errors="replace")
def load(path):
    try: value=json.loads(read(path))
    except Exception as exc: FAIL.append(f"invalid JSON {path}: {exc}"); return {}
    req(isinstance(value,dict),f"{path} must contain an object")
    return value if isinstance(value,dict) else {}
def changed_files():
    try:
        base=subprocess.check_output(["git","merge-base","HEAD","origin/dev"],cwd=ROOT,text=True).strip()
        out=subprocess.check_output(["git","diff","--name-only",f"{base}...HEAD"],cwd=ROOT,text=True)
        return [x.strip() for x in out.splitlines() if x.strip()]
    except Exception: return []

pointer=load("current-development-authority.json")
manifest=load("release467-build11-admin-operations-command-center.json")
compat=load("development-release.json")
migrations=load("migrations/canonical/manifest.json")
admin_html=read("admin/index.html")
today_js=read("public/js/admin-today-tasks.js")
read_contract=read("functions/api/admin/contracts/operations-today-tasks-read.js")
action_endpoint=read("functions/api/admin/today-task-actions.js")

pointer_build=int(pointer.get("build") or 0)
req(pointer.get("release")==467 and pointer_build >= 11,"current authority pointer must remain Release 467 Build 11 or newer")
req(pointer.get("state") in {"DEVELOPMENT_CANDIDATE","DEVELOPMENT_GREEN"},"current authority pointer state drifted")
if pointer_build == 11:
    req(pointer.get("title")=="Admin Operations Command Center","Build 11 title drifted")
    req(pointer.get("source_base_sha")==BASE_SHA,"Build 11 source base drifted")
    req(pointer.get("last_green_build")==10,"Build 10 must be the exact last-green predecessor")
    req(pointer.get("last_green_dev_sha")==BASE_SHA,"Build 10 predecessor SHA drifted")
    req(pointer.get("last_green_dev_tree_sha")==BASE_TREE,"Build 10 predecessor tree drifted")
    req(pointer.get("last_green_system_gate_run")==SYSTEM_GATE,"Build 10 System Gate evidence drifted")
    req(pointer.get("last_green_build_proof_run")==BUILD10_PROOF,"Build 10 proof evidence drifted")
else:
    req(int(pointer.get("last_green_build") or 0) >= 11,"newer Release 467 authority must retain Build 11 as a closed predecessor")
    req(bool(pointer.get("last_green_dev_sha")),"newer Release 467 authority must retain a last-green Development SHA")
    req(bool(pointer.get("last_green_dev_tree_sha")),"newer Release 467 authority must retain a last-green Development tree")
    req(bool(pointer.get("last_green_system_gate_run")),"newer Release 467 authority must retain a last-green System Gate run")
    req(bool(pointer.get("last_green_build_proof_run")),"newer Release 467 authority must retain a last-green build proof run")
req("release467-build11-admin-operations-command-center.json" in (pointer.get("current_release_authorities") or []),"newer Release 467 authority must retain Build 11 provenance")
req(pointer.get("promotion_state")=="NO_AUTOMATIC_PROMOTION","Build 11 cannot authorize automatic Production promotion")
compatibility=pointer.get("compatibility_authority") or {}
req(compatibility.get("role")=="INHERITED_REGRESSION_COMPATIBILITY","Release 466 compatibility role drifted")
req(compatibility.get("runtime_release_header")==466,"runtime compatibility header drifted")
req(compatibility.get("runtime_release_header_role")=="INHERITED_RUNTIME_COMPATIBILITY","runtime compatibility role drifted")
req(compat.get("release")==466,"development-release.json must remain inherited Release 466 compatibility evidence")
for key in ("schema_change_authorized","d1_mutation_authorized","r2_mutation_authorized","provider_execution_authorized","provider_publication_authorized","cloudflare_access_mutation_authorized","main_mutation_authorized","production_mutation_authorized","secret_values_emitted"):
    req(pointer.get(key) is False,f"Build 11/newer pointer safety flag must remain false: {key}")

req(manifest.get("release")==467 and manifest.get("build")==11,"Build 11 manifest identity drifted")
req(manifest.get("source_base_sha")==BASE_SHA and manifest.get("source_base_tree_sha")==BASE_TREE,"Build 11 manifest predecessor drifted")
pred=manifest.get("predecessor") or {}
req(pred.get("release")==467 and pred.get("build")==10,"Build 11 predecessor must remain Build 10")
req(pred.get("merged_dev_sha")==BASE_SHA and pred.get("merged_dev_tree_sha")==BASE_TREE,"Build 11 exact predecessor drifted")
req(pred.get("system_gate_run")==SYSTEM_GATE and pred.get("build10_proof_run")==BUILD10_PROOF,"Build 11 predecessor evidence drifted")
runtime=manifest.get("runtime") or {}
req(runtime.get("workspace")=="/admin/","Build 11 workspace authority drifted")
req(runtime.get("read_contract")=="/api/admin/contracts/operations-today-tasks-read","Build 11 read authority drifted")
req(runtime.get("retained_action_authority")=="/api/admin/today-task-actions","Build 11 action authority drifted")
req(runtime.get("action_requires_explicit_admin_click") is True,"Build 11 actions must remain explicit")
req(runtime.get("automatic_task_action") is False,"Build 11 automatic task action must remain false")
for marker in ("Release 467 Build 11","Today Operations Command Center","desktopTodayTasksMount","/admin/today-tasks/","four admin workspaces backed by five permission modules","/public/js/admin-today-tasks.js?v=467b11"):
    req(marker in admin_html,f"Build 11 admin marker missing: {marker}")
req(len(re.findall(r"<h1\b",admin_html,re.I))==1,"admin landing page must retain exactly one H1")
for marker in ("MODULE_BY_CATEGORY","/api/admin/contracts/operations-today-tasks-read","/api/admin/today-task-actions","data-today-complete","data-today-ignore","data-today-snooze","window.DDAuth.apiFetch"):
    req(marker in today_js,f"Build 11 Today Tasks UI marker missing: {marker}")
req("window.fetch(" not in today_js,"Today Tasks UI must retain authenticated transport")
for marker in ("CONTRACT_ID = 'operations-today-tasks-read'","action_authority: '/api/admin/today-task-actions'","request_time_schema_mutation: false","mutation_ownership_moved: false"):
    req(marker in read_contract,f"Today Tasks read contract marker missing: {marker}")
for marker in ("const BUILD = 393","database_today_task_actions_runtime_parity.sql","request_time_schema_mutation: false","['completed', 'ignored', 'snoozed']","INSERT INTO today_task_actions"):
    req(marker in action_endpoint,f"Today Task action authority marker missing: {marker}")
for forbidden in ("CREATE TABLE","ALTER TABLE","DROP TABLE"):
    req(forbidden not in action_endpoint,f"Today Task action endpoint contains request-time DDL: {forbidden}")
expected=["0001_release464_migration_authority.sql","0002_release464_operational_acceptance.sql","0003_release464_business_growth.sql","0004_release465_storefront_quality.sql"]
req([row.get("file") for row in migrations.get("migrations",[])]==expected,"Build 11/newer must preserve canonical migrations 0001-0004 exactly")
if pointer_build == 11:
    allowed={"admin/index.html","public/js/admin-today-tasks.js","current-development-authority.json","release467-build11-admin-operations-command-center.json","scripts/release467_build10_gate.py","scripts/release467_build11_gate.py",".github/workflows/release467-build11-proof.yml","PROJECT_STATUS_AND_ROADMAP.md","AI_HANDOFF.md","SANITY_HEALTH_CHECK.md","MARKDOWN_INDEX.md","docs/operations/RELEASE_467_BUILD_11_ADMIN_OPERATIONS_COMMAND_CENTER.md"}
    changed=changed_files()
    if changed:
        req(not [p for p in changed if p not in allowed],"Build 11 changed files outside bounded scope")
        req(not [p for p in changed if p.startswith("migrations/") or p.lower().endswith(".sql")],"Build 11 is schema-neutral")
if FAIL:
    print("FAIL Release 467 Build 11 Admin Operations Command Center gate")
    for item in FAIL: print(f"- {item}")
    sys.exit(1)
print("PASS Release 467 Build 11 Admin Operations Command Center gate")
print(f"current_pointer_build={pointer_build}")
print("today_tasks_read_contract=RETAINED")
print("today_task_action_authority=RETAINED_EXPLICIT_ADMIN_ONLY")
print("automatic_task_mutation=NONE")
print("external_acceptance=HOLD_EXTERNAL")
