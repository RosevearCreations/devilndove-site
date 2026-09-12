#!/usr/bin/env python3
"""Fail-closed source/runtime contract for Release 467 Build 109 — Customer Proof & Fulfilment Follow-through."""
from pathlib import Path
import json,re,subprocess,sys
ROOT=Path(__file__).resolve().parents[1]
FAIL=[]
B108_SHA='f9d68ea87a8c2622e8ec05e09e64f3a0672ba2b8'
B108_TREE='6d2e524ceb06b90dad9e01e94297cdedde61920c'
B108_PROOFS={'system_gate_run':34663299696,'current_application_quality_run':34663299662,'it_admin_runtime_proof_run':34663299580,'branch_hygiene_run':34663299597}
B108_PAGES=34663390560
B108_LIVE=34663433029
EXPECTED=['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql']
def read(path):
 p=ROOT/path
 if not p.is_file():FAIL.append(f'missing required file: {path}');return''
 return p.read_text(encoding='utf-8',errors='replace')
def load(path):
 try:return json.loads(read(path) or '{}')
 except Exception as exc:FAIL.append(f'invalid JSON {path}: {exc}');return{}
def req(ok,msg):
 if not ok:FAIL.append(msg)
def run(cmd,label):
 r=subprocess.run(cmd,cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=False)
 if r.stdout.strip():print(r.stdout.strip())
 req(r.returncode==0,f"{label} failed: {(r.stderr or r.stdout).strip()[-3000:]}")
def compact(s):return re.sub(r'\s+','',s)
pointer=load('current-development-authority.json');b108=load('release467-build108-mobile-workshop-assistant.json');b109=load('release467-build109-customer-proof-fulfilment.json');manifest=load('migrations/canonical/manifest.json')
api=read('functions/api/custom-request-order.js');journey=read('functions/api/_lib/customRequestJourney.js');client=read('public/js/custom-request-order-status.js');client_copy=read('custom-request-order-status.js');page=read('custom-request/order/index.html');prov=read('scripts/current_system_gate_provenance_gate.py')
it_api=read('functions/api/admin/it-operations-control-tower.js');rel=read('functions/api/_lib/currentReliability.js');pre=read('functions/api/admin/current-deployment-preflight.js');it_client=read('public/js/admin-it-control-tower.js');it_page=read('admin/it/index.html');rel_page=read('admin/reliability/index.html');pre_page=read('admin/deployment-preflight/index.html')
req(pointer.get('release')==467 and pointer.get('build')==109,'current authority must be Release 467 Build 109')
req(pointer.get('title')=='Customer Proof & Fulfilment Follow-through','Build 109 title drifted')
req(pointer.get('state')=='DEVELOPMENT_GREEN','candidate pointer must retain last externally verified GREEN state')
req(pointer.get('accepted_dev_sha')==B108_SHA and pointer.get('accepted_dev_tree_sha')==B108_TREE,'accepted Build 108 SHA/tree drifted')
req((pointer.get('acceptance') or {})==B108_PROOFS,'accepted Build 108 four-proof set drifted')
last=(pointer.get('restart_integrity') or {}).get('last_fully_verified') or {};prod=pointer.get('production_checkpoint') or {};cand=(pointer.get('restart_integrity') or {}).get('current_closure_candidate') or {}
req(last.get('build')==108 and last.get('dev_sha')==B108_SHA and last.get('tree_sha')==B108_TREE and (last.get('proofs') or {})==B108_PROOFS,'Build 108 restart closure drifted')
req(prod.get('build')==108 and prod.get('main_sha')==B108_SHA and prod.get('tree_sha')==B108_TREE and prod.get('production_pages_deploy_run')==B108_PAGES and prod.get('production_live_resource_integrity_run')==B108_LIVE,'Build 108 Production baseline drifted')
req(cand.get('build')==109 and cand.get('authority')=='release467-build109-customer-proof-fulfilment.json' and cand.get('state')=='AWAITING_EXTERNAL_EXACT_CLOSURE_HEAD_PROOF','Build 109 candidate pointer drifted')
req(b108.get('state')=='PRODUCTION_GREEN','Build 108 authority must be Production GREEN')
f108=b108.get('final_closure') or {};p108=b108.get('production_checkpoint') or {}
req(f108.get('dev_sha')==B108_SHA and f108.get('tree_sha')==B108_TREE and (f108.get('proofs') or {})==B108_PROOFS and f108.get('ingested_by_build')==109,'Build 108 final closure not ingested by Build 109')
req(p108.get('main_sha')==B108_SHA and p108.get('tree_sha')==B108_TREE and p108.get('production_pages_deploy_run')==B108_PAGES and p108.get('production_live_resource_integrity_run')==B108_LIVE,'Build 108 Production closure drifted')
req(b109.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE' and b109.get('final_closure') is None and b109.get('production_checkpoint') is None,'Build 109 must remain an unproven closure candidate')
req(client==client_copy,'customer order-status compatibility copies drifted')
req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,'private order status page must contain exactly one H1')
for token in ('Customer Proof & Fulfilment Follow-through','follow_through','proof_consent','publication_authorized:false','moderation_required:true','customerFollowThrough'):
 req(token in api+journey+client+read('release467-build109-customer-proof-fulfilment.json'),f'Build 109 contract missing token: {token}')
for token in ('What happens next','Photo privacy &amp; consent','Publication authority: <strong>not granted by this page</strong>'):
 req(token in client,f'customer renderer missing token: {token}')
