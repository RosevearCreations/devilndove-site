#!/usr/bin/env python3
"""Retained fail-closed contract for Release 467 Build 92 — Prelaunch Action Queue Completeness & Ownership."""
from pathlib import Path
import json, subprocess, sys

ROOT=Path(__file__).resolve().parents[1]
FAIL=[]
B92_SHA='67bca9198c0973ffe2b39818c3b933ec2737cc00'
B92_TREE='f3fa062060cd53eb5e4b7dab42b2ba6d1fae0450'
B92_PROOFS={'system_gate_run':34506095955,'current_application_quality_run':34506095848,'it_admin_runtime_proof_run':34506095837,'branch_hygiene_run':34506095835}
B92_PAGES=34506354596
B92_LIVE=34506453451
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
b92=load('release467-build92-prelaunch-action-queue-completeness.json')
manifest=load('migrations/canonical/manifest.json')
doc=read('docs/operations/RELEASE_467_BUILD_92_PRELAUNCH_ACTION_QUEUE_COMPLETENESS.md')
provenance=read('scripts/current_system_gate_provenance_gate.py')

req(b92.get('release')==467 and b92.get('build')==92,'Build 92 authority identity drifted')
req(b92.get('title')=='Prelaunch Action Queue Completeness & Ownership','Build 92 title drifted')
req(b92.get('state')=='PRODUCTION_GREEN','Build 92 must retain PRODUCTION_GREEN final state')
final=b92.get('final_closure') or {}; prod92=b92.get('production_checkpoint') or {}
req(final.get('dev_sha')==B92_SHA and final.get('tree_sha')==B92_TREE,'Build 92 final SHA/tree drifted')
req((final.get('proofs') or {})==B92_PROOFS,'Build 92 final four-proof set drifted')
req(final.get('proof_state')=='EXACT_BRANCH_HEAD_FOUR_PROOF_GREEN','Build 92 final proof state drifted')
for key in ('exact_preview_deployment','canonical_development_d1_proof','development_data_authority_read_only','preview_bindings_proof','non_secret_preview_smoke','regression_evidence'):
    req(final.get(key) is True,f'Build 92 final closure missing {key}')
req(prod92.get('main_sha')==B92_SHA and prod92.get('tree_sha')==B92_TREE,'Build 92 Production SHA/tree drifted')
req(prod92.get('production_pages_deploy_run')==B92_PAGES,'Build 92 Production Pages run drifted')
req(prod92.get('production_live_resource_integrity_run')==B92_LIVE,'Build 92 live-resource run drifted')
req(prod92.get('state')=='PRODUCTION_GREEN','Build 92 Production state drifted')

scope=b92.get('scope') or {}
for key in ('all_unresolved_startup_items_actionable','startup_action_status_priority','startup_action_owner_visible','startup_action_due_date_visible','startup_action_queue_complete_count','startup_action_status_summary','external_actions_separate','no_false_no_blockers_message','startup_readiness_expected_total_dynamic','startup_readiness_degraded_fails_closed','technical_green_distinct_from_launch_ready','manual_refresh_only','read_only_launch_projection'):
    req(scope.get(key) is True,f'Build 92 historical scope missing {key}')
for key in ('automatic_provider_execution','provider_publication','automatic_production_promotion','schema_change'):
    req(scope.get(key) is False,f'Build 92 historical safety scope drifted: {key}')

req(pointer.get('release')==467 and int(pointer.get('build') or 0)>=93,'current authority must be Release 467 Build 93 or newer after Build 92 closure ingestion')
last=(pointer.get('restart_integrity') or {}).get('last_fully_verified') or {}; prod=pointer.get('production_checkpoint') or {}
req(int(last.get('build') or 0)>=92,'current restart authority may not regress behind Build 92')
req(int(prod.get('build') or 0)>=92,'current Production authority may not regress behind Build 92')
req('release467-build92-prelaunch-action-queue-completeness.json' in (pointer.get('current_release_authorities') or []),'current authority must retain Build 92 historical authority')

for token in ('every','unresolved','owner','due date','five external','Canada-only','U.S. sales/shipping','GET/read-only','0001','0004'):
    req(token.lower() in doc.lower(),f'Build 92 operating document missing token: {token}')
req([row.get('file') for row in manifest.get('migrations',[])]==EXPECTED,'Build 92 canonical migration stream drifted')
req(not list((ROOT/'migrations/canonical').glob('0005*')),'Build 92 historical boundary expects no later canonical migration yet')
req("run_current_contract('scripts/release467_build92_gate.py', 'Release 467 Build 92')" in provenance,'Current System Gate does not chain Build 92')
run(['python3','scripts/release467_build91_gate.py'],'carried Build 91 boundary')

if FAIL:
    print('RELEASE 467 BUILD 92 PRELAUNCH ACTION QUEUE COMPLETENESS & OWNERSHIP: FAIL')
    for item in FAIL:print('-',item)
    sys.exit(1)
print('RELEASE 467 BUILD 92 PRELAUNCH ACTION QUEUE COMPLETENESS & OWNERSHIP: PASS')
print('Build 92 final Development + Production closure: RETAINED')
print('Complete Startup Readiness action routing: RETAINED')
print('Canonical D1 migrations: 0001-0004 / UNCHANGED')
