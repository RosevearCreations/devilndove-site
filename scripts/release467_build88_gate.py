#!/usr/bin/env python3
"""Retained fail-closed historical contract for Release 467 Build 88."""
from pathlib import Path
import json, subprocess, sys

ROOT=Path(__file__).resolve().parents[1]
FAIL=[]
B88_SHA='9c6d56b887b2aa4bb710e5980608b8942830034c'
B88_TREE='9f7d279ed5c83795682ba763ca150f1fe91a6019'
B88_PROOFS={'system_gate_run':34423493650,'current_application_quality_run':34423493830,'it_admin_runtime_proof_run':34423493747,'branch_hygiene_run':34423493617}
B88_PAGES=34423649786
B88_LIVE=34423737422
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
b88=load('release467-build88-external-acceptance-control-center.json')
manifest=load('migrations/canonical/manifest.json')
doc=read('docs/operations/RELEASE_467_BUILD_88_EXTERNAL_ACCEPTANCE_CONTROL_CENTER.md')
provenance=read('scripts/current_system_gate_provenance_gate.py')
historical_runner=read('functions/api/admin/provider-acceptance-runner.js')
historical_bridge=read('functions/api/admin/release467-external-commercial-acceptance.js')

req(b88.get('release')==467 and b88.get('build')==88,'Build 88 authority identity drifted')
req(b88.get('title')=='External Acceptance Control Center Convergence','Build 88 title drifted')
req(b88.get('state')=='PRODUCTION_GREEN','Build 88 must retain PRODUCTION_GREEN final state')
final=b88.get('final_closure') or {}; prod88=b88.get('production_checkpoint') or {}; safety=b88.get('safety') or {}
req(final.get('dev_sha')==B88_SHA and final.get('tree_sha')==B88_TREE,'Build 88 final SHA/tree drifted')
req((final.get('proofs') or {})==B88_PROOFS,'Build 88 final four-proof set drifted')
req(final.get('proof_state')=='EXACT_BRANCH_HEAD_FOUR_PROOF_GREEN','Build 88 final proof state drifted')
for key in ('exact_preview_deployment','canonical_development_d1_proof','development_data_authority_read_only','preview_bindings_proof','non_secret_preview_smoke','regression_evidence'):
    req(final.get(key) is True,f'Build 88 final closure missing {key}')
req(prod88.get('build')==88 and prod88.get('main_sha')==B88_SHA and prod88.get('tree_sha')==B88_TREE,'Build 88 Production SHA/tree drifted')
req(prod88.get('production_pages_deploy_run')==B88_PAGES,'Build 88 Production Pages run drifted')
req(prod88.get('production_live_resource_integrity_run')==B88_LIVE,'Build 88 live-resource run drifted')
req(prod88.get('state')=='PRODUCTION_GREEN','Build 88 Production state drifted')
for key in ('business_data_preserved','canonical_d1_and_foreign_keys_proved','exact_pages_deployment_and_bindings_proved','public_smoke_passed','live_account_d1_product_r2_and_product_api_proved'):
    req(prod88.get(key) is True,f'Build 88 Production closure missing {key}')
for key in ('schema_change','request_time_schema_mutation','automatic_d1_mutation','automatic_r2_mutation','binding_mutation','automatic_provider_execution','provider_publication','production_provider_execution','production_business_data_overwrite','secret_values_emitted'):
    req(safety.get(key) is False,f'Build 88 safety boundary drifted: {key}')

# Current operator surfaces may advance. Only require the current pointer to retain and not regress Build 88 history.
req(pointer.get('release')==467 and int(pointer.get('build') or 0)>=89,'current authority must be Release 467 Build 89 or newer after Build 88 closure ingestion')
last=(pointer.get('restart_integrity') or {}).get('last_fully_verified') or {}; prod=pointer.get('production_checkpoint') or {}
req(int(last.get('build') or 0)>=88,'current restart authority may not regress behind Build 88')
req(int(prod.get('build') or 0)>=88,'current Production authority may not regress behind Build 88')
req('release467-build88-external-acceptance-control-center.json' in (pointer.get('current_release_authorities') or []),'current authority must retain Build 88 historical authority')

for token in ('five','six real acceptance dimensions','provider-synchronized','historical Build 6/7','HOLD_EXTERNAL','0001','0004'):
    req(token.lower() in doc.lower(),f'Build 88 operating document missing token: {token}')
req('Release 466 Build 6' in historical_runner,'Historical provider runner identity drifted')
req('const BUILD = 7;' in historical_bridge,'Historical Build 7 bridge identity drifted')
req([row.get('file') for row in manifest.get('migrations',[])]==EXPECTED,'Build 88 canonical migration stream drifted')
req(not list((ROOT/'migrations/canonical').glob('0005*')),'Build 88 historical boundary expects no later canonical migration yet')
req("run_current_contract('scripts/release467_build88_gate.py', 'Release 467 Build 88')" in provenance,'Current System Gate does not chain Build 88')

run(['python3','scripts/current_authority_restart_integrity_gate.py'],'current restart integrity')
run(['python3','scripts/release467_build87_gate.py'],'carried Build 87 boundary')

if FAIL:
    print('RELEASE 467 BUILD 88 EXTERNAL ACCEPTANCE CONTROL CENTER: FAIL')
    for item in FAIL:print('-',item)
    sys.exit(1)
print('RELEASE 467 BUILD 88 EXTERNAL ACCEPTANCE CONTROL CENTER: PASS')
print('Build 88 final Development + Production closure: RETAINED')
print('Five external evidence lanes / Stripe-PayPal six-dimension model: RETAINED')
print('Historical Build 6/7 engines: PRESERVED')
print('Automatic / Production provider execution: CLOSED')
print('Canonical D1 migrations: 0001-0004 / UNCHANGED')
