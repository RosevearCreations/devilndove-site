#!/usr/bin/env python3
"""Fail-closed source/runtime contract for Release 467 Build 88."""
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
    req(result.returncode==0,f"{label} failed: {(result.stderr or result.stdout).strip()[-3200:]}")
def compact(body):return re.sub(r'\s+','',body)

pointer=load('current-development-authority.json')
b87=load('release467-build87-production-authority-restart-convergence.json')
b88=load('release467-build88-external-acceptance-control-center.json')
manifest=load('migrations/canonical/manifest.json')
api=read('functions/api/admin/current-external-acceptance-control-center.js'); apic=compact(api)
client=read('public/js/admin-current-external-acceptance-control-center.js'); clientc=compact(client)
page=read('admin/release-control/external-acceptance/index.html')
css=read('css/admin-external-acceptance-v88.css')
historical_runner=read('functions/api/admin/provider-acceptance-runner.js')
historical_bridge=read('functions/api/admin/release467-external-commercial-acceptance.js')
historical_client=read('public/js/admin-provider-acceptance-runner.js')
historical_page=read('admin/release-control/external-commercial-readiness/index.html')
stripe_doc=read('docs/operations/RELEASE_467_BUILD_79_STRIPE_DEVELOPMENT_PREPARATION.md')
paypal_doc=read('docs/operations/RELEASE_467_BUILD_80_PAYPAL_SANDBOX_PREPARATION.md')
doc=read('docs/operations/RELEASE_467_BUILD_88_EXTERNAL_ACCEPTANCE_CONTROL_CENTER.md')
it_api=read('functions/api/admin/it-operations-control-tower.js')
it_page=read('admin/it/index.html')
reliability=read('functions/api/_lib/currentReliability.js')
reliability_page=read('admin/reliability/index.html')
preflight=read('functions/api/admin/current-deployment-preflight.js')
preflight_page=read('admin/deployment-preflight/index.html')
provenance=read('scripts/current_system_gate_provenance_gate.py')

# Current machine authority: Build 88 candidate over exact Build 87 proof.
req(pointer.get('release')==467 and pointer.get('build')==88,'current authority pointer must be Release 467 Build 88')
req(pointer.get('title')=='External Acceptance Control Center Convergence','Build 88 current title drifted')
req(pointer.get('state')=='DEVELOPMENT_GREEN','Build 88 candidate must retain last externally verified Development GREEN state')
req(pointer.get('accepted_dev_sha')==B87_SHA and pointer.get('accepted_dev_tree_sha')==B87_TREE,'Build 88 accepted Development SHA/tree must equal Build 87 closure')
req((pointer.get('acceptance') or {})==B87_PROOFS,'Build 88 accepted Development proof set must equal Build 87')
req(pointer.get('promotion_state')=='BUILD88_CANDIDATE_NOT_YET_VERIFIED','Build 88 promotion state must remain fail-closed candidate state')
for key in ('schema_change_authorized','d1_mutation_authorized','r2_mutation_authorized','provider_execution_authorized','provider_publication_authorized','cloudflare_access_mutation_authorized','automatic_production_promotion_authorized','request_time_schema_mutation','secret_values_emitted'):
    req(pointer.get(key) is False,f'Build 88 unsafe authority flag must remain false: {key}')
restart=pointer.get('restart_integrity') or {}; last=restart.get('last_fully_verified') or {}; cand=restart.get('current_closure_candidate') or {}; prod=pointer.get('production_checkpoint') or {}
req(last.get('build')==87 and last.get('dev_sha')==B87_SHA and last.get('tree_sha')==B87_TREE,'Build 87 must be last fully verified restart checkpoint')
req((last.get('proofs') or {})==B87_PROOFS,'Build 87 restart proof set drifted')
req(cand.get('build')==88 and cand.get('authority')=='release467-build88-external-acceptance-control-center.json','Build 88 restart candidate authority drifted')
req(cand.get('state')=='AWAITING_EXTERNAL_EXACT_CLOSURE_HEAD_PROOF','Build 88 must await external exact-head proof')
req(prod.get('build')==87 and prod.get('main_sha')==B87_SHA and prod.get('tree_sha')==B87_TREE,'Build 87 must be current Production baseline')
req(prod.get('production_pages_deploy_run')==B87_PAGES and prod.get('production_live_resource_integrity_run')==B87_LIVE,'Build 87 Production proof runs drifted')
req((pointer.get('current_release_authorities') or [])[:2]==['release467-build88-external-acceptance-control-center.json','release467-build87-production-authority-restart-convergence.json'],'authority ordering must start Build 88 then Build 87')
external=pointer.get('external_lanes') or {}
for key in ('stripe_development','paypal_sandbox','social_oauth','cloudflare_access_service_token'):
    req(str(external.get(key) or '').startswith('HOLD_EXTERNAL'),f'{key} must remain HOLD_EXTERNAL')
