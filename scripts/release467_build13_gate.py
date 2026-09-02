#!/usr/bin/env python3
"""Fail-closed source contract for Release 467 Build 13 — Repository Hygiene and Historical CI Cleanup."""
from __future__ import annotations
import json, subprocess, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
FAIL=[]
BASE_SHA="374983f68fb16172fb357b1755293a29e5d2953f"
BASE_TREE="339f13b5a6e6ba5cc4a9c64ea3b04b70ad8aef91"
SYSTEM_GATE=33642231716
BUILD12_PROOF=33642231794
RETIRED=[
".github/workflows/development-d1-release448.yml",
".github/workflows/development-d1-release449.yml",
".github/workflows/development-d1-release450.yml",
".github/workflows/development-d1-release453.yml",
".github/workflows/development-d1-release459.yml",
".github/workflows/development-d1-release460.yml",
".github/workflows/development-d1-release461-acceptance.yml",
".github/workflows/development-d1-release461-custom-request-commerce.yml",
".github/workflows/development-d1-release461-member-runtime.yml",
".github/workflows/development-d1-release461-notification.yml",
".github/workflows/development-d1-release461-product-offers.yml",
".github/workflows/development-d1-release461-public-community.yml",
".github/workflows/development-d1-release461-public-telemetry.yml",
".github/workflows/development-d1-release461.yml",
".github/workflows/release449-remote-verification.yml",
".github/workflows/release449-source-gate.yml",
".github/workflows/release450-remote-verification.yml",
".github/workflows/release450-source-gate.yml",
".github/workflows/release451-source-gate.yml",
".github/workflows/release452-source-gate.yml",
".github/workflows/release453-remote-verification.yml",
".github/workflows/release453-source-gate.yml",
".github/workflows/release454-source-gate.yml",
".github/workflows/release455-source-gate.yml",
".github/workflows/release456-source-gate.yml",
".github/workflows/release457-source-gate.yml",
".github/workflows/release458-source-gate.yml",
".github/workflows/release459-remote-verification.yml",
".github/workflows/release459-source-gate.yml",
".github/workflows/release460-source-gate.yml",
".github/workflows/release461-custom-request-commerce-source-gate.yml",
".github/workflows/release461-d1-one-shot-preflight.yml",
".github/workflows/release461-member-runtime-source-gate.yml",
".github/workflows/release461-payment-webhook-schema-contract-source-gate.yml",
".github/workflows/release461-product-offer-source-gate.yml",
".github/workflows/release461-public-auth-source-gate.yml",
".github/workflows/release461-public-community-source-gate.yml",
".github/workflows/release461-public-telemetry-source-gate.yml",
".github/workflows/release461-source-gate.yml",
]
RETAINED=[
".github/workflows/system-gate.yml",
".github/workflows/development-runtime-acceptance.yml",
".github/workflows/production-pages-deploy-current.yml",
".github/workflows/production-rollback-readiness.yml",
".github/workflows/release463-cloudflare-inventory.yml",
".github/workflows/release463-d1-api-clone.yml",
".github/workflows/release463-d1-consolidation-v4.yml",
".github/workflows/release463-d1-consolidation.yml",
".github/workflows/release463-final-cloudflare-cleanup.yml",
".github/workflows/release463-freeze-native-pages.yml",
".github/workflows/release463-pages-prune-accelerator.yml",
".github/workflows/release463-r2-consolidation.yml",
".github/workflows/release466-build1-proof.yml",
".github/workflows/release466-build2-proof.yml",
".github/workflows/release466-build3-proof.yml",
".github/workflows/release466-build4-proof.yml",
".github/workflows/release466-build5-proof.yml",
".github/workflows/release466-build6-proof.yml",
".github/workflows/release466-development-provider-controls.yml",
".github/workflows/release466-preview-payment-acceptance-config.yml",
".github/workflows/release467-build12-proof.yml",
".github/workflows/release467-it-admin-runtime-proof.yml",
]

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
manifest=load("release467-build13-repository-hygiene-cleanup.json")
compat=load("development-release.json")
migrations=load("migrations/canonical/manifest.json")
build12_gate=read("scripts/release467_build12_gate.py")
hygiene=read("scripts/repository_hygiene_gate.py")
handoff=read("AI_HANDOFF.md")
roadmap=read("PROJECT_STATUS_AND_ROADMAP.md")
sanity=read("SANITY_HEALTH_CHECK.md")
index=read("MARKDOWN_INDEX.md")
ops_doc=read("docs/operations/RELEASE_467_BUILD_13_REPOSITORY_HYGIENE.md")

