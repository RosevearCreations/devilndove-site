#!/usr/bin/env python3
"""Fail-closed source contract for Release 467 Build 12 — Finance Operations Command Center."""
from __future__ import annotations
import json, re, subprocess, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
FAIL=[]
BASE_SHA="ce42f3b2ea553b69085705f500a9e2bd2f689818"
BASE_TREE="191e4a92ebcbc94b29cfbf6a83259acd4981d302"
SYSTEM_GATE=33637049566
BUILD11_PROOF=33637049079

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
manifest=load("release467-build12-finance-operations-command-center.json")
build11=load("release467-build11-admin-operations-command-center.json")
compat=load("development-release.json")
migrations=load("migrations/canonical/manifest.json")
finance_html=read("admin/finance/index.html")
ops_js=read("public/js/admin-accounting-operations.js")
build11_gate=read("scripts/release467_build11_gate.py")
handoff=read("AI_HANDOFF.md")
roadmap=read("PROJECT_STATUS_AND_ROADMAP.md")
sanity=read("SANITY_HEALTH_CHECK.md")
index=read("MARKDOWN_INDEX.md")
ops_doc=read("docs/operations/RELEASE_467_BUILD_12_FINANCE_OPERATIONS_COMMAND_CENTER.md")

req(pointer.get("release")==467 and pointer.get("build")==12,"current authority must identify Release 467 Build 12")
req(pointer.get("title")=="Finance Operations Command Center","Build 12 title drifted")
req(pointer.get("state")=="DEVELOPMENT_CANDIDATE","Build 12 pointer must remain DEVELOPMENT_CANDIDATE before merge")
req(pointer.get("source_base_sha")==BASE_SHA,"Build 12 source base drifted")
req(pointer.get("last_green_build")==11,"Build 11 must be exact last-green predecessor")
req(pointer.get("last_green_dev_sha")==BASE_SHA,"Build 11 predecessor SHA drifted")
req(pointer.get("last_green_dev_tree_sha")==BASE_TREE,"Build 11 predecessor tree drifted")
req(pointer.get("last_green_system_gate_run")==SYSTEM_GATE,"Build 11 System Gate evidence drifted")
req(pointer.get("last_green_build_proof_run")==BUILD11_PROOF,"Build 11 proof evidence drifted")
req(pointer.get("promotion_state")=="NO_AUTOMATIC_PROMOTION","Build 12 cannot authorize Production promotion")
req((pointer.get("current_release_authorities") or [None])[0]=="release467-build12-finance-operations-command-center.json","Build 12 must be first current authority")
req("release467-build11-admin-operations-command-center.json" in (pointer.get("current_release_authorities") or []),"Build 11 provenance must remain retained")
compatibility=pointer.get("compatibility_authority") or {}
req(compatibility.get("role")=="INHERITED_REGRESSION_COMPATIBILITY","Release 466 compatibility role drifted")
req(compatibility.get("runtime_release_header")==466 and compatibility.get("runtime_release_header_role")=="INHERITED_RUNTIME_COMPATIBILITY","runtime compatibility classification drifted")
req(compat.get("release")==466,"development-release.json must remain inherited Release 466 evidence")
for key in ("schema_change_authorized","d1_mutation_authorized","r2_mutation_authorized","provider_execution_authorized","provider_publication_authorized","cloudflare_access_mutation_authorized","main_mutation_authorized","production_mutation_authorized","secret_values_emitted"):
    req(pointer.get(key) is False,f"Build 12 pointer safety flag must remain false: {key}")

req(manifest.get("release")==467 and manifest.get("build")==12,"Build 12 manifest identity drifted")
req(manifest.get("source_base_sha")==BASE_SHA and manifest.get("source_base_tree_sha")==BASE_TREE,"Build 12 manifest predecessor drifted")
pred=manifest.get("predecessor") or {}
req(pred.get("release")==467 and pred.get("build")==11,"Build 12 predecessor must be Build 11")
req(pred.get("merged_dev_sha")==BASE_SHA and pred.get("merged_dev_tree_sha")==BASE_TREE,"Build 12 exact predecessor drifted")
req(pred.get("system_gate_run")==SYSTEM_GATE and pred.get("build11_proof_run")==BUILD11_PROOF,"Build 12 predecessor evidence drifted")
runtime=manifest.get("runtime") or {}
req(runtime.get("workspace")=="/admin/finance/","Finance workspace authority drifted")
req(runtime.get("shared_engine")=="public/js/admin-accounting-operations.js","shared finance intelligence engine drifted")
req(runtime.get("finance_mount")=="financeOperationsMount","Finance mount drifted")
req(runtime.get("accounting_owner_workspace")=="/admin/accounting/","Accounting owner workspace drifted")
req(runtime.get("write_authority_duplicated") is False,"Build 12 must not duplicate finance write authority")
req(runtime.get("automatic_finance_mutation") is False,"Build 12 must remain read-only")
req(manifest.get("external_acceptance_state")=="HOLD_EXTERNAL","Build 12 cannot infer external acceptance")
for key in ("schema_change_authorized","request_time_schema_mutation","new_d1_mutation_authorized","d1_mutation_authorized","r2_mutation_authorized","provider_execution_authorized","provider_publication_authorized","cloudflare_access_policy_mutation_authorized","main_mutation_authorized","production_mutation_authorized","secret_values_emitted"):
    req(manifest.get(key) is False,f"Build 12 manifest safety flag must remain false: {key}")
