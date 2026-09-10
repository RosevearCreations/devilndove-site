#!/usr/bin/env python3
"""Retained fail-closed contract for Release 467 Build 87 — Production Authority & Restart Convergence."""
from pathlib import Path
import json, re, subprocess, sys

ROOT=Path(__file__).resolve().parents[1]
FAIL=[]
B87_SHA='646d73710784008617157cf5746a66f053daba83'
B87_TREE='709f802cf7ca24a12f48bd7c8b562a92b306fcae'
B87_PROOFS={'system_gate_run':34421392242,'current_application_quality_run':34421392244,'it_admin_runtime_proof_run':34421392231,'branch_hygiene_run':34421392188}
B87_PAGES=34421532872
B87_LIVE=34421613381
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
b87=load('release467-build87-production-authority-restart-convergence.json')
manifest=load('migrations/canonical/manifest.json')
doc=read('docs/operations/RELEASE_467_BUILD_87_PRODUCTION_AUTHORITY_RESTART_CONVERGENCE.md')
it_api=read('functions/api/admin/it-operations-control-tower.js')
reliability=read('functions/api/_lib/currentReliability.js')
preflight=read('functions/api/admin/current-deployment-preflight.js')
provenance=read('scripts/current_system_gate_provenance_gate.py')

req(b87.get('release')==467 and b87.get('build')==87,'Build 87 authority identity drifted')
req(b87.get('title')=='Production Authority & Restart Convergence','Build 87 title drifted')
req(b87.get('state')=='PRODUCTION_GREEN','Build 87 must retain PRODUCTION_GREEN final state')
final=b87.get('final_closure') or {}; prod87=b87.get('production_checkpoint') or {}
req(final.get('dev_sha')==B87_SHA and final.get('tree_sha')==B87_TREE,'Build 87 final SHA/tree drifted')
req((final.get('proofs') or {})==B87_PROOFS,'Build 87 final four-proof set drifted')
req(final.get('proof_state')=='EXACT_BRANCH_HEAD_FOUR_PROOF_GREEN','Build 87 final proof state drifted')
for key in ('exact_preview_deployment','canonical_development_d1_proof','development_data_authority_read_only','preview_bindings_proof','non_secret_preview_smoke','regression_evidence'):
    req(final.get(key) is True,f'Build 87 final closure missing {key}')
req(prod87.get('build')==87 and prod87.get('main_sha')==B87_SHA and prod87.get('tree_sha')==B87_TREE,'Build 87 Production SHA/tree drifted')
req(prod87.get('production_pages_deploy_run')==B87_PAGES,'Build 87 Production Pages run drifted')
req(prod87.get('production_live_resource_integrity_run')==B87_LIVE,'Build 87 live-resource run drifted')
req(prod87.get('state')=='PRODUCTION_GREEN','Build 87 Production state drifted')

req(pointer.get('release')==467 and int(pointer.get('build') or 0)>=88,'current authority must be Release 467 Build 88 or newer after Build 87 closure ingestion')
last=(pointer.get('restart_integrity') or {}).get('last_fully_verified') or {}; prod=pointer.get('production_checkpoint') or {}
req(int(last.get('build') or 0)>=87,'current restart authority may not regress behind Build 87')
req(int(prod.get('build') or 0)>=87,'current Production authority may not regress behind Build 87')
req('release467-build87-production-authority-restart-convergence.json' in (pointer.get('current_release_authorities') or []),'current authority must retain Build 87 historical authority')

for text,label in ((it_api,'I.T. API'),(reliability,'Reliability'),(preflight,'Deployment Preflight')):
    req(B87_SHA in text and B87_TREE in text,f'{label} missing Build 87 verified baseline')
    req(str(B87_PAGES) in text and str(B87_LIVE) in text,f'{label} missing Build 87 Production proof')
req('provider_execution:false' in it_api,'I.T. API lost provider-execution closed boundary')
req("mutation_capability: 'none'" in reliability,'Reliability lost read-only boundary')
req("mutation_capability:'none'" in re.sub(r'\s+','',preflight),'Deployment Preflight lost read-only boundary')

for token in ('authority', 'restart', 'HOLD_EXTERNAL', '0001', '0004'):
    req(token.lower() in doc.lower(),f'Build 87 operating document missing token: {token}')
req([row.get('file') for row in manifest.get('migrations',[])]==EXPECTED,'Build 87 canonical migration stream drifted')
req(not list((ROOT/'migrations/canonical').glob('0005*')),'Build 87 historical boundary expects no later canonical migration yet')
req("run_current_contract('scripts/release467_build87_gate.py', 'Release 467 Build 87')" in provenance,'Current System Gate does not chain Build 87')

run(['python3','scripts/current_authority_restart_integrity_gate.py'],'current restart integrity')
run(['python3','scripts/release467_build86_gate.py'],'carried Build 86 boundary')

if FAIL:
    print('RELEASE 467 BUILD 87 PRODUCTION AUTHORITY & RESTART CONVERGENCE: FAIL')
    for item in FAIL:print('-',item)
    sys.exit(1)
print('RELEASE 467 BUILD 87 PRODUCTION AUTHORITY & RESTART CONVERGENCE: PASS')
print('Build 87 final Development + Production closure: RETAINED')
print('Current authority may advance only without regressing Build 87 proof')
print('Canonical D1 migrations: 0001-0004 / UNCHANGED')
