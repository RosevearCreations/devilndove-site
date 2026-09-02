#!/usr/bin/env python3
"""Fail-closed retained contract for Release 467 Build 16 — Custom Request & Made Today Journey."""
from __future__ import annotations
import json,re,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
BASE_SHA='cb6a69ebf544a8eb74efeec409aeeb7ad1852a33';BASE_TREE='2e9befcb349bbbb5b4dfd06f56b3d4b7bfdf9d60'
MERGED_SHA='c05c7ff64e01672b04ec1768b696e163adeeca0f';MERGED_TREE='1635f19b24df5c37358925948b51e5a43c20cf99';MERGED_SYSTEM_GATE=33658864411;MERGED_BUILD16_PROOF=33658864422
PREV_SYSTEM_GATE=33654847043;PREV_BUILD15_PROOF=33654846823;PROD_MAIN='296e53b079bba53126c80902be36a9271d82cea4';PROD_DEPLOY=33655223149
MIGRATIONS=['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql']
def req(ok,msg):
 if not ok:FAIL.append(msg)
def read(path):
 p=ROOT/path
 if not p.is_file():FAIL.append(f'missing required file: {path}');return ''
 return p.read_text(encoding='utf-8',errors='replace')
def load(path):
 try:v=json.loads(read(path));return v if isinstance(v,dict) else {}
 except Exception as e:FAIL.append(f'invalid JSON {path}: {e}');return {}
def changed():
 try:
  base=subprocess.check_output(['git','merge-base','HEAD','origin/dev'],cwd=ROOT,text=True).strip();out=subprocess.check_output(['git','diff','--name-only',f'{base}...HEAD'],cwd=ROOT,text=True);return [x for x in out.splitlines() if x]
 except Exception as e:FAIL.append(f'could not calculate changed files: {e}');return []
def hasall(body,tokens,label):
 for token in tokens:req(token in body,f'{label} marker missing: {token}')
def one_h1(body,label):req(len(re.findall(r'<h1(?:\s|>)',body,re.I))==1,f'{label} must contain exactly one H1')

p=load('current-development-authority.json');m=load('release467-build16-custom-request-made-today-journey.json');b17m=load('release467-build17-creator-content-completeness.json');mig=load('migrations/canonical/manifest.json');compat=load('development-release.json')
pointer_build=int(p.get('build') or 0)
authorities=p.get('current_release_authorities') or []
req(p.get('release')==467 and pointer_build>=16,'current authority must identify Release 467 Build 16 or newer')
if pointer_build==16:
 req(p.get('title')=='Custom Request & Made Today Journey','Build 16 title drifted')
 req(p.get('feature_branch')=='release467-build16-custom-request-made-today-journey','Build 16 feature branch drifted')
 req(p.get('source_base_sha')==BASE_SHA and p.get('source_base_tree_sha')==BASE_TREE,'Build 16 source base drifted')
 req(p.get('last_green_build')==15 and p.get('last_green_dev_sha')==BASE_SHA and p.get('last_green_dev_tree_sha')==BASE_TREE,'Build 15 predecessor drifted')
 req(p.get('last_green_system_gate_run')==PREV_SYSTEM_GATE and p.get('last_green_build_proof_run')==PREV_BUILD15_PROOF,'Build 15 predecessor proof drifted')
 req((authorities or [None])[0]=='release467-build16-custom-request-made-today-journey.json','Build 16 must be first authority while current')
elif pointer_build==17:
 req(int(p.get('last_green_build') or 0)>=16,'Build 17 authority must retain Build 16 as a green predecessor')
 req(p.get('last_green_dev_sha')==MERGED_SHA and p.get('last_green_dev_tree_sha')==MERGED_TREE,'Build 17 authority must retain exact merged Build 16 SHA/tree')
 req(p.get('last_green_system_gate_run')==MERGED_SYSTEM_GATE and p.get('last_green_build_proof_run')==MERGED_BUILD16_PROOF,'Build 17 authority must retain exact Build 16 proof evidence')
 req('release467-build16-custom-request-made-today-journey.json' in authorities,'Build 16 provenance missing from Build 17 pointer')
