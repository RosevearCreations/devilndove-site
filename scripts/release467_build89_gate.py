#!/usr/bin/env python3
"""Fail-closed source/runtime contract for Release 467 Build 89."""
from pathlib import Path
import json, re, subprocess, sys

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
    req(result.returncode==0,f"{label} failed: {(result.stderr or result.stdout).strip()[-3400:]}")
def compact(body):return re.sub(r'\s+','',body)

pointer=load('current-development-authority.json')
b88=load('release467-build88-external-acceptance-control-center.json')
b89=load('release467-build89-external-acceptance-environment-isolation.json')
manifest=load('migrations/canonical/manifest.json')
api=read('functions/api/admin/current-external-acceptance-control-center.js'); apic=compact(api)
client=read('public/js/admin-current-external-acceptance-control-center.js'); clientc=compact(client)
page=read('admin/release-control/external-acceptance/index.html')
doc=read('docs/operations/RELEASE_467_BUILD_89_EXTERNAL_ACCEPTANCE_ENVIRONMENT_ISOLATION.md')
historical_runner=read('functions/api/admin/provider-acceptance-runner.js')
historical_bridge=read('functions/api/admin/release467-external-commercial-acceptance.js')
it_api=read('functions/api/admin/it-operations-control-tower.js')
it_client=read('public/js/admin-it-control-tower.js')
it_page=read('admin/it/index.html')
reliability=read('functions/api/_lib/currentReliability.js')
reliability_page=read('admin/reliability/index.html')
preflight=read('functions/api/admin/current-deployment-preflight.js')
preflight_page=read('admin/deployment-preflight/index.html')
provenance=read('scripts/current_system_gate_provenance_gate.py')

# Build 89 current pointer over exact Build 88 closure.
req(pointer.get('release')==467 and pointer.get('build')==89,'current authority pointer must be Release 467 Build 89')
req(pointer.get('title')=='External Acceptance Environment Isolation & Guided Recovery','Build 89 current title drifted')
req(pointer.get('state')=='DEVELOPMENT_GREEN','Build 89 candidate must retain last externally verified Development GREEN state')
req(pointer.get('accepted_dev_sha')==B88_SHA and pointer.get('accepted_dev_tree_sha')==B88_TREE,'Build 89 accepted Development SHA/tree must equal Build 88 closure')
req((pointer.get('acceptance') or {})==B88_PROOFS,'Build 89 accepted Development proof set must equal Build 88')
req(pointer.get('promotion_state')=='BUILD89_CANDIDATE_NOT_YET_VERIFIED','Build 89 promotion state must remain fail-closed candidate state')
for key in ('schema_change_authorized','d1_mutation_authorized','r2_mutation_authorized','provider_execution_authorized','provider_publication_authorized','cloudflare_access_mutation_authorized','automatic_production_promotion_authorized','request_time_schema_mutation','secret_values_emitted'):
    req(pointer.get(key) is False,f'Build 89 unsafe authority flag must remain false: {key}')
restart=pointer.get('restart_integrity') or {}; last=restart.get('last_fully_verified') or {}; cand=restart.get('current_closure_candidate') or {}; prod=pointer.get('production_checkpoint') or {}
req(last.get('build')==88 and last.get('dev_sha')==B88_SHA and last.get('tree_sha')==B88_TREE,'Build 88 must be last fully verified restart checkpoint')
req((last.get('proofs') or {})==B88_PROOFS,'Build 88 restart proof set drifted')
req(cand.get('build')==89 and cand.get('authority')=='release467-build89-external-acceptance-environment-isolation.json','Build 89 restart candidate authority drifted')
req(cand.get('state')=='AWAITING_EXTERNAL_EXACT_CLOSURE_HEAD_PROOF','Build 89 must await external exact-head proof')
req(prod.get('build')==88 and prod.get('main_sha')==B88_SHA and prod.get('tree_sha')==B88_TREE,'Build 88 must be current Production baseline')
req(prod.get('production_pages_deploy_run')==B88_PAGES and prod.get('production_live_resource_integrity_run')==B88_LIVE,'Build 88 Production proof runs drifted')
req((pointer.get('current_release_authorities') or [])[:2]==['release467-build89-external-acceptance-environment-isolation.json','release467-build88-external-acceptance-control-center.json'],'authority ordering must start Build 89 then Build 88')