req(external.get('caip_private_media')=='EVIDENCE_DEPENDENT','CAIP private-media must remain EVIDENCE_DEPENDENT')

# Build 87 is immutable closure; Build 88 remains candidate.
req(b87.get('state')=='PRODUCTION_GREEN','Build 87 authority must retain Production GREEN')
final87=b87.get('final_closure') or {}; prod87=b87.get('production_checkpoint') or {}
req(final87.get('dev_sha')==B87_SHA and final87.get('tree_sha')==B87_TREE and (final87.get('proofs') or {})==B87_PROOFS,'Build 87 final closure drifted')
req(prod87.get('main_sha')==B87_SHA and prod87.get('tree_sha')==B87_TREE and prod87.get('production_pages_deploy_run')==B87_PAGES and prod87.get('production_live_resource_integrity_run')==B87_LIVE,'Build 87 Production closure drifted')
req(b88.get('release')==467 and b88.get('build')==88 and b88.get('title')=='External Acceptance Control Center Convergence','Build 88 authority identity drifted')
req(b88.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE','Build 88 authority must remain closure candidate')
start=(b88.get('starting_point') or {}); sd=start.get('development') or {}; sp=start.get('production') or {}
req(sd.get('sha')==B87_SHA and sd.get('tree')==B87_TREE,'Build 88 Development starting point drifted')
req(sd.get('system_gate_run')==B87_PROOFS['system_gate_run'] and sd.get('quality_run')==B87_PROOFS['current_application_quality_run'] and sd.get('it_admin_runtime_run')==B87_PROOFS['it_admin_runtime_proof_run'] and sd.get('repository_hygiene_run')==B87_PROOFS['branch_hygiene_run'],'Build 88 starting proof set drifted')
req(sp.get('main_sha')==B87_SHA and sp.get('tree_sha')==B87_TREE and sp.get('production_pages_deploy_run')==B87_PAGES and sp.get('production_live_resource_integrity_run')==B87_LIVE,'Build 88 Production starting point drifted')
req(((b88.get('closure_policy') or {}).get('candidate_must_not_self_claim_final_proof')) is True,'Build 88 candidate must not self-claim proof')
req((b88.get('closure_policy') or {}).get('final_closure') is None,'Build 88 authority must not contain premature final closure')

# Current external acceptance API is GET-only and normalizes five lanes / six payment dimensions.
for token in ("const BUILD = 88;","const TITLE = 'External Acceptance Control Center Convergence';",'getCommercialBridge','getProviderRunner',"checks.length===6",'refund_accepted','provider-synchronized','stripe_development','paypal_sandbox','caip_private_media','social_oauth','cloudflare_access_service_token',"endpoint:'/api/admin/provider-acceptance-runner'","automatic_execution:false","production_execution:false","secret_values_emitted:false"):
    req(token in api or token in apic,f'Build 88 current acceptance API missing token: {token}')
req('exportasyncfunctiononRequestGet' in apic,'Build 88 current acceptance API must expose GET')
for method in ('onRequestPost','onRequestPut','onRequestPatch','onRequestDelete'):req(method not in api,f'Build 88 current acceptance API must remain GET-only ({method} found)')
req('fetch(' not in api,'Build 88 current acceptance API must not directly contact providers')
for forbidden in ('INSERT INTO','UPDATE ','DELETE FROM','CREATE TABLE','ALTER TABLE','DROP TABLE'):
    req(forbidden not in api.upper(),f'Build 88 current status API contains forbidden DML/DDL: {forbidden}')

# Current browser may POST only on explicit operator actions through retained runner.
for token in ("'/api/admin/current-external-acceptance-control-center'","'/api/admin/provider-acceptance-runner'","action:'refresh_evidence'","action:'prepare_checkout'","action:'refund_latest'",'window.confirm','confirm_provider_test:true','provider-synchronized test refund','Release 467 Build 88'):
    req(token in client,f'Build 88 client missing token: {token}')
req('setInterval(' not in client,'Build 88 current acceptance client must not poll')
req('api.stripe.com' not in client and 'api-m.paypal.com' not in client and 'api-m.sandbox.paypal.com' not in client,'Build 88 client must not call provider APIs directly')
req(client.count("method:'POST'")>=1,'Build 88 client must retain explicit guarded action POST path')

# Current page is current release identity; historical page remains historical.
for token in ('Release 467 Build 88','External Acceptance Control Center','646d73710784008617157cf5746a66f053daba83','709f802cf7ca24a12f48bd7c8b562a92b306fcae','/css/admin-external-acceptance-v88.css?v=467b88','/public/js/admin-current-external-acceptance-control-center.js?v=467b88','Production provider execution remains closed'):
    req(token in page,f'Build 88 page missing token: {token}')
req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,'Build 88 current acceptance page must contain exactly one H1')
for token in ('.ext-v88-grid','.ext-v88-summary','@media(max-width:900px)','@media(max-width:560px)'):req(token in css,f'Build 88 responsive CSS missing token: {token}')
req('Release 466 Build 6' in historical_runner,'Historical provider runner identity drifted')
req('const BUILD = 7;' in historical_bridge,'Historical Build 7 bridge identity drifted')
req('Build 6 runner:' in historical_client,'Historical provider runner client identity drifted')
req('Release 466 · Builds 4–6' in historical_page and 'Build 6 · I.T. provider acceptance runner' in historical_page,'Historical external readiness page identity drifted')

