#!/usr/bin/env python3
"""Retained fail-closed contract for Release 467 Build 91 — Prelaunch Authority & Go-Live Decision Convergence."""
from pathlib import Path
import json, subprocess, sys

ROOT=Path(__file__).resolve().parents[1]
FAIL=[]
B91_SHA='1d5519b976d108e7d4a558876863be5559a67e35'
B91_TREE='6a62d01c1be002b78c3c8d05993c40676e41e208'
B91_PROOFS={'system_gate_run':34486729268,'current_application_quality_run':34486729227,'it_admin_runtime_proof_run':34486729225,'branch_hygiene_run':34486729311}
B91_PAGES=34488492622
B91_LIVE=34488622668
EXPECTED=['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql']

def read(path):
    target=ROOT/path
    if not target.is_file(): FAIL.append(f'missing required file: {path}'); return ''
    return target.read_text(encoding='utf-8',errors='replace')
def load(path):
    try:return json.loads(read(path) or '{}')
    except json.JSONDecodeError as exc:FAIL.append(f'invalid JSON {path}: {exc}');return{}
def req(ok,msg):
    if not ok:FAIL.append(msg)
def run(cmd,label):
    result=subprocess.run(cmd,cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=False)
    if result.stdout.strip():print(result.stdout.strip())
    req(result.returncode==0,f"{label} failed: {(result.stderr or result.stdout).strip()[-3000:]}")

pointer=load('current-development-authority.json')
b91=load('release467-build91-prelaunch-go-live-decision-convergence.json')
manifest=load('migrations/canonical/manifest.json')
doc=read('docs/operations/RELEASE_467_BUILD_91_PRELAUNCH_GO_LIVE_DECISION_CONVERGENCE.md')
provenance=read('scripts/current_system_gate_provenance_gate.py')

req(b91.get('release')==467 and b91.get('build')==91,'Build 91 authority identity drifted')
req(b91.get('title')=='Prelaunch Authority & Go-Live Decision Convergence','Build 91 title drifted')
req(b91.get('state')=='PRODUCTION_GREEN','Build 91 must retain PRODUCTION_GREEN final state')
final=b91.get('final_closure') or {}; prod91=b91.get('production_checkpoint') or {}
req(final.get('dev_sha')==B91_SHA and final.get('tree_sha')==B91_TREE,'Build 91 final SHA/tree drifted')
req((final.get('proofs') or {})==B91_PROOFS,'Build 91 final four-proof set drifted')
req(final.get('proof_state')=='EXACT_BRANCH_HEAD_FOUR_PROOF_GREEN','Build 91 final proof state drifted')
for key in ('exact_preview_deployment','canonical_development_d1_proof','development_data_authority_read_only','preview_bindings_proof','non_secret_preview_smoke','regression_evidence'):
    req(final.get(key) is True,f'Build 91 final closure missing {key}')
req(prod91.get('main_sha')==B91_SHA and prod91.get('tree_sha')==B91_TREE,'Build 91 Production SHA/tree drifted')
req(prod91.get('production_pages_deploy_run')==B91_PAGES,'Build 91 Production Pages run drifted')
req(prod91.get('production_live_resource_integrity_run')==B91_LIVE,'Build 91 live-resource run drifted')
req(prod91.get('state')=='PRODUCTION_GREEN','Build 91 Production state drifted')

scope=b91.get('scope') or {}
for key in ('prelaunch_current_authority_convergence','startup_readiness_expected_total_dynamic','startup_readiness_degraded_fails_closed','external_acceptance_five_lane_summary','technical_green_distinct_from_launch_ready','canada_only_commerce_policy_visible','us_sales_shipping_disabled_visible','local_pickup_boundary_visible','manual_refresh_only','read_only_launch_projection'):
    req(scope.get(key) is True,f'Build 91 historical scope missing {key}')
for key in ('automatic_provider_execution','provider_publication','automatic_production_promotion','schema_change'):
    req(scope.get(key) is False,f'Build 91 historical safety scope drifted: {key}')

req(pointer.get('release')==467 and int(pointer.get('build') or 0)>=92,'current authority must be Release 467 Build 92 or newer after Build 91 closure ingestion')
last=(pointer.get('restart_integrity') or {}).get('last_fully_verified') or {}; prod=pointer.get('production_checkpoint') or {}
req(int(last.get('build') or 0)>=91,'current restart authority may not regress behind Build 91')
req(int(prod.get('build') or 0)>=91,'current Production authority may not regress behind Build 91')
req('release467-build91-prelaunch-go-live-decision-convergence.json' in (pointer.get('current_release_authorities') or []),'current authority must retain Build 91 historical authority')

for token in ('Startup Readiness','five external','Canada-only','U.S. sales/shipping','GET-only','0001','0004'):
    req(token.lower() in doc.lower(),f'Build 91 operating document missing token: {token}')
req([row.get('file') for row in manifest.get('migrations',[])]==EXPECTED,'Build 91 canonical migration stream drifted')
req(not list((ROOT/'migrations/canonical').glob('0005*')),'Build 91 historical boundary expects no later canonical migration yet')
req("run_current_contract('scripts/release467_build91_gate.py', 'Release 467 Build 91')" in provenance,'Current System Gate does not chain Build 91')
run(['python3','scripts/release467_build90_gate.py'],'carried Build 90 boundary')

if FAIL:
    print('RELEASE 467 BUILD 91 PRELAUNCH AUTHORITY & GO-LIVE DECISION CONVERGENCE: FAIL')
    for item in FAIL:print('-',item)
    sys.exit(1)
print('RELEASE 467 BUILD 91 PRELAUNCH AUTHORITY & GO-LIVE DECISION CONVERGENCE: PASS')
print('Build 91 final Development + Production closure: RETAINED')
print('Prelaunch launch-decision authority: RETAINED')
print('Canonical D1 migrations: 0001-0004 / UNCHANGED')
