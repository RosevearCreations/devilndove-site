#!/usr/bin/env python3
"""Fail-closed source/runtime contract for Release 467 Build 90."""
from pathlib import Path
import json,re,subprocess,sys
ROOT=Path(__file__).resolve().parents[1]; FAIL=[]
B89_SHA='68ac415302bceddb81e6faea15fbbebb3a76f24a'; B89_TREE='1a7cccf46b29718ea63d532c8c22322bcca98ffd'
B89_PROOFS={'system_gate_run':34425720516,'current_application_quality_run':34425720539,'it_admin_runtime_proof_run':34425720559,'branch_hygiene_run':34425720537}
B89_PAGES=34425875315; B89_LIVE=34425949898
EXPECTED=['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql']
def read(p):
 t=ROOT/p
 if not t.is_file():FAIL.append(f'missing required file: {p}');return ''
 return t.read_text(encoding='utf-8',errors='replace')
def load(p):
 try:return json.loads(read(p) or '{}')
 except json.JSONDecodeError as e:FAIL.append(f'invalid JSON {p}: {e}');return{}
def req(ok,msg):
 if not ok:FAIL.append(msg)
def run(cmd,label):
 r=subprocess.run(cmd,cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=False)
 if r.stdout.strip():print(r.stdout.strip())
 req(r.returncode==0,f"{label} failed: {(r.stderr or r.stdout).strip()[-3400:]}")
def compact(s):return re.sub(r'\s+','',s)

pointer=load('current-development-authority.json'); b89=load('release467-build89-external-acceptance-environment-isolation.json'); b90=load('release467-build90-external-acceptance-evidence-depth.json'); manifest=load('migrations/canonical/manifest.json')
api=read('functions/api/admin/current-external-acceptance-control-center.js'); apic=compact(api)
client=read('public/js/admin-current-external-acceptance-control-center.js')
page=read('admin/release-control/external-acceptance/index.html'); doc=read('docs/operations/RELEASE_467_BUILD_90_EXTERNAL_ACCEPTANCE_EVIDENCE_DEPTH.md')
it_api=read('functions/api/admin/it-operations-control-tower.js'); it_client=read('public/js/admin-it-control-tower.js'); it_page=read('admin/it/index.html')
reliability=read('functions/api/_lib/currentReliability.js'); reliability_page=read('admin/reliability/index.html')
preflight=read('functions/api/admin/current-deployment-preflight.js'); preflight_page=read('admin/deployment-preflight/index.html')
provenance=read('scripts/current_system_gate_provenance_gate.py')

# Current Build 90 candidate over immutable exact Build 89 closure.
req(pointer.get('release')==467 and pointer.get('build')==90,'current authority must be Release 467 Build 90')
req(pointer.get('title')=='External Acceptance Evidence Depth & Cross-Lane Guidance','Build 90 title drifted')
req(pointer.get('state')=='DEVELOPMENT_GREEN','candidate pointer must retain last externally verified Development GREEN state')
req(pointer.get('accepted_dev_sha')==B89_SHA and pointer.get('accepted_dev_tree_sha')==B89_TREE,'Build 90 accepted Development SHA/tree must equal Build 89 closure')
req((pointer.get('acceptance') or {})==B89_PROOFS,'Build 90 accepted Development proof set must equal Build 89')
req(pointer.get('promotion_state')=='BUILD90_CANDIDATE_NOT_YET_VERIFIED','Build 90 promotion state must remain fail-closed candidate')
restart=pointer.get('restart_integrity') or {}; last=restart.get('last_fully_verified') or {}; cand=restart.get('current_closure_candidate') or {}; prod=pointer.get('production_checkpoint') or {}
req(last.get('build')==89 and last.get('dev_sha')==B89_SHA and last.get('tree_sha')==B89_TREE and (last.get('proofs') or {})==B89_PROOFS,'Build 89 restart closure drifted')
req(cand.get('build')==90 and cand.get('authority')=='release467-build90-external-acceptance-evidence-depth.json' and cand.get('state')=='AWAITING_EXTERNAL_EXACT_CLOSURE_HEAD_PROOF','Build 90 closure-candidate pointer drifted')
req(prod.get('build')==89 and prod.get('main_sha')==B89_SHA and prod.get('tree_sha')==B89_TREE and prod.get('production_pages_deploy_run')==B89_PAGES and prod.get('production_live_resource_integrity_run')==B89_LIVE,'Build 89 Production baseline drifted')
req((pointer.get('current_release_authorities') or [])[:2]==['release467-build90-external-acceptance-evidence-depth.json','release467-build89-external-acceptance-environment-isolation.json'],'current authority ordering must start Build 90 then Build 89')
for k in ('schema_change_authorized','d1_mutation_authorized','r2_mutation_authorized','provider_execution_authorized','provider_publication_authorized','cloudflare_access_mutation_authorized','automatic_production_promotion_authorized','request_time_schema_mutation','secret_values_emitted'):req(pointer.get(k) is False,f'unsafe pointer flag must remain false: {k}')