# Preparation authorities explicitly preserve all six real dimensions including refund.
for token in ('credentials','checkout','webhook-signature','refund','reconciliation','idempotent-replay'):
    req(token in stripe_doc,f'Build 79 Stripe preparation missing real acceptance dimension: {token}')
for token in ('credentials','approval-capture','webhook-verification','refund','reconciliation','idempotent-replay'):
    req(token in paypal_doc,f'Build 80 PayPal preparation missing real acceptance dimension: {token}')

# Current I.T. / Reliability / Preflight and restart docs agree on Build 88 candidate + Build 87 verified.
for text,label in ((it_api,'I.T. API'),(reliability,'Reliability'),(preflight,'Deployment Preflight')):
    req(B87_SHA in text and B87_TREE in text,f'{label} missing Build 87 verified SHA/tree')
    req(str(B87_PAGES) in text and str(B87_LIVE) in text,f'{label} missing Build 87 Production proof')
req('const BUILD = 88;' in it_api,'I.T. API must identify Build 88')
req('CURRENT_RELIABILITY_BUILD = 88' in reliability,'Reliability must identify Build 88')
req('const BUILD = 88;' in preflight,'Deployment Preflight must identify Build 88')
req('Release 467 Build 88' in it_page and 'Release 467 • Build 88' in reliability_page and 'Release 467 Build 88' in preflight_page,'Current operator page identities must be Build 88')
for path in ('AI_HANDOFF.md','PROJECT_STATUS_AND_ROADMAP.md','SANITY_HEALTH_CHECK.md','MARKDOWN_INDEX.md','docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md'):
    body=read(path)
    for token in (B87_SHA,B87_TREE,str(B87_PROOFS['system_gate_run']),str(B87_PROOFS['current_application_quality_run']),str(B87_PROOFS['it_admin_runtime_proof_run']),str(B87_PROOFS['branch_hygiene_run']),str(B87_PAGES),str(B87_LIVE)):
        req(token in body,f'{path} missing Build 87 verified token: {token}')
    req('Build 88' in body,f'{path} must identify Build 88 current candidate')

for token in ('five', 'six real acceptance dimensions', 'provider-synchronized', 'historical Build 6/7', 'HOLD_EXTERNAL', '0001', '0004'):
    req(token.lower() in doc.lower(),f'Build 88 operating document missing token: {token}')
req([row.get('file') for row in manifest.get('migrations',[])]==EXPECTED,'Build 88 must keep canonical migrations exactly 0001-0004')
req(not list((ROOT/'migrations/canonical').glob('0005*')),'Build 88 must remain schema-neutral')
req("run_current_contract('scripts/release467_build88_gate.py', 'Release 467 Build 88')" in provenance,'Current System Gate does not chain Build 88')

for path in ('functions/api/admin/current-external-acceptance-control-center.js','public/js/admin-current-external-acceptance-control-center.js','functions/api/admin/it-operations-control-tower.js','public/js/admin-it-control-tower.js','functions/api/_lib/currentReliability.js','functions/api/admin/current-deployment-preflight.js'):
    run(['node','--check',path],f'JavaScript syntax {path}')
run(['python3','scripts/current_it_release_truth_gate.py'],'current I.T. release truth')
run(['python3','scripts/current_authority_restart_integrity_gate.py'],'current restart integrity')
run(['python3','scripts/current_reliability_truth_gate.py'],'current Reliability truth')
run(['python3','scripts/current_deployment_preflight_truth_gate.py'],'current Deployment Preflight truth')
run(['python3','scripts/release467_build87_gate.py'],'carried Build 87 boundary')

if FAIL:
    print('RELEASE 467 BUILD 88 EXTERNAL ACCEPTANCE CONTROL CENTER: FAIL')
    for item in FAIL:print('-',item)
    sys.exit(1)
print('RELEASE 467 BUILD 88 EXTERNAL ACCEPTANCE CONTROL CENTER: PASS')
print('Current external lanes: 5 / EVIDENCE-DRIVEN')
print('Stripe/PayPal real acceptance dimensions: 6 EACH')
print('Historical Build 6/7 engines: PRESERVED')
print('Automatic / Production provider execution: CLOSED')
print('Canonical D1 migrations: 0001-0004 / UNCHANGED')
