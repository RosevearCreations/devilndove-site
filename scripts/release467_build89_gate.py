#!/usr/bin/env python3
"""Retained fail-closed contract for Release 467 Build 89 — environment-isolated external acceptance."""
from pathlib import Path
import json,re,subprocess,sys
ROOT=Path(__file__).resolve().parents[1]; FAIL=[]
B89_SHA='68ac415302bceddb81e6faea15fbbebb3a76f24a'; B89_TREE='1a7cccf46b29718ea63d532c8c22322bcca98ffd'
B89_PROOFS={'system_gate_run':34425720516,'current_application_quality_run':34425720539,'it_admin_runtime_proof_run':34425720559,'branch_hygiene_run':34425720537}
B89_PAGES=34425875315; B89_LIVE=34425949898
EXPECTED=['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql']
def read(p):
 t=ROOT/p
 if not t.is_file(): FAIL.append(f'missing required file: {p}'); return ''
 return t.read_text(encoding='utf-8',errors='replace')
def load(p):
 try:return json.loads(read(p) or '{}')
 except json.JSONDecodeError as e:FAIL.append(f'invalid JSON {p}: {e}');return{}
def req(ok,msg):
 if not ok:FAIL.append(msg)
def run(cmd,label):
 r=subprocess.run(cmd,cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=False)
 if r.stdout.strip():print(r.stdout.strip())
 req(r.returncode==0,f"{label} failed: {(r.stderr or r.stdout).strip()[-3000:]}")
def compact(s):return re.sub(r'\s+','',s)

pointer=load('current-development-authority.json'); b89=load('release467-build89-external-acceptance-environment-isolation.json'); manifest=load('migrations/canonical/manifest.json')
api=read('functions/api/admin/current-external-acceptance-control-center.js'); apic=compact(api)
runner=read('functions/api/admin/provider-acceptance-runner.js'); bridge=read('functions/api/admin/release467-external-commercial-acceptance.js')
doc=read('docs/operations/RELEASE_467_BUILD_89_EXTERNAL_ACCEPTANCE_ENVIRONMENT_ISOLATION.md'); provenance=read('scripts/current_system_gate_provenance_gate.py')

# Immutable Build 89 external closure.
req(b89.get('release')==467 and b89.get('build')==89,'Build 89 authority identity drifted')
req(b89.get('title')=='External Acceptance Environment Isolation & Guided Recovery','Build 89 title drifted')
req(b89.get('state')=='PRODUCTION_GREEN','Build 89 authority must retain Production GREEN')
final=b89.get('final_closure') or {}; prod89=b89.get('production_checkpoint') or {}
req(final.get('dev_sha')==B89_SHA and final.get('tree_sha')==B89_TREE,'Build 89 final SHA/tree drifted')
req((final.get('proofs') or {})==B89_PROOFS,'Build 89 final four-proof set drifted')
req(final.get('proof_state')=='EXACT_BRANCH_HEAD_FOUR_PROOF_GREEN','Build 89 final proof state drifted')
for k in ('exact_preview_deployment','canonical_development_d1_proof','development_data_authority_read_only','preview_bindings_proof','non_secret_preview_smoke','regression_evidence'):req(final.get(k) is True,f'Build 89 final closure missing {k}')
req(prod89.get('build')==89 and prod89.get('main_sha')==B89_SHA and prod89.get('tree_sha')==B89_TREE,'Build 89 Production SHA/tree drifted')
req(prod89.get('production_pages_deploy_run')==B89_PAGES and prod89.get('production_live_resource_integrity_run')==B89_LIVE,'Build 89 Production proof runs drifted')
req(prod89.get('state')=='PRODUCTION_GREEN','Build 89 Production state drifted')

# Later current authority may advance, never regress behind Build 89.
req(pointer.get('release')==467 and int(pointer.get('build') or 0)>=90,'current authority must be Release 467 Build 90 or newer after Build 89 closure ingestion')
last=(pointer.get('restart_integrity') or {}).get('last_fully_verified') or {}; prod=pointer.get('production_checkpoint') or {}
req(int(last.get('build') or 0)>=89,'current restart authority may not regress behind Build 89')
req(int(prod.get('build') or 0)>=89,'current Production authority may not regress behind Build 89')
req('release467-build89-external-acceptance-environment-isolation.json' in (pointer.get('current_release_authorities') or []),'current authority must retain Build 89 authority')

# Build 89 environment isolation remains a permanent current-runtime invariant.
for token in ('runtimeBoundary','getCommercialBridge','getProviderRunner','if(runtime.development)','runnerStatus.invoked=true','production_read_only_projection','provider_action_lane','production_execution:false','automatic_execution:false'):
 req(token in api or token in apic,f'current acceptance API lost Build 89 isolation invariant: {token}')
req('exportasyncfunctiononRequestGet' in apic,'current acceptance API must remain GET-only')
for method in ('onRequestPost','onRequestPut','onRequestPatch','onRequestDelete'):req(method not in api,f'current acceptance API gained forbidden handler {method}')
req('fetch(' not in api,'current acceptance API must not directly contact providers')
try:
 bridge_call=api.index('const bridgeResponse=await getCommercialBridge(context)'); dev_guard=api.index('if(runtime.development)'); runner_call=api.index('const runnerResponse=await getProviderRunner(context)')
 req(bridge_call < dev_guard < runner_call,'bridge-first / Development-only runner ordering drifted')
except ValueError:req(False,'Build 89 environment-isolation ordering markers missing')
for forbidden in ('INSERT INTO','UPDATE ','DELETE FROM','CREATE TABLE','ALTER TABLE','DROP TABLE'):req(forbidden not in api.upper(),f'current acceptance API contains forbidden DML/DDL: {forbidden}')
req('Release 466 Build 6' in runner and 'provider_acceptance_development_only' in runner and 'confirm_provider_test' in runner,'historical provider runner safety drifted')
req('const BUILD = 7;' in bridge,'historical commercial bridge identity drifted')

for token in ('bridge-first','Production','Development','six real acceptance dimensions','provider-synchronized','guided','HOLD_EXTERNAL','0001','0004'):req(token.lower() in doc.lower(),f'Build 89 operating document missing {token}')
req([r.get('file') for r in manifest.get('migrations',[])]==EXPECTED,'canonical migration stream drifted')
req(not list((ROOT/'migrations/canonical').glob('0005*')),'Build 89 boundary expects canonical stream still 0001-0004')
req("run_current_contract('scripts/release467_build89_gate.py', 'Release 467 Build 89')" in provenance,'System Gate no longer chains Build 89')
run(['python3','scripts/release467_build88_gate.py'],'carried Build 88 boundary')
if FAIL:
 print('RELEASE 467 BUILD 89 ENVIRONMENT ISOLATION: FAIL'); [print('-',x) for x in FAIL]; sys.exit(1)
print('RELEASE 467 BUILD 89 ENVIRONMENT ISOLATION: PASS')
print('Build 89 final Development + Production closure: RETAINED')
print('Production acceptance projection: READ-ONLY / NO PROVIDER RUNNER')
print('Development provider runner: GUARDED / OPTIONAL ENRICHMENT')
print('Canonical D1 migrations: 0001-0004 / UNCHANGED')
