#!/usr/bin/env python3
"""Fail-closed source/runtime contract for Release 467 Build 86."""
from pathlib import Path
import json
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
FAIL = []

def read(path):
    target = ROOT / path
    if not target.is_file():
        FAIL.append(f'missing required file: {path}')
        return ''
    return target.read_text(encoding='utf-8', errors='replace')

def load(path):
    try:
        return json.loads(read(path) or '{}')
    except json.JSONDecodeError as exc:
        FAIL.append(f'invalid JSON {path}: {exc}')
        return {}

def req(ok,message):
    if not ok:
        FAIL.append(message)

def run(command,label):
    result=subprocess.run(command,cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=False)
    if result.stdout.strip(): print(result.stdout.strip())
    req(result.returncode==0,f"{label} failed: {(result.stderr or result.stdout).strip()[-3000:]}")

pure=read('functions/api/_lib/itOperationsSelfDiagnostics.js')
endpoint=read('functions/api/admin/it-self-diagnostics.js')
tower=read('functions/api/admin/it-operations-control-tower.js')
client=read('public/js/admin-it-control-tower.js')
page=read('admin/it/index.html')
css=read('css/admin-it-self-diagnostics-v86.css')
reliability=read('functions/api/_lib/currentReliability.js')
reliability_page=read('admin/reliability/index.html')
preflight=read('functions/api/admin/current-deployment-preflight.js')
preflight_page=read('admin/deployment-preflight/index.html')
doc=read('docs/operations/RELEASE_467_BUILD_86_IT_OPERATIONS_SELF_DIAGNOSTICS.md')
provenance=read('scripts/current_system_gate_provenance_gate.py')
pointer=load('current-development-authority.json')
b85=load('release467-build85-socials-oauth-acceptance.json')
b86=load('release467-build86-it-operations-self-diagnostics.json')
manifest=load('migrations/canonical/manifest.json')

# Pure eight-domain diagnostic projection.
for token in (
    "'deployment'", "'bindings'", "'schema'", "'runtime'", "'module_authority'", "'providers'", "'release_gates'", "'backup_recovery'",
    'read_only_projection: true','secret_values_emitted: false','request_time_schema_mutation: false','d1_mutation: false','r2_mutation: false',
    'binding_mutation: false','deployment_execution: false','backup_restore_execution: false','provider_execution: false','provider_publication: false',
    'automatic_repair: false','production_business_data_overwrite: false',
    "overall_status: overall", "technical_blocker_count", "external_hold_count"
): req(token in pure,f'Build 86 pure diagnostic contract missing token: {token}')
for forbidden in (r'\bfetch\s*\(',r'\blocalStorage\.',r'\bsessionStorage\.',r'\bsetInterval\s*\(',r'\bXMLHttpRequest\b'):
    req(not re.search(forbidden,pure),f'Build 86 pure diagnostic gained forbidden behavior: {forbidden}')

# Current read-only API uses existing evidence only.
for token in (
    'getAdminUserFromRequest','getDb','deriveItOperationsSelfDiagnostics','encryptionKeyConfigured','oauthAcceptanceProvider',
    'd1_migrations','app_schema_migration_proofs','PRAGMA foreign_key_check','runtime_incidents','app_modules','app_module_user_access',
    "item_key='backup_migrate_deploy'", "acceptance_state:'HOLD_EXTERNAL'", 'production_authorization_open:false','provider_publication:false',
    'secret_values_emitted:false','provider_contacted:false','automatic_repair:false','request_time_schema_mutation:false','production_business_data_overwrite:false'
): req(token in endpoint,f'Build 86 read-only endpoint missing token: {token}')
req('export async function onRequestGet' in endpoint,'Build 86 self-diagnostics endpoint must expose GET')
for method in ('onRequestPost','onRequestPut','onRequestPatch','onRequestDelete'):
    req(method not in endpoint,f'Build 86 self-diagnostics endpoint must remain GET-only ({method} found)')