# Build 89 is immutable final closure; Build 90 cannot self-claim later proof.
req(b89.get('state')=='PRODUCTION_GREEN','Build 89 authority must retain Production GREEN')
f=b89.get('final_closure') or {}; p89=b89.get('production_checkpoint') or {}
req(f.get('dev_sha')==B89_SHA and f.get('tree_sha')==B89_TREE and (f.get('proofs') or {})==B89_PROOFS,'Build 89 final closure drifted')
req(p89.get('main_sha')==B89_SHA and p89.get('tree_sha')==B89_TREE and p89.get('production_pages_deploy_run')==B89_PAGES and p89.get('production_live_resource_integrity_run')==B89_LIVE,'Build 89 Production closure drifted')
req(b90.get('release')==467 and b90.get('build')==90 and b90.get('title')=='External Acceptance Evidence Depth & Cross-Lane Guidance','Build 90 authority identity drifted')
req(b90.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE','Build 90 authority must remain closure candidate')
sd=(b90.get('starting_point') or {}).get('development') or {}; sp=(b90.get('starting_point') or {}).get('production') or {}
req(sd.get('sha')==B89_SHA and sd.get('tree')==B89_TREE and sd.get('system_gate_run')==B89_PROOFS['system_gate_run'] and sd.get('quality_run')==B89_PROOFS['current_application_quality_run'] and sd.get('it_admin_runtime_run')==B89_PROOFS['it_admin_runtime_proof_run'] and sd.get('repository_hygiene_run')==B89_PROOFS['branch_hygiene_run'],'Build 90 Development starting point drifted')
req(sp.get('main_sha')==B89_SHA and sp.get('tree_sha')==B89_TREE and sp.get('production_pages_deploy_run')==B89_PAGES and sp.get('production_live_resource_integrity_run')==B89_LIVE,'Build 90 Production starting point drifted')
req((b90.get('closure_policy') or {}).get('final_closure') is None,'Build 90 must not contain premature final closure')

# Current API preserves Build 89 isolation and deepens all five lanes.
for token in ("const BUILD = 90;","const TITLE = 'External Acceptance Evidence Depth & Cross-Lane Guidance';",'runtimeBoundary','getCommercialBridge','getProviderRunner','if(runtime.development)','normalizePaymentLane','normalizeCaipLane','normalizeSocialLane','accessLane','required_check_count','accepted_check_count','evidence_timestamp','evidence_freshness_state'):
 req(token in api or token in apic,f'Build 90 API missing token: {token}')
for token in ('review_proxy_served','ranged_streaming','no_copy','no_cache','object_key_present'):req(token in api,f'Build 90 CAIP evidence missing {token}')
for token in ('provider_selection','provider_readiness','intended_account','controlled_lifecycle','publication_closed'):req(token in api,f'Build 90 Social evidence missing {token}')
for token in ('source_harness','exact_dev_sha','service_token_secrets','dispatch_success','application_401_reached'):req(token in api,f'Build 90 Access checklist missing {token}')
req('exportasyncfunctiononRequestGet' in apic,'Build 90 API must expose GET')
for m in ('onRequestPost','onRequestPut','onRequestPatch','onRequestDelete'):req(m not in api,f'Build 90 status API must remain GET-only ({m} found)')
req('fetch(' not in api,'Build 90 status API must not directly contact providers')
for forbidden in ('INSERT INTO','UPDATE ','DELETE FROM','CREATE TABLE','ALTER TABLE','DROP TABLE'):req(forbidden not in api.upper(),f'Build 90 status API contains forbidden DML/DDL: {forbidden}')
try:
 bc=api.index('const bridgeResponse=await getCommercialBridge(context)'); dg=api.index('if(runtime.development)'); rc=api.index('const runnerResponse=await getProviderRunner(context)'); req(bc<dg<rc,'Build 90 must preserve bridge-first Development-only runner ordering')
except ValueError:req(False,'Build 90 environment isolation markers missing')

# Browser exposes evidence depth, retains only guarded payment POST actions, and never polls/providers directly.
for token in ('Release 467 Build 90','checkTable','evidenceLane','evidenceAge','required evidence checks passed','Across all five lanes','Provider acceptance actions are available only on the canonical Development environment',"action:'refresh_evidence'","action:'prepare_checkout'","action:'refund_latest'",'window.confirm','confirm_provider_test:true'):
 req(token in client,f'Build 90 client missing token: {token}')
req('setInterval(' not in client,'Build 90 client must not poll')
req('api.stripe.com' not in client and 'api-m.paypal.com' not in client and 'api-m.sandbox.paypal.com' not in client,'Build 90 client must not directly call provider APIs')
req(client.count("method:'POST'")>=1,'Build 90 client must retain guarded Development action POST path')

# Current pages / truth surfaces carry Build 90 identity over exact Build 89 proof.
for token in ('Release 467 Build 90',B89_SHA,B89_TREE,str(B89_PAGES),str(B89_LIVE),'structured evidence','/public/js/admin-current-external-acceptance-control-center.js?v=467b90'):req(token.lower() in page.lower(),f'Build 90 external page missing token: {token}')
req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,'external acceptance page must contain exactly one H1')
for text,label in ((it_api,'I.T. API'),(reliability,'Reliability'),(preflight,'Deployment Preflight')):
 req(B89_SHA in text and B89_TREE in text,f'{label} missing Build 89 verified SHA/tree'); req(str(B89_PAGES) in text and str(B89_LIVE) in text,f'{label} missing Build 89 Production proof')