# Build 88 closure is immutable and Build 89 is a candidate only.
req(b88.get('state')=='PRODUCTION_GREEN','Build 88 authority must retain Production GREEN')
final88=b88.get('final_closure') or {}; prod88=b88.get('production_checkpoint') or {}
req(final88.get('dev_sha')==B88_SHA and final88.get('tree_sha')==B88_TREE and (final88.get('proofs') or {})==B88_PROOFS,'Build 88 final closure drifted')
req(prod88.get('main_sha')==B88_SHA and prod88.get('tree_sha')==B88_TREE and prod88.get('production_pages_deploy_run')==B88_PAGES and prod88.get('production_live_resource_integrity_run')==B88_LIVE,'Build 88 Production closure drifted')
req(b89.get('release')==467 and b89.get('build')==89 and b89.get('title')=='External Acceptance Environment Isolation & Guided Recovery','Build 89 authority identity drifted')
req(b89.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE','Build 89 authority must remain closure candidate')
start=(b89.get('starting_point') or {}); sd=start.get('development') or {}; sp=start.get('production') or {}
req(sd.get('sha')==B88_SHA and sd.get('tree')==B88_TREE,'Build 89 Development starting point drifted')
req(sd.get('system_gate_run')==B88_PROOFS['system_gate_run'] and sd.get('quality_run')==B88_PROOFS['current_application_quality_run'] and sd.get('it_admin_runtime_run')==B88_PROOFS['it_admin_runtime_proof_run'] and sd.get('repository_hygiene_run')==B88_PROOFS['branch_hygiene_run'],'Build 89 starting proof set drifted')
req(sp.get('main_sha')==B88_SHA and sp.get('tree_sha')==B88_TREE and sp.get('production_pages_deploy_run')==B88_PAGES and sp.get('production_live_resource_integrity_run')==B88_LIVE,'Build 89 Production starting point drifted')
req((b89.get('closure_policy') or {}).get('candidate_must_not_self_claim_final_proof') is True,'Build 89 candidate must not self-claim proof')
req((b89.get('closure_policy') or {}).get('final_closure') is None,'Build 89 authority must not contain premature final closure')

# Current status projection is bridge-first and Production-safe.
for token in ("const BUILD = 89;","const TITLE = 'External Acceptance Environment Isolation & Guided Recovery';",'runtimeBoundary','getCommercialBridge','getProviderRunner',"if(runtime.development)",'runnerStatus.invoked=true','runnerStatus.available=true','runner=null','checks.length===6','next_action','paymentNextAction','production_read_only_projection','production_execution:false','automatic_execution:false','secret_values_emitted:false'):
    req(token in api or token in apic,f'Build 89 current acceptance API missing token: {token}')
req('exportasyncfunctiononRequestGet' in apic,'Build 89 current acceptance API must expose GET')
for method in ('onRequestPost','onRequestPut','onRequestPatch','onRequestDelete'):req(method not in api,f'Build 89 current acceptance API must remain GET-only ({method} found)')
req('fetch(' not in api,'Build 89 current acceptance API must not directly contact providers')
for forbidden in ('INSERT INTO','UPDATE ','DELETE FROM','CREATE TABLE','ALTER TABLE','DROP TABLE'):
    req(forbidden not in api.upper(),f'Build 89 current status API contains forbidden DML/DDL: {forbidden}')
try:
    bridge_call=api.index('const bridgeResponse=await getCommercialBridge(context)')
    dev_guard=api.index('if(runtime.development)')
    runner_call=api.index('const runnerResponse=await getProviderRunner(context)')
    req(bridge_call < dev_guard < runner_call,'Build 89 must resolve bridge first and invoke provider runner only inside Development guard')
except ValueError:
    req(False,'Build 89 environment-isolation ordering markers missing')
req("runtime.production?'production_read_only_projection'" in apic,'Build 89 must explicitly expose Production read-only action-lane state')

# Browser fails closed outside Development and provides guided recovery.
for token in ('Release 467 Build 89','nextAction','provider_action_lane?.available','Provider acceptance actions are available only on the canonical Development environment',"action:'refresh_evidence'","action:'prepare_checkout'","action:'refund_latest'",'window.confirm','confirm_provider_test:true','guarded action lane available'):
    req(token in client,f'Build 89 client missing token: {token}')
req('setInterval(' not in client,'Build 89 current acceptance client must not poll')
req('api.stripe.com' not in client and 'api-m.paypal.com' not in client and 'api-m.sandbox.paypal.com' not in client,'Build 89 client must not call provider APIs directly')
req(client.count("method:'POST'")>=1,'Build 89 client must retain explicit guarded Development action POST path')

# Current operator pages and current truth surfaces all use Build 89 over Build 88 proof.
for token in ('Release 467 Build 89','Environment boundary',B88_SHA,B88_TREE,str(B88_PAGES),str(B88_LIVE),'Production is a read-only status surface','/public/js/admin-current-external-acceptance-control-center.js?v=467b89'):
    req(token in page,f'Build 89 current acceptance page missing token: {token}')
req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,'Build 89 current acceptance page must contain exactly one H1')
for text,label in ((it_api,'I.T. API'),(reliability,'Reliability'),(preflight,'Deployment Preflight')):
    req(B88_SHA in text and B88_TREE in text,f'{label} missing Build 88 verified SHA/tree')
    req(str(B88_PAGES) in text and str(B88_LIVE) in text,f'{label} missing Build 88 Production proof')