req('fetch(' not in endpoint,'Build 86 self-diagnostics endpoint must not contact providers/network')
req('decryptOAuthSecret' not in endpoint,'Build 86 self-diagnostics must not decrypt OAuth token material')
for forbidden in ('INSERT INTO','UPDATE ','DELETE FROM','CREATE TABLE','ALTER TABLE','DROP TABLE','CREATE INDEX','DROP INDEX','CREATE TRIGGER','DROP TRIGGER'):
    req(forbidden not in endpoint.upper(),f'Build 86 endpoint contains forbidden DML/DDL token: {forbidden}')

# Current I.T. control centre and UI identity.
for token in (
    'const BUILD = 86;', "const TITLE = 'I.T. Operations & Self-Diagnostics';", 'getSelfDiagnostics',
    '33dc9857e1fada5549181a28ce4ef26c4a919572','b2c6b80401241f1757cd172511d12f9d813bc817',
    '34386667094','34386667361','34386667111','34386667194','34386848470','34386976511',
    'self_diagnostics:self','automatic_repair:false','provider_execution:false','provider_publication:false'
): req(token in tower,f'Build 86 current I.T. control tower missing token: {token}')
req('onRequestPost' not in tower,'Build 86 current I.T. control tower must remain read-only')
for token in ('Release 467 Build 86','/api/admin/it-operations-control-tower','Production GREEN authority','External acceptance policy','Current diagnostic domains','Corrective instructions'):
    req(token in client,f'Build 86 I.T. browser layer missing token: {token}')
req("method:'POST'" not in client and "method: 'POST'" not in client,'Build 86 I.T. client must not POST')
req('setInterval(' not in client,'Build 86 I.T. client must not poll')
req('Release 467 Build 86' in page,'Build 86 I.T. page identity missing')
req('/css/admin-it-self-diagnostics-v86.css' in page,'Build 86 I.T. CSS not loaded')
req('/public/js/admin-it-control-tower.js?v=467b86' in page,'Build 86 I.T. client cache identity missing')
req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,'Build 86 I.T. page must retain exactly one H1')
for token in ('.it-v86-summary','.it-v86-domains','@media(max-width:900px)','@media(max-width:560px)'):
    req(token in css,f'Build 86 responsive I.T. CSS missing token: {token}')

