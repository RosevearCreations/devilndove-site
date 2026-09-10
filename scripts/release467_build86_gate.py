#!/usr/bin/env python3
"""Retained fail-closed contract for Release 467 Build 86 — I.T. Operations & Self-Diagnostics."""
from pathlib import Path
import json, re, subprocess, sys

ROOT = Path(__file__).resolve().parents[1]
FAIL = []

def read(path):
    target=ROOT/path
    if not target.is_file(): FAIL.append(f'missing required file: {path}'); return ''
    return target.read_text(encoding='utf-8',errors='replace')
def load(path):
    try: return json.loads(read(path) or '{}')
    except json.JSONDecodeError as exc: FAIL.append(f'invalid JSON {path}: {exc}'); return {}
def req(ok,message):
    if not ok: FAIL.append(message)
def run(command,label):
    result=subprocess.run(command,cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=False)
    if result.stdout.strip(): print(result.stdout.strip())
    req(result.returncode==0,f"{label} failed: {(result.stderr or result.stdout).strip()[-3000:]}")
def compact(body): return re.sub(r'\s+','',body)

pure=read('functions/api/_lib/itOperationsSelfDiagnostics.js'); purec=compact(pure)
endpoint=read('functions/api/admin/it-self-diagnostics.js'); endpointc=compact(endpoint)
tower=read('functions/api/admin/it-operations-control-tower.js'); towerc=compact(tower)
page=read('admin/it/index.html')
css=read('css/admin-it-self-diagnostics-v86.css')
doc=read('docs/operations/RELEASE_467_BUILD_86_IT_OPERATIONS_SELF_DIAGNOSTICS.md')
provenance=read('scripts/current_system_gate_provenance_gate.py')
pointer=load('current-development-authority.json')
b86=load('release467-build86-it-operations-self-diagnostics.json')
manifest=load('migrations/canonical/manifest.json')

# Build 86 implementation must remain the eight-domain, read-only diagnostic authority.
for token in ("'deployment'","'bindings'","'schema'","'runtime'","'module_authority'","'providers'","'release_gates'","'backup_recovery'",'read_only_projection:true','secret_values_emitted:false','request_time_schema_mutation:false','d1_mutation:false','r2_mutation:false','binding_mutation:false','deployment_execution:false','backup_restore_execution:false','provider_execution:false','provider_publication:false','automatic_repair:false','production_business_data_overwrite:false','overall_status:overall','technical_blocker_count','external_hold_count'):
    req(token in purec,f'Build 86 pure diagnostic contract missing token: {token}')
for forbidden in (r'\bfetch\s*\(',r'\blocalStorage\.',r'\bsessionStorage\.',r'\bsetInterval\s*\(',r'\bXMLHttpRequest\b'):
    req(not re.search(forbidden,pure),f'Build 86 pure diagnostic gained forbidden behavior: {forbidden}')

for token in ('getAdminUserFromRequest','getDb','deriveItOperationsSelfDiagnostics','encryptionKeyConfigured','oauthAcceptanceProvider','d1_migrations','app_schema_migration_proofs','PRAGMAforeign_key_check','runtime_incidents','app_modules','app_module_user_access',"item_key='backup_migrate_deploy'","acceptance_state:'HOLD_EXTERNAL'",'production_authorization_open:false','provider_publication:false','secret_values_emitted:false','provider_contacted:false','automatic_repair:false','request_time_schema_mutation:false','production_business_data_overwrite:false'):
    req(token in endpointc,f'Build 86 read-only endpoint missing token: {token}')
req('exportasyncfunctiononRequestGet' in endpointc,'Build 86 self-diagnostics endpoint must expose GET')
for method in ('onRequestPost','onRequestPut','onRequestPatch','onRequestDelete'): req(method not in endpoint,f'Build 86 self-diagnostics endpoint must remain GET-only ({method} found)')
req('fetch(' not in endpoint,'Build 86 self-diagnostics endpoint must not contact providers/network')
req('decryptOAuthSecret' not in endpoint,'Build 86 self-diagnostics must not decrypt OAuth token material')
for forbidden in ('INSERT INTO','UPDATE ','DELETE FROM','CREATE TABLE','ALTER TABLE','DROP TABLE','CREATE INDEX','DROP INDEX','CREATE TRIGGER','DROP TRIGGER'):
    req(forbidden not in endpoint.upper(),f'Build 86 endpoint contains forbidden DML/DDL token: {forbidden}')

# The current control tower may advance, but it must continue to consume Build 86 self-diagnostics read-only.
for token in ('getSelfDiagnostics','self_diagnostics:self','automatic_repair:false','provider_execution:false','provider_publication:false'):
    req(token in towerc,f'Current I.T. control tower lost carried Build 86 diagnostic token: {token}')
req('onRequestPost' not in tower,'Current I.T. control tower must remain read-only')
req('itControlTowerMount' in page,'Current I.T. page must retain the control-tower mount')
req('/css/admin-it-self-diagnostics-v86.css' in page,'Build 86 diagnostic CSS must remain loaded')
req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,'Current I.T. page must retain exactly one H1')
for token in ('.it-v86-summary','.it-v86-domains','@media(max-width:900px)','@media(max-width:560px)'): req(token in css,f'Build 86 responsive I.T. CSS missing token: {token}')