req(build11.get("release")==467 and build11.get("build")==11,"Build 11 manifest must remain retained")

for marker in ("Release 467 Build 12","Finance Operations Command Center","financeOperationsMount","admin-accounting-operations.css?v=467b12","admin-accounting-operations.js?v=467b12","read-only intelligence","/admin/accounting/"):
    req(marker in finance_html,f"Finance Command Center marker missing: {marker}")
req(len(re.findall(r"<h1\b",finance_html,re.I))==1,"Finance landing page must retain exactly one H1")
for marker in ("financeOperationsMount","accountingOperationsMount","financeCommandCenter","resolveHref","/admin/accounting/${href}","window.DDAuth.apiFetch","Write authority duplicated: <strong>no</strong>","Release 467 Build 12"):
    req(marker in ops_js,f"shared Financial Operations marker missing: {marker}")
for endpoint in ("/api/admin/accounting-reconciliation","/api/admin/accounting-reconciliation-exceptions","/api/admin/accounting-statement-imports","/api/admin/accounting-profit-loss","/api/admin/accounting-item-costing","/api/admin/accounting-period-locks","/api/admin/accounting-gifi-summary"):
    req(endpoint in ops_js,f"existing Accounting read source missing from shared engine: {endpoint}")
for forbidden in ("fetch('/api/admin","method:'POST'","method: 'POST'","method:'PUT'","method: 'PUT'","method:'DELETE'","method: 'DELETE'","CREATE TABLE","ALTER TABLE","DROP TABLE"):
    req(forbidden not in ops_js,f"Build 12 shared Finance intelligence contains forbidden mutation marker: {forbidden}")
req("pointer_build >= 11" in build11_gate,"Build 11 gate must be forward-compatible with Build 12")
req("if pointer_build == 11" in build11_gate,"Build 11 exact scope must remain limited to Build 11 itself")
req("newer Release 467 authority must retain Build 11 as a closed predecessor" in build11_gate,"Build 11 closed-predecessor proof missing")
expected=["0001_release464_migration_authority.sql","0002_release464_operational_acceptance.sql","0003_release464_business_growth.sql","0004_release465_storefront_quality.sql"]
req([row.get("file") for row in migrations.get("migrations",[])]==expected,"Build 12 must preserve canonical migrations 0001-0004 exactly")
req(not list((ROOT/"migrations/canonical").glob("*467*build12*")),"Build 12 is schema-neutral but a Build 12 migration exists")
for body,name in ((handoff,"AI_HANDOFF.md"),(roadmap,"PROJECT_STATUS_AND_ROADMAP.md"),(sanity,"SANITY_HEALTH_CHECK.md"),(index,"MARKDOWN_INDEX.md"),(ops_doc,"Build 12 operations doc")):
    for token in ("Release 467 Build 12","Finance Operations Command Center",BASE_SHA,"HOLD_EXTERNAL"):
        req(token in body,f"{name} missing Build 12 authority token: {token}")
allowed={"admin/finance/index.html","public/js/admin-accounting-operations.js","current-development-authority.json","release467-build12-finance-operations-command-center.json","scripts/release467_build11_gate.py","scripts/release467_build12_gate.py",".github/workflows/release467-build12-proof.yml","PROJECT_STATUS_AND_ROADMAP.md","AI_HANDOFF.md","SANITY_HEALTH_CHECK.md","MARKDOWN_INDEX.md","docs/operations/RELEASE_467_BUILD_12_FINANCE_OPERATIONS_COMMAND_CENTER.md"}
changed=changed_files()
if changed:
    unexpected=[p for p in changed if p not in allowed]; req(not unexpected,f"Build 12 changed files outside bounded Finance scope: {unexpected}")
    migration_changes=[p for p in changed if p.startswith("migrations/") or p.lower().endswith(".sql")]; req(not migration_changes,f"Build 12 is schema-neutral but migration/SQL files changed: {migration_changes}")
if FAIL:
    print("FAIL Release 467 Build 12 Finance Operations Command Center gate")
    for item in FAIL: print(f"- {item}")
    sys.exit(1)
print("PASS Release 467 Build 12 Finance Operations Command Center gate")
print(f"predecessor_dev_sha={BASE_SHA}")
print(f"predecessor_system_gate={SYSTEM_GATE}")
print(f"predecessor_build11_proof={BUILD11_PROOF}")
print("finance_command_center=SHARED_READ_ONLY_ACCOUNTING_INTELLIGENCE")
print("financial_write_authority=UNCHANGED_ACCOUNTING_OWNER")
print("external_acceptance=HOLD_EXTERNAL")
print("schema_d1_r2_provider_access_main_production_mutation=NONE")
