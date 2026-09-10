#!/usr/bin/env python3
"""Retained fail-closed contract for Release 467 Build 90 — External Acceptance Evidence Depth."""
from pathlib import Path
import json, subprocess, sys

ROOT=Path(__file__).resolve().parents[1]
FAIL=[]
B90_SHA='ab23457370ced9224facc2a09c1cca7b1ff20968'
B90_TREE='54f069f37e09e6f48e035f98656423ed28aa85f4'
B90_PROOFS={'system_gate_run':34434124113,'current_application_quality_run':34434123999,'it_admin_runtime_proof_run':34434124058,'branch_hygiene_run':34434124046}
B90_PAGES=34434296247
B90_LIVE=34434356959
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
b90=load('release467-build90-external-acceptance-evidence-depth.json')
manifest=load('migrations/canonical/manifest.json')
doc=read('docs/operations/RELEASE_467_BUILD_90_EXTERNAL_ACCEPTANCE_EVIDENCE_DEPTH.md')
provenance=read('scripts/current_system_gate_provenance_gate.py')

req(b90.get('release')==467 and b90.get('build')==90,'Build 90 authority identity drifted')
req(b90.get('title')=='External Acceptance Evidence Depth & Cross-Lane Guidance','Build 90 title drifted')
req(b90.get('state')=='PRODUCTION_GREEN','Build 90 must retain PRODUCTION_GREEN final state')
final=b90.get('final_closure') or {}; prod90=b90.get('production_checkpoint') or {}
req(final.get('dev_sha')==B90_SHA and final.get('tree_sha')==B90_TREE,'Build 90 final SHA/tree drifted')
req((final.get('proofs') or {})==B90_PROOFS,'Build 90 final four-proof set drifted')
req(final.get('proof_state')=='EXACT_BRANCH_HEAD_FOUR_PROOF_GREEN','Build 90 final proof state drifted')
for key in ('exact_preview_deployment','canonical_development_d1_proof','development_data_authority_read_only','preview_bindings_proof','non_secret_preview_smoke','regression_evidence'):
    req(final.get(key) is True,f'Build 90 final closure missing {key}')
req(prod90.get('build')==90 and prod90.get('main_sha')==B90_SHA and prod90.get('tree_sha')==B90_TREE,'Build 90 Production SHA/tree drifted')
req(prod90.get('production_pages_deploy_run')==B90_PAGES,'Build 90 Production Pages run drifted')
req(prod90.get('production_live_resource_integrity_run')==B90_LIVE,'Build 90 live-resource run drifted')
req(prod90.get('state')=='PRODUCTION_GREEN','Build 90 Production state drifted')

req(pointer.get('release')==467 and int(pointer.get('build') or 0)>=91,'current authority must be Release 467 Build 91 or newer after Build 90 closure ingestion')
last=(pointer.get('restart_integrity') or {}).get('last_fully_verified') or {}; prod=pointer.get('production_checkpoint') or {}
req(int(last.get('build') or 0)>=90,'current restart authority may not regress behind Build 90')
req(int(prod.get('build') or 0)>=90,'current Production authority may not regress behind Build 90')
req('release467-build90-external-acceptance-evidence-depth.json' in (pointer.get('current_release_authorities') or []),'current authority must retain Build 90 historical authority')

for token in ('five external lanes','Social OAuth','CAIP','Cloudflare Access','timestamp','HOLD_EXTERNAL','0001','0004'):
    req(token.lower() in doc.lower(),f'Build 90 operating document missing token: {token}')
req([row.get('file') for row in manifest.get('migrations',[])]==EXPECTED,'Build 90 canonical migration stream drifted')
req(not list((ROOT/'migrations/canonical').glob('0005*')),'Build 90 historical boundary expects no later canonical migration yet')
req("run_current_contract('scripts/release467_build90_gate.py', 'Release 467 Build 90')" in provenance,'Current System Gate does not chain Build 90')
run(['python3','scripts/release467_build89_gate.py'],'carried Build 89 boundary')

if FAIL:
    print('RELEASE 467 BUILD 90 EXTERNAL ACCEPTANCE EVIDENCE DEPTH: FAIL')
    for item in FAIL:print('-',item)
    sys.exit(1)
print('RELEASE 467 BUILD 90 EXTERNAL ACCEPTANCE EVIDENCE DEPTH: PASS')
print('Build 90 final Development + Production closure: RETAINED')
print('Five-lane structured evidence authority: RETAINED')
print('Canonical D1 migrations: 0001-0004 / UNCHANGED')
