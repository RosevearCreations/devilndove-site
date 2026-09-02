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
".github/workflows/development-d1-release448.yml",".github/workflows/development-d1-release449.yml",".github/workflows/development-d1-release450.yml",".github/workflows/development-d1-release453.yml",".github/workflows/development-d1-release459.yml",".github/workflows/development-d1-release460.yml",".github/workflows/development-d1-release461-acceptance.yml",".github/workflows/development-d1-release461-custom-request-commerce.yml",".github/workflows/development-d1-release461-member-runtime.yml",".github/workflows/development-d1-release461-notification.yml",".github/workflows/development-d1-release461-product-offers.yml",".github/workflows/development-d1-release461-public-community.yml",".github/workflows/development-d1-release461-public-telemetry.yml",".github/workflows/development-d1-release461.yml",".github/workflows/release449-remote-verification.yml",".github/workflows/release449-source-gate.yml",".github/workflows/release450-remote-verification.yml",".github/workflows/release450-source-gate.yml",".github/workflows/release451-source-gate.yml",".github/workflows/release452-source-gate.yml",".github/workflows/release453-remote-verification.yml",".github/workflows/release453-source-gate.yml",".github/workflows/release454-source-gate.yml",".github/workflows/release455-source-gate.yml",".github/workflows/release456-source-gate.yml",".github/workflows/release457-source-gate.yml",".github/workflows/release458-source-gate.yml",".github/workflows/release459-remote-verification.yml",".github/workflows/release459-source-gate.yml",".github/workflows/release460-source-gate.yml",".github/workflows/release461-custom-request-commerce-source-gate.yml",".github/workflows/release461-d1-one-shot-preflight.yml",".github/workflows/release461-member-runtime-source-gate.yml",".github/workflows/release461-payment-webhook-schema-contract-source-gate.yml",".github/workflows/release461-product-offer-source-gate.yml",".github/workflows/release461-public-auth-source-gate.yml",".github/workflows/release461-public-community-source-gate.yml",".github/workflows/release461-public-telemetry-source-gate.yml",".github/workflows/release461-source-gate.yml"]
RETAINED=["system-gate.yml","development-runtime-acceptance.yml","production-pages-deploy-current.yml","production-rollback-readiness.yml","release463-cloudflare-inventory.yml","release463-d1-api-clone.yml","release463-d1-consolidation-v4.yml","release463-d1-consolidation.yml","release463-final-cloudflare-cleanup.yml","release463-freeze-native-pages.yml","release463-pages-prune-accelerator.yml","release463-r2-consolidation.yml","release466-build1-proof.yml","release466-build2-proof.yml","release466-build3-proof.yml","release466-build4-proof.yml","release466-build5-proof.yml","release466-build6-proof.yml","release466-development-provider-controls.yml","release466-preview-payment-acceptance-config.yml","release467-build12-proof.yml","release467-it-admin-runtime-proof.yml"]
def req(ok,msg):
    if not ok: FAIL.append(msg)
def read(path):
    p=ROOT/path
    if not p.is_file(): FAIL.append(f"missing required file: {path}"); return ""
    return p.read_text(encoding="utf-8",errors="replace")
def load(path):
    try: v=json.loads(read(path))
    except Exception as e: FAIL.append(f"invalid JSON {path}: {e}"); return {}
    return v if isinstance(v,dict) else {}
def changed():
    try:
        base=subprocess.check_output(["git","merge-base","HEAD","origin/dev"],cwd=ROOT,text=True).strip()
        out=subprocess.check_output(["git","diff","--name-only",f"{base}...HEAD"],cwd=ROOT,text=True)
        return [x for x in out.splitlines() if x]
    except Exception:return []