else:
 # From Build 18 onward the current pointer correctly advances to the immediately previous green build.
 # Preserve Build 16 transitively through the immutable Build 17 predecessor manifest instead of
 # forcing current last_green_* fields to remain pinned to Build 16 forever.
 req(int(p.get('last_green_build') or 0)>=17,'newer authority must retain a green Build 17-or-newer predecessor')
 req(bool(p.get('last_green_dev_sha')) and bool(p.get('last_green_dev_tree_sha')),'newer authority must retain current last-green SHA/tree evidence')
 req(bool(p.get('last_green_system_gate_run')) and bool(p.get('last_green_build_proof_run')),'newer authority must retain current last-green proof evidence')
 req('release467-build16-custom-request-made-today-journey.json' in authorities,'Build 16 provenance missing from newer pointer')
 req('release467-build17-creator-content-completeness.json' in authorities,'Build 17 transitive provenance missing from newer pointer')
 b17pr=b17m.get('predecessor') or {}
 req(b17m.get('release')==467 and b17m.get('build')==17,'Build 17 manifest missing for transitive Build 16 proof')
 req(b17pr.get('build')==16 and b17pr.get('merged_dev_sha')==MERGED_SHA and b17pr.get('merged_dev_tree_sha')==MERGED_TREE,'Build 17 manifest must retain exact merged Build 16 SHA/tree')
 req(b17pr.get('system_gate_run')==MERGED_SYSTEM_GATE and b17pr.get('build16_proof_run')==MERGED_BUILD16_PROOF,'Build 17 manifest must retain exact Build 16 proof evidence')
req(p.get('promotion_state')=='NO_AUTOMATIC_PROMOTION','automatic Production promotion forbidden')
for k in ('schema_change_authorized','d1_mutation_authorized','r2_mutation_authorized','provider_execution_authorized','provider_publication_authorized','cloudflare_access_mutation_authorized','main_mutation_authorized','production_mutation_authorized','secret_values_emitted'):req(p.get(k) is False,f'pointer safety drift: {k}')
req(p.get('main_source_head_last_verified')==PROD_MAIN and p.get('production_pages_deploy_last_verified')==PROD_DEPLOY,'verified Production checkpoint drifted')
ca=p.get('compatibility_authority') or {};req(ca.get('role')=='INHERITED_REGRESSION_COMPATIBILITY' and ca.get('runtime_release_header')==466 and compat.get('release')==466,'Release 466 compatibility classification drifted')

req(m.get('release')==467 and m.get('build')==16 and m.get('title')=='Custom Request & Made Today Journey','Build 16 manifest identity drifted')
req(m.get('source_base_sha')==BASE_SHA and m.get('source_base_tree_sha')==BASE_TREE and m.get('backlog_items')==[11,12,13,14,15],'Build 16 manifest base/backlog drifted')
j=m.get('journey') or {};e=m.get('evidence_policy') or {};mt=m.get('made_today') or {};f=m.get('fulfillment_policy') or {}
req(j.get('customer_safe_stage_messages') is True and j.get('internal_order_notes_exposed_to_customer') is False and j.get('internal_stage_notes_exposed_to_customer') is False,'Build 16 customer privacy contract drifted')
req(e.get('candle_soap_examples_use_existing_data_only') is True and e.get('invented_claims') is False and e.get('public_proof_requires_consent_clearance') is True,'Build 16 evidence-only contract drifted')
req(mt.get('default_public_use_status')=='customer_private' and mt.get('default_moderation_status')=='needs_review' and mt.get('automatic_order_stage_advance') is False and mt.get('automatic_publication') is False,'Build 16 Made Today review boundary drifted')
req(f.get('allowed_shipping_countries')==['CA'] and f.get('us_sales_shipping_suspended') is True,'Build 16 Canada-only/U.S. suspension drifted')