# Build 86 final external closure is immutable historical evidence.
B86_SHA='5fdbb5346e52f17072671274dc36e4d3527a7905'
B86_TREE='f9037baf12bc3489b3a0df3df03eef5bdbe85e90'
B86_PROOFS={'system_gate_run':34419070653,'current_application_quality_run':34419070636,'it_admin_runtime_proof_run':34419070642,'branch_hygiene_run':34419070660}
req(b86.get('release')==467 and b86.get('build')==86,'Build 86 authority identity drifted')
req(b86.get('state')=='PRODUCTION_GREEN','Build 86 authority must retain PRODUCTION_GREEN closure')
final=b86.get('final_closure') or {}; prod86=b86.get('production_checkpoint') or {}
req(final.get('dev_sha')==B86_SHA,'Build 86 final closure SHA drifted')
req(final.get('tree_sha')==B86_TREE,'Build 86 final closure tree drifted')
req((final.get('proofs') or {})==B86_PROOFS,'Build 86 final four-proof set drifted')
req(final.get('proof_state')=='EXACT_BRANCH_HEAD_FOUR_PROOF_GREEN','Build 86 final proof state drifted')
for key in ('exact_preview_deployment','canonical_development_d1_proof','development_data_authority_read_only','preview_bindings_proof','non_secret_preview_smoke'):
    req(final.get(key) is True,f'Build 86 final closure missing {key}')
req(prod86.get('build')==86 and prod86.get('main_sha')==B86_SHA,'Build 86 Production SHA drifted')
req(prod86.get('tree_sha')==B86_TREE,'Build 86 Production tree drifted')
req(prod86.get('production_pages_deploy_run')==34419211512,'Build 86 Production Pages run drifted')
req(prod86.get('production_live_resource_integrity_run')==34419284027,'Build 86 live-resource run drifted')
req(prod86.get('state')=='PRODUCTION_GREEN','Build 86 Production checkpoint must remain GREEN')

# Later pointers may advance, but never behind the verified Build 86 closure.
req(pointer.get('release')==467 and int(pointer.get('build') or 0)>=87,'current authority must be Release 467 Build 87 or newer after Build 86 closure ingestion')
last=(pointer.get('restart_integrity') or {}).get('last_fully_verified') or {}; prod=pointer.get('production_checkpoint') or {}
req(int(last.get('build') or 0)>=86,'current restart authority may not regress behind verified Build 86')
req(int(prod.get('build') or 0)>=86,'current Production authority may not regress behind Build 86')
req('release467-build86-it-operations-self-diagnostics.json' in (pointer.get('current_release_authorities') or []),'current authority must retain Build 86 historical authority')

for token in ('eight diagnostic domains','automatic repair','HOLD_EXTERNAL','0001_release464_migration_authority.sql','0004_release465_storefront_quality.sql'):
    req(token.lower() in doc.lower(),f'Build 86 operating document missing token: {token}')
expected=['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql']
req([row.get('file') for row in manifest.get('migrations',[])]==expected,'Build 86 must keep canonical migrations 0001-0004 exactly')
req(not list((ROOT/'migrations/canonical').glob('0005*')),'Build 86 historical boundary expects no later canonical migration yet')
req("run_current_contract('scripts/release467_build86_gate.py', 'Release 467 Build 86')" in provenance,'Current System Gate does not chain Build 86')

for path in ('functions/api/_lib/itOperationsSelfDiagnostics.js','functions/api/admin/it-self-diagnostics.js','functions/api/admin/it-operations-control-tower.js'):
    run(['node','--check',path],f'JavaScript syntax {path}')
run(['node','scripts/release467_build86_it_self_diagnostics_runtime_test.mjs'],'Build 86 runtime proof')
run(['python3','scripts/current_it_release_truth_gate.py'],'current I.T. release truth')
run(['python3','scripts/current_authority_restart_integrity_gate.py'],'current restart integrity')
run(['python3','scripts/current_reliability_truth_gate.py'],'current Reliability truth')
run(['python3','scripts/current_deployment_preflight_truth_gate.py'],'current Deployment Preflight truth')
run(['python3','scripts/release467_build85_gate.py'],'carried Build 85 boundary')

if FAIL:
    print('RELEASE 467 BUILD 86 I.T. OPERATIONS & SELF-DIAGNOSTICS: FAIL')
    for item in FAIL: print('-',item)
    sys.exit(1)
print('RELEASE 467 BUILD 86 I.T. OPERATIONS & SELF-DIAGNOSTICS: PASS')
print('Historical feature authority: EIGHT-DOMAIN READ-ONLY DIAGNOSTICS')
print('Build 86 final Development + Production closure: RETAINED')
print('Automatic repair / D1 / R2 / provider / restore execution: NONE')
print('Canonical D1 migrations: 0001-0004 / UNCHANGED')