req('constBUILD=90;' in compact(it_api),'I.T. API must identify Build 90')
req('CURRENT_RELIABILITY_BUILD = 90' in reliability,'Reliability must identify Build 90')
req('constBUILD=90;' in compact(preflight),'Deployment Preflight must identify Build 90')
req('Release 467 Build 90' in it_client and 'Release 467 Build 90' in it_page,'I.T. current surfaces must identify Build 90')
req('Release 467 • Build 90' in reliability_page,'Reliability page must identify Build 90')
req('Release 467 Build 90' in preflight_page,'Deployment Preflight page must identify Build 90')

for path in ('AI_HANDOFF.md','PROJECT_STATUS_AND_ROADMAP.md','SANITY_HEALTH_CHECK.md','MARKDOWN_INDEX.md','docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md'):
 body=read(path)
 for token in (B89_SHA,B89_TREE,str(B89_PROOFS['system_gate_run']),str(B89_PROOFS['current_application_quality_run']),str(B89_PROOFS['it_admin_runtime_proof_run']),str(B89_PROOFS['branch_hygiene_run']),str(B89_PAGES),str(B89_LIVE)):req(token in body,f'{path} missing Build 89 verified token: {token}')
 req('Build 90' in body,f'{path} must identify Build 90 current candidate')
for token in ('five external lanes','Social OAuth','CAIP','Cloudflare Access','timestamp','does not infer','HOLD_EXTERNAL','0001','0004'):req(token.lower() in doc.lower(),f'Build 90 operating document missing token: {token}')
req([r.get('file') for r in manifest.get('migrations',[])]==EXPECTED,'Build 90 must keep canonical migrations exactly 0001-0004')
req(not list((ROOT/'migrations/canonical').glob('0005*')),'Build 90 must remain schema-neutral')
req("run_current_contract('scripts/release467_build90_gate.py', 'Release 467 Build 90')" in provenance,'System Gate does not chain Build 90')

for path in ('functions/api/admin/current-external-acceptance-control-center.js','public/js/admin-current-external-acceptance-control-center.js','functions/api/admin/it-operations-control-tower.js','public/js/admin-it-control-tower.js','functions/api/_lib/currentReliability.js','functions/api/admin/current-deployment-preflight.js'):
 run(['node','--check',path],f'JavaScript syntax {path}')
run(['python3','scripts/current_it_release_truth_gate.py'],'current I.T. release truth')
run(['python3','scripts/current_authority_restart_integrity_gate.py'],'current restart integrity')
run(['python3','scripts/current_reliability_truth_gate.py'],'current Reliability truth')
run(['python3','scripts/current_deployment_preflight_truth_gate.py'],'current Deployment Preflight truth')
run(['python3','scripts/release467_build89_gate.py'],'carried Build 89 boundary')
if FAIL:
 print('RELEASE 467 BUILD 90 EXTERNAL ACCEPTANCE EVIDENCE DEPTH: FAIL'); [print('-',x) for x in FAIL]; sys.exit(1)
print('RELEASE 467 BUILD 90 EXTERNAL ACCEPTANCE EVIDENCE DEPTH: PASS')
print('External lanes: FIVE / STRUCTURED CHECK COUNTS + NEXT ACTION')
print('Build 89 Production isolation: PRESERVED')
print('Automatic / Production provider execution and publication: CLOSED')
print('Canonical D1 migrations: 0001-0004 / UNCHANGED')