for token in ('next_step','local_pickup','canada_shipping','review_prompt','photo_prompt','Share a review','Share a finished-piece photo','publication_authorized: false','moderation_required: true'):
 req(token in journey,f'customer follow-through helper missing token: {token}')
req('internal production notes are deliberately not included' in client,'internal-note exclusion must remain visible')
req('SELECT stage_key, stage_label, created_at' in api,'reviewed stage query drifted')
req(len(re.findall(r'\bSELECT\b',api,re.I))==8,'Build 109 must not add customer-order SELECT reads')
req(len(re.findall(r'\bUPDATE\b',api,re.I))==1,'Build 109 must preserve only the existing link-view UPDATE')
for forbidden in ('onRequestPost','onRequestPut','onRequestPatch','onRequestDelete','INSERT INTO','DELETE FROM','CREATE TABLE','ALTER TABLE','DROP TABLE'):
 req(forbidden not in api,f'Build 109 gained forbidden customer/order mutation authority: {forbidden}')
req('467b109' in page,'private order page must load Build 109 renderer')
for text,label in ((it_api,'I.T. API'),(rel,'Reliability'),(pre,'Deployment Preflight')):
 req(B108_SHA in text and B108_TREE in text,f'{label} missing Build 108 SHA/tree')
 for v in B108_PROOFS.values():req(str(v) in text,f'{label} missing Build 108 proof {v}')
 req(str(B108_PAGES) in text and str(B108_LIVE) in text,f'{label} missing Build 108 Production proofs')
req('constBUILD=109;' in compact(it_api),'I.T. API must identify Build 109')
req('CURRENT_RELIABILITY_BUILD = 109' in rel,'Reliability must identify Build 109')
req('constBUILD=109;' in compact(pre),'Deployment Preflight must identify Build 109')
req('Release 467 Build 109' in it_client and 'Release 467 Build 109' in it_page,'I.T. surfaces must identify Build 109')
req('Release 467 • Build 109' in rel_page,'Reliability page must identify Build 109')
req('Release 467 Build 109' in pre_page,'Deployment Preflight page must identify Build 109')
for html,label in ((it_page,'I.T.'),(rel_page,'Reliability'),(pre_page,'Deployment Preflight'),(page,'Order status')):req(len(re.findall(r'<h1(?:\s|>)',html,re.I))==1,f'{label} page must retain exactly one H1')
for path in ('AI_HANDOFF.md','PROJECT_STATUS_AND_ROADMAP.md','SANITY_HEALTH_CHECK.md','MARKDOWN_INDEX.md','docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md','docs/operations/RELEASE_467_BUILD_109_CUSTOMER_PROOF_FULFILMENT.md'):
 body=read(path)
 for token in (B108_SHA,B108_TREE,*[str(x) for x in B108_PROOFS.values()],str(B108_PAGES),str(B108_LIVE)):req(token in body,f'{path} missing Build 108 closure token {token}')
 req('Build 109' in body and 'Customer Proof & Fulfilment Follow-through' in body,f'{path} missing Build 109 identity')
roadmap=read('PROJECT_STATUS_AND_ROADMAP.md')
for build in range(109,114):req(f'Build {build}' in roadmap,f'current roadmap missing planned Build {build}')
req([row.get('file') for row in manifest.get('migrations',[])]==EXPECTED,'Canonical migrations must remain exactly 0001-0004')
req(not list((ROOT/'migrations/canonical').glob('0005*')),'Build 109 must remain schema-neutral')
req("run_current_contract('scripts/release467_build109_gate.py', 'Release 467 Build 109')" in prov,'System Gate must chain Build 109')
req("run_current_contract('scripts/release467_build108_gate.py', 'Release 467 Build 108')" not in prov,'Build 109 must supersede Build 108 as current contract')
for path in ('public/js/custom-request-order-status.js','custom-request-order-status.js','functions/api/custom-request-order.js','functions/api/_lib/customRequestJourney.js','functions/api/admin/it-operations-control-tower.js','public/js/admin-it-control-tower.js','functions/api/_lib/currentReliability.js','functions/api/admin/current-deployment-preflight.js'):run(['node','--check',path],f'JavaScript syntax {path}')
run(['python3','scripts/current_authority_restart_integrity_gate.py'],'current restart integrity')
run(['python3','scripts/current_it_release_truth_gate.py'],'current I.T. truth')
run(['python3','scripts/current_reliability_truth_gate.py'],'current Reliability truth')
run(['python3','scripts/current_deployment_preflight_truth_gate.py'],'current Deployment Preflight truth')
if FAIL:
 print('RELEASE 467 BUILD 109 CUSTOMER PROOF & FULFILMENT FOLLOW-THROUGH: FAIL')
 for item in FAIL:print('-',item)
 sys.exit(1)
print('RELEASE 467 BUILD 109 CUSTOMER PROOF & FULFILMENT FOLLOW-THROUGH: PASS')
print('Build 108 final Development + Production closure: INGESTED')
print('Customer progress/follow-through: EXISTING PRIVATE ORDER DATA / DERIVED PRESENTATION')
print('Completion review/photo prompts: OPTIONAL / COMPLETE-STATE ONLY')
print('Customer proof publication authority: NONE / EXPLICIT CONSENT + MODERATION REQUIRED')
print('Additional D1 reads / schema / R2 / provider mutation: NONE')
print('Canonical D1 migrations: 0001-0004 / UNCHANGED')