helper=read('functions/api/_lib/customRequestJourney.js');order_api=read('functions/api/custom-request-order.js');order_client=read('public/js/custom-request-order-status.js');order_copy=read('custom-request-order-status.js');examples=read('functions/api/custom-request-examples.js');proof=read('functions/api/trust-blocks.js');made=read('public/js/admin-made-today.js');stage=read('functions/api/admin/custom-order-stage-photos.js');public=read('custom-request/index.html');private=read('custom-request/order/index.html')
hasall(helper,['review_proof','fulfillment','planning','curing_finishing','shipped_pickup','customerStageMessage','buildCustomerJourney'],'journey helper')
hasall(order_api,['buildCustomerJourney','customerStageMessage','SELECT stage_key, stage_label, created_at','fulfillment_message'],'customer-safe order API')
req('orders.notes' not in order_api and 'SELECT stage_key, stage_label, stage_notes' not in order_api,'raw internal notes must remain excluded')
req(order_client==order_copy,'customer order-status compatibility copies drifted')
hasall(order_client,['internal production notes are deliberately not included','Reviewed progress photos','Reviewed candle / soap facts'],'customer status renderer')
hasall(examples,["COALESCE(status,'active')='active'","COALESCE(review_status,'published') IN ('approved','published','')",'invented_claims:false','read_only:true'],'evidence-backed examples')
hasall(proof,["status IN ('approved', 'published')","approved_for_public_use = 1","privacy_review_status = 'cleared'"],'consent-cleared proof')
req('CREATE TABLE' not in stage.upper() and 'ALTER TABLE' not in stage.upper(),'Build 16 touched stage-photo route regained request-time DDL')
hasall(stage,['customer_private','needs_review','automatic_publication: false'],'stage-photo review defaults')
req('advance_order_stage' not in made and 'social-post' not in made.lower(),'Made Today must not auto-advance or publish')
one_h1(public,'public custom request page');one_h1(private,'private order-status page')
hasall(public,['Review & proof','Pickup / shipping','U.S. sales/shipping remain suspended'],'public journey/shipping')
hasall(private,['noindex,nofollow','internal production notes'],'private status privacy')
req([x.get('file') for x in mig.get('migrations',[])]==MIGRATIONS,'canonical migrations drifted')

if pointer_build==16:
 allowed={'.github/workflows/release467-build16-proof.yml','admin/custom-request/index.html','admin/custom-request/made-today/index.html','css/custom-request-journey.css','custom-request-order-status.js','custom-request/index.html','custom-request/order/index.html','current-development-authority.json','docs/operations/RELEASE_467_BUILD_16_CUSTOM_REQUEST_MADE_TODAY_JOURNEY.md','functions/api/_lib/customRequestJourney.js','functions/api/admin/custom-order-stage-photos.js','functions/api/custom-request-examples.js','functions/api/custom-request-order.js','public/js/admin-made-today.js','public/js/custom-request-examples.js','public/js/custom-request-order-status.js','release467-build16-custom-request-made-today-journey.json','scripts/release467_build13_gate.py','scripts/release467_build14_gate.py','scripts/release467_build15_gate.py','scripts/release467_build16_gate.py'}
 ch=changed();req(not [x for x in ch if x not in allowed],f'files outside Build 16 scope changed: {[x for x in ch if x not in allowed]}');req(not [x for x in ch if x.startswith('migrations/') or x.lower().endswith('.sql')],'Build 16 must not change schema/migrations')
if FAIL:
 print('FAIL Release 467 Build 16 retained gate');[print(f'- {x}') for x in FAIL];sys.exit(1)
print('PASS Release 467 Build 16 retained gate')
print(f'pointer_build={pointer_build}')
print('Build16_provenance=TRANSITIVE_VIA_BUILD17' if pointer_build>17 else 'Build16_provenance=DIRECT')
print('customer_safe_request_journey=GUARDED')
print('evidence_only_public_examples=GUARDED')
print('made_today_review_only=GUARDED')
print('request_time_stage_photo_ddl=BLOCKED')
print('canada_only_shipping_policy=PRESERVED')
print('us_sales_shipping_suspension=PRESERVED')