req(pointer.get("release")==467 and pointer.get("build")==13,"current authority must identify Release 467 Build 13")
req(pointer.get("title")=="Repository Hygiene and Historical CI Cleanup","Build 13 title drifted")
req(pointer.get("state")=="DEVELOPMENT_CANDIDATE","Build 13 pointer must remain DEVELOPMENT_CANDIDATE before merge")
req(pointer.get("source_base_sha")==BASE_SHA,"Build 13 source base drifted")
req(pointer.get("last_green_build")==12,"Build 12 must be exact last-green predecessor")
req(pointer.get("last_green_dev_sha")==BASE_SHA,"Build 12 predecessor SHA drifted")
req(pointer.get("last_green_dev_tree_sha")==BASE_TREE,"Build 12 predecessor tree drifted")
req(pointer.get("last_green_system_gate_run")==SYSTEM_GATE,"Build 12 System Gate evidence drifted")
req(pointer.get("last_green_build_proof_run")==BUILD12_PROOF,"Build 12 proof evidence drifted")
req((pointer.get("current_release_authorities") or [None])[0]=="release467-build13-repository-hygiene-cleanup.json","Build 13 must be first current authority")
req("release467-build12-finance-operations-command-center.json" in (pointer.get("current_release_authorities") or []),"Build 12 provenance must remain retained")
req(pointer.get("main_source_head_last_verified")=="ce42f3b2ea553b69085705f500a9e2bd2f689818","Build 13 must preserve verified Production/main Build 11 source head")
req(pointer.get("production_pages_deploy_last_verified")==33640133776,"Build 13 must preserve Production deployment evidence")
req(pointer.get("promotion_state")=="NO_AUTOMATIC_PROMOTION","Build 13 cannot authorize Production promotion")
for key in ("schema_change_authorized","d1_mutation_authorized","r2_mutation_authorized","provider_execution_authorized","provider_publication_authorized","cloudflare_access_mutation_authorized","main_mutation_authorized","production_mutation_authorized","secret_values_emitted"):
    req(pointer.get(key) is False,f"Build 13 pointer safety flag must remain false: {key}")
compatibility=pointer.get("compatibility_authority") or {}
req(compatibility.get("role")=="INHERITED_REGRESSION_COMPATIBILITY","Release 466 compatibility role drifted")
req(compatibility.get("runtime_release_header")==466 and compatibility.get("runtime_release_header_role")=="INHERITED_RUNTIME_COMPATIBILITY","runtime compatibility classification drifted")
req(compat.get("release")==466,"development-release.json must remain inherited Release 466 evidence")

req(manifest.get("release")==467 and manifest.get("build")==13,"Build 13 manifest identity drifted")
req(manifest.get("source_base_sha")==BASE_SHA and manifest.get("source_base_tree_sha")==BASE_TREE,"Build 13 manifest predecessor drifted")
pred=manifest.get("predecessor") or {}
req(pred.get("build")==12 and pred.get("merged_dev_sha")==BASE_SHA and pred.get("merged_dev_tree_sha")==BASE_TREE,"Build 13 predecessor must remain exact Build 12 merge")
req(pred.get("system_gate_run")==SYSTEM_GATE and pred.get("build12_proof_run")==BUILD12_PROOF,"Build 13 predecessor evidence drifted")
req(manifest.get("retired_workflow_count")==len(RETIRED),"Build 13 retired workflow count drifted")
req(manifest.get("retired_workflows")==RETIRED,"Build 13 retired workflow manifest drifted")
for key in ("schema_change_authorized","request_time_schema_mutation","new_d1_mutation_authorized","d1_mutation_authorized","r2_mutation_authorized","provider_execution_authorized","provider_publication_authorized","cloudflare_access_policy_mutation_authorized","main_mutation_authorized","production_mutation_authorized","secret_values_emitted"):
    req(manifest.get(key) is False,f"Build 13 manifest safety flag must remain false: {key}")