# Authority pointer: Build 85 verified, Build 86 candidate.
req(pointer.get('release')==467 and pointer.get('build')==86,'current authority pointer must be Release 467 Build 86')
req(pointer.get('state')=='DEVELOPMENT_GREEN','current pointer must retain last verified Development GREEN state')
last=(pointer.get('restart_integrity') or {}).get('last_fully_verified') or {}
prod=pointer.get('production_checkpoint') or {}
req(last.get('build')==85,'Build 85 must be the last fully verified restart checkpoint')
req(last.get('dev_sha')=='33dc9857e1fada5549181a28ce4ef26c4a919572','Build 85 verified SHA drifted')
req(last.get('tree_sha')=='b2c6b80401241f1757cd172511d12f9d813bc817','Build 85 verified tree drifted')
expected_proofs={'system_gate_run':34386667094,'current_application_quality_run':34386667361,'it_admin_runtime_proof_run':34386667111,'branch_hygiene_run':34386667194}
req((last.get('proofs') or {})==expected_proofs,'Build 85 verified proof set drifted')
req(prod.get('build')==85 and prod.get('main_sha')=='33dc9857e1fada5549181a28ce4ef26c4a919572','Build 85 Production pointer drifted')
req(prod.get('tree_sha')=='b2c6b80401241f1757cd172511d12f9d813bc817','Build 85 Production tree drifted')
req(prod.get('production_pages_deploy_run')==34386848470,'Build 85 Production Pages run drifted')
req(prod.get('production_live_resource_integrity_run')==34386976511,'Build 85 live-resource run drifted')
req((pointer.get('current_release_authorities') or [])[:2]==['release467-build86-it-operations-self-diagnostics.json','release467-build85-socials-oauth-acceptance.json'],'current authority ordering must start Build 86 candidate -> Build 85 verified')
req(b85.get('state')=='PRODUCTION_GREEN' and (b85.get('final_closure') or {}).get('dev_sha')==last.get('dev_sha'),'Build 85 final authority missing verified closure')
req((b85.get('production_checkpoint') or {}).get('production_pages_deploy_run')==34386848470,'Build 85 authority missing Production closure')
req(b86.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE','Build 86 authority must remain a closure candidate')
req(((b86.get('closure_policy') or {}).get('candidate_must_not_self_claim_final_proof')) is True,'Build 86 candidate must not self-claim proof')
req((b86.get('closure_policy') or {}).get('final_closure') is None,'Build 86 authority must not contain premature final closure')

# Current Reliability + Deployment Preflight must converge to the same truth.
for token in ('CURRENT_RELIABILITY_BUILD = 86','33dc9857e1fada5549181a28ce4ef26c4a919572','b2c6b80401241f1757cd172511d12f9d813bc817','34386667094','34386667361','34386667111','34386667194','34386848470','34386976511',"mutation_capability:'none'"):
    req(token in reliability,f'Build 86 current Reliability missing token: {token}')
req('Release 467 • Build 86' in reliability_page,'Build 86 Reliability page identity missing')
for token in ('const BUILD = 86;','33dc9857e1fada5549181a28ce4ef26c4a919572','b2c6b80401241f1757cd172511d12f9d813bc817','34386667094','34386667361','34386667111','34386667194','34386848470','34386976511',"mutation_capability:'none'",'migrations/canonical/manifest.json','scripts/d1_migrate.py'):
    req(token in preflight,f'Build 86 current Deployment Preflight missing token: {token}')
req('Release 467 Build 86' in preflight_page,'Build 86 Deployment Preflight page identity missing')

# Human restart surfaces must carry exact Build 85 proof.
for path in ('AI_HANDOFF.md','PROJECT_STATUS_AND_ROADMAP.md','SANITY_HEALTH_CHECK.md','MARKDOWN_INDEX.md','docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md'):
    body=read(path)
    for token in ('33dc9857e1fada5549181a28ce4ef26c4a919572','b2c6b80401241f1757cd172511d12f9d813bc817','34386667094','34386667361','34386667111','34386667194','34386848470'):
        req(token in body,f'{path} missing Build 85 verified restart token: {token}')

for token in ('eight diagnostic domains','automatic repair','HOLD_EXTERNAL','0001_release464_migration_authority.sql','0004_release465_storefront_quality.sql','No Build 87 scope has been started'):
    req(token.lower() in doc.lower(),f'Build 86 operating document missing token: {token}')

expected=[
 '0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql'
]
req([row.get('file') for row in manifest.get('migrations',[])]==expected,'Build 86 must keep canonical migrations 0001-0004 exactly')
req(not list((ROOT/'migrations/canonical').glob('0005*')),'Build 86 must remain schema-neutral')
req("run_current_contract('scripts/release467_build86_gate.py', 'Release 467 Build 86')" in provenance,'Current System Gate does not chain Build 86')

for path in ('functions/api/_lib/itOperationsSelfDiagnostics.js','functions/api/admin/it-self-diagnostics.js','functions/api/admin/it-operations-control-tower.js','public/js/admin-it-control-tower.js','functions/api/_lib/currentReliability.js','functions/api/admin/current-deployment-preflight.js'):
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
print('Diagnostic domains: 8 / READ-ONLY')
print('Authority pointer: BUILD 86 CANDIDATE / BUILD 85 VERIFIED')
print('Automatic repair / D1 / R2 / provider / restore execution: NONE')
print('Canonical D1 migrations: 0001-0004 / UNCHANGED')