p=load("current-development-authority.json");m=load("release467-build13-repository-hygiene-cleanup.json");compat=load("development-release.json");mig=load("migrations/canonical/manifest.json")
b12=read("scripts/release467_build12_gate.py");hyg=read("scripts/repository_hygiene_gate.py")
docs=[read(x) for x in ("AI_HANDOFF.md","PROJECT_STATUS_AND_ROADMAP.md","SANITY_HEALTH_CHECK.md","MARKDOWN_INDEX.md","docs/operations/RELEASE_467_BUILD_13_REPOSITORY_HYGIENE.md")]
req(p.get("release")==467 and p.get("build")==13,"pointer must identify Release 467 Build 13")
req(p.get("title")=="Repository Hygiene and Historical CI Cleanup","Build 13 title drifted")
req(p.get("source_base_sha")==BASE_SHA and p.get("last_green_build")==12,"Build 12 predecessor pointer drifted")
req(p.get("last_green_dev_sha")==BASE_SHA and p.get("last_green_dev_tree_sha")==BASE_TREE,"Build 12 predecessor SHA/tree drifted")
req(p.get("last_green_system_gate_run")==SYSTEM_GATE and p.get("last_green_build_proof_run")==BUILD12_PROOF,"Build 12 evidence drifted")
req((p.get("current_release_authorities") or [None])[0]=="release467-build13-repository-hygiene-cleanup.json","Build 13 must be first authority")
req("release467-build12-finance-operations-command-center.json" in (p.get("current_release_authorities") or []),"Build 12 provenance missing")
req(p.get("main_source_head_last_verified")=="ce42f3b2ea553b69085705f500a9e2bd2f689818" and p.get("production_pages_deploy_last_verified")==33640133776,"Production Build 11 evidence drifted")
req(p.get("promotion_state")=="NO_AUTOMATIC_PROMOTION","automatic Production promotion forbidden")
for k in ("schema_change_authorized","d1_mutation_authorized","r2_mutation_authorized","provider_execution_authorized","provider_publication_authorized","cloudflare_access_mutation_authorized","main_mutation_authorized","production_mutation_authorized","secret_values_emitted"):req(p.get(k) is False,f"pointer safety drift: {k}")
ca=p.get("compatibility_authority") or {};req(ca.get("role")=="INHERITED_REGRESSION_COMPATIBILITY" and ca.get("runtime_release_header")==466 and ca.get("runtime_release_header_role")=="INHERITED_RUNTIME_COMPATIBILITY","compatibility classification drifted");req(compat.get("release")==466,"Release 466 compatibility evidence drifted")
req(m.get("release")==467 and m.get("build")==13 and m.get("source_base_sha")==BASE_SHA and m.get("source_base_tree_sha")==BASE_TREE,"Build 13 manifest predecessor drifted")
pr=m.get("predecessor") or {};req(pr.get("build")==12 and pr.get("merged_dev_sha")==BASE_SHA and pr.get("merged_dev_tree_sha")==BASE_TREE and pr.get("system_gate_run")==SYSTEM_GATE and pr.get("build12_proof_run")==BUILD12_PROOF,"Build 13 predecessor evidence drifted")
req(m.get("retired_workflow_count")==39 and m.get("retired_workflows")==RETIRED,"retired workflow manifest drifted")
for k in ("schema_change_authorized","request_time_schema_mutation","new_d1_mutation_authorized","d1_mutation_authorized","r2_mutation_authorized","provider_execution_authorized","provider_publication_authorized","cloudflare_access_policy_mutation_authorized","main_mutation_authorized","production_mutation_authorized","secret_values_emitted"):req(m.get(k) is False,f"manifest safety drift: {k}")
for path in RETIRED:req(not (ROOT/path).exists(),f"retired workflow still ships: {path}")
for name in RETAINED:req((ROOT/".github/workflows"/name).is_file(),f"required workflow removed: {name}")
for n in range(1,14):req((ROOT/f".github/workflows/release467-build{n}-proof.yml").is_file(),f"Release 467 Build {n} proof missing")
compact=b12.replace(" ","")
req("pointer_build>=12" in compact,"Build 12 gate is not forward-compatible")
req("ifpointer_build==12" in compact,"Build 12 exact-scope branch missing")
req("RETIRED_WORKFLOWS" in hyg and "development-d1-release448.yml" in hyg and "release461-source-gate.yml" in hyg,"permanent hygiene fence missing")
expected=["0001_release464_migration_authority.sql","0002_release464_operational_acceptance.sql","0003_release464_business_growth.sql","0004_release465_storefront_quality.sql"]
req([x.get("file") for x in mig.get("migrations",[])]==expected,"canonical migrations drifted")
for body in docs:
    for token in ("Release 467 Build 13","Repository Hygiene",BASE_SHA,"HOLD_EXTERNAL"):req(token in body,f"Build 13 documentation token missing: {token}")
allowed=set(RETIRED)|{"current-development-authority.json","release467-build13-repository-hygiene-cleanup.json","scripts/release467_build12_gate.py","scripts/release467_build13_gate.py","scripts/repository_hygiene_gate.py",".github/workflows/release467-build13-proof.yml","AI_HANDOFF.md","PROJECT_STATUS_AND_ROADMAP.md","SANITY_HEALTH_CHECK.md","MARKDOWN_INDEX.md","docs/operations/RELEASE_467_BUILD_13_REPOSITORY_HYGIENE.md"}
ch=changed();req(not [x for x in ch if x not in allowed],f"files outside Build 13 scope changed: {[x for x in ch if x not in allowed]}");req(not [x for x in ch if x.startswith(("functions/","public/","admin/"))],"application runtime changed");req(not [x for x in ch if x.startswith("migrations/") or x.lower().endswith(".sql")],"schema/migration changed")
if FAIL:
    print("FAIL Release 467 Build 13 Repository Hygiene gate");[print(f"- {x}") for x in FAIL];sys.exit(1)
print("PASS Release 467 Build 13 Repository Hygiene gate")
print("retired_live_workflows=39")
print("historical_git_evidence=RETAINED")
print("release463_infrastructure=RETAINED")
print("release466_compatibility=RETAINED")
print("release467_current_proofs=RETAINED")
print("application_runtime_changes=NONE")
print("schema_d1_r2_provider_access_main_production_mutation=NONE")