for path in RETIRED: req(not (ROOT/path).exists(),f"retired historical workflow still ships: {path}")
for path in RETAINED: req((ROOT/path).is_file(),f"required current/compatibility workflow was removed: {path}")
for n in range(1,13): req((ROOT/f".github/workflows/release467-build{n}-proof.yml").is_file(),f"current Release 467 Build {n} proof workflow must remain")
req((ROOT/".github/workflows/release467-build13-proof.yml").is_file(),"Build 13 proof workflow missing")
req("pointer_build>=12" in build12_gate.replace(" ",""),"Build 12 gate must be forward-compatible with Build 13")
req("if pointer_build==12" in build12_gate.replace(" ",""),"Build 12 exact changed-file scope must remain bounded to Build 12")
req("RETIRED_WORKFLOWS" in hygiene,"repository hygiene gate must permanently fence retired workflows")
for marker in ("development-d1-release448.yml","release461-source-gate.yml"):
    req(marker in hygiene,f"repository hygiene retired-workflow fence missing marker: {marker}")
expected=["0001_release464_migration_authority.sql","0002_release464_operational_acceptance.sql","0003_release464_business_growth.sql","0004_release465_storefront_quality.sql"]
req([row.get("file") for row in migrations.get("migrations",[])]==expected,"Build 13 must preserve canonical migrations 0001-0004 exactly")
for body,name in ((handoff,"AI_HANDOFF.md"),(roadmap,"PROJECT_STATUS_AND_ROADMAP.md"),(sanity,"SANITY_HEALTH_CHECK.md"),(index,"MARKDOWN_INDEX.md"),(ops_doc,"Build 13 operations doc")):
    for token in ("Release 467 Build 13","Repository Hygiene",BASE_SHA,"HOLD_EXTERNAL"):
        req(token in body,f"{name} missing Build 13 authority token: {token}")

allowed=set(RETIRED)|{
"current-development-authority.json","release467-build13-repository-hygiene-cleanup.json",
"scripts/release467_build12_gate.py","scripts/release467_build13_gate.py","scripts/repository_hygiene_gate.py",
".github/workflows/release467-build13-proof.yml","AI_HANDOFF.md","PROJECT_STATUS_AND_ROADMAP.md",
"SANITY_HEALTH_CHECK.md","MARKDOWN_INDEX.md","docs/operations/RELEASE_467_BUILD_13_REPOSITORY_HYGIENE.md"
}
changed=changed_files()
if changed:
    unexpected=[p for p in changed if p not in allowed]; req(not unexpected,f"Build 13 changed files outside repository-hygiene scope: {unexpected}")
    runtime_changes=[p for p in changed if p.startswith(("functions/","public/","admin/"))]; req(not runtime_changes,f"Build 13 must not alter application runtime: {runtime_changes}")
    migration_changes=[p for p in changed if p.startswith("migrations/") or p.lower().endswith(".sql")]; req(not migration_changes,f"Build 13 is schema-neutral but migration/SQL files changed: {migration_changes}")
if FAIL:
    print("FAIL Release 467 Build 13 Repository Hygiene gate")
    for item in FAIL: print(f"- {item}")
    sys.exit(1)
print("PASS Release 467 Build 13 Repository Hygiene gate")
print(f"retired_live_workflows={len(RETIRED)}")
print("historical_git_evidence=RETAINED")
print("release463_infrastructure=RETAINED")
print("release466_compatibility=RETAINED")
print("release467_current_proofs=RETAINED")
print("application_runtime_changes=NONE")
print("schema_d1_r2_provider_access_main_production_mutation=NONE")