req('const BUILD = 89;' in it_api,'I.T. API must identify Build 89')
req('CURRENT_RELIABILITY_BUILD = 89' in reliability,'Reliability must identify Build 89')
req('const BUILD = 89;' in preflight,'Deployment Preflight must identify Build 89')
req('Release 467 Build 89' in it_client and 'Release 467 Build 89' in it_page,'I.T. current surfaces must identify Build 89')
req('Release 467 • Build 89' in reliability_page,'Reliability page must identify Build 89')
req('Release 467 Build 89' in preflight_page,'Deployment Preflight page must identify Build 89')

# Human/restart surfaces carry exact Build 88 external closure.
for path in ('AI_HANDOFF.md','PROJECT_STATUS_AND_ROADMAP.md','SANITY_HEALTH_CHECK.md','MARKDOWN_INDEX.md','docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md'):
    body=read(path)
    for token in (B88_SHA,B88_TREE,str(B88_PROOFS['system_gate_run']),str(B88_PROOFS['current_application_quality_run']),str(B88_PROOFS['it_admin_runtime_proof_run']),str(B88_PROOFS['branch_hygiene_run']),str(B88_PAGES),str(B88_LIVE)):
        req(token in body,f'{path} missing Build 88 verified token: {token}')
    req('Build 89' in body,f'{path} must identify Build 89 current candidate')

# Historical action/evidence engines remain untouched in identity and fail-closed behavior.
req('Release 466 Build 6' in historical_runner,'Historical provider runner identity drifted')
req("const BUILD = 7;" in historical_bridge,'Historical Build 7 bridge identity drifted')
req('provider_acceptance_development_only' in historical_runner,'Historical provider runner lost Development-only boundary')
req('confirm_provider_test' in historical_runner,'Historical provider runner lost explicit provider confirmation')

for token in ('bridge-first','Production','does **not** invoke','Development','runner is unavailable','six real acceptance dimensions','provider-synchronized','guided','Historical Build 6/7','HOLD_EXTERNAL','0001','0004'):
    req(token.lower() in doc.lower(),f'Build 89 operating document missing token: {token}')
req([row.get('file') for row in manifest.get('migrations',[])]==EXPECTED,'Build 89 must keep canonical migrations exactly 0001-0004')
req(not list((ROOT/'migrations/canonical').glob('0005*')),'Build 89 must remain schema-neutral')
req("run_current_contract('scripts/release467_build89_gate.py', 'Release 467 Build 89')" in provenance,'Current System Gate does not chain Build 89')

for path in ('functions/api/admin/current-external-acceptance-control-center.js','public/js/admin-current-external-acceptance-control-center.js','functions/api/admin/it-operations-control-tower.js','public/js/admin-it-control-tower.js','functions/api/_lib/currentReliability.js','functions/api/admin/current-deployment-preflight.js'):
    run(['node','--check',path],f'JavaScript syntax {path}')
run(['python3','scripts/current_it_release_truth_gate.py'],'current I.T. release truth')
run(['python3','scripts/current_authority_restart_integrity_gate.py'],'current restart integrity')
run(['python3','scripts/current_reliability_truth_gate.py'],'current Reliability truth')
run(['python3','scripts/current_deployment_preflight_truth_gate.py'],'current Deployment Preflight truth')
run(['python3','scripts/release467_build88_gate.py'],'carried Build 88 boundary')

if FAIL:
    print('RELEASE 467 BUILD 89 EXTERNAL ACCEPTANCE ENVIRONMENT ISOLATION: FAIL')
    for item in FAIL:print('-',item)
    sys.exit(1)
print('RELEASE 467 BUILD 89 EXTERNAL ACCEPTANCE ENVIRONMENT ISOLATION: PASS')
print('Production acceptance projection: READ-ONLY / NO PROVIDER RUNNER')
print('Development provider runner: GUARDED / OPTIONAL ENRICHMENT')
print('Runner failure behavior: READ-ONLY BRIDGE FALLBACK')
print('Stripe/PayPal evidence: SIX DIMENSIONS EACH / GUIDED NEXT STEP')
print('Automatic / Production provider execution: CLOSED')
print('Canonical D1 migrations: 0001-0004 / UNCHANGED')
