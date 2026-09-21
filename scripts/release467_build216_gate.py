#!/usr/bin/env python3
from pathlib import Path
import json,re,subprocess,sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
DEV='2f9b0187110ffa0bd754eba1087f6ce56c23a0e4';TREE='5bc30361efc9166f90aa8a7a4761646389325625';MAIN='0e6312ed188c3423fdf32b18c892ff4d17c387bc'
PROOFS={'system_gate_run':35552576564,'current_application_quality_run':35552576510,'it_admin_runtime_proof_run':35552576480,'branch_hygiene_run':35552576583}
def req(ok,msg):
 if not ok:FAIL.append(msg)
def read(p):
 f=ROOT/p
 if not f.is_file():FAIL.append(f'missing {p}');return''
 return f.read_text(encoding='utf-8',errors='replace')
def load(p):return json.loads(read(p) or '{}')
p=load('current-development-authority.json');b=load('release467-build216-customer-supplied-item-suitability-review.json');m=load('migrations/canonical/manifest.json')
mig=read('migrations/canonical/0016_release467_customer_supplied_item_suitability_review.sql')
admin_api=read('functions/api/admin/custom-work-supplied-item.js');public_api=read('functions/api/custom-request.js');upload_api=read('functions/api/custom-request-reference-upload.js')
ack_api=read('functions/api/custom-request-supplied-item-acknowledgement.js');admin_ui=read('public/js/admin-custom-work-supplied-item-build216.js')
intake_ui=read('public/js/custom-request-intake.js');ack_ui=read('public/js/custom-request-supplied-item-acknowledgement.js')
admin_page=read('admin/custom-request/index.html');public_page=read('custom-request/index.html');ack_page=read('custom-request/supplied-item/index.html')
req(int(p.get('build') or 0)>=216,'current successor must retain Build 216 or later')
req(b.get('build')==216 and b.get('state')=='PRODUCTION_GREEN','Build 216 retained authority must be Production GREEN')
final=b.get('final_closure') or {};proofs=final.get('proofs') or {}
req(final.get('dev_sha')==DEV and final.get('tree_sha')==TREE and proofs==PROOFS and int(final.get('build_specific_proof_run') or 0)==35552576627,'Build 216 exact Development closure drifted')
prod=b.get('production_checkpoint') or {}
req(prod.get('main_sha')==MAIN and prod.get('tree_sha')==TREE and int(prod.get('production_pages_deploy_run') or 0)==35552841763 and int(prod.get('production_live_resource_integrity_run') or 0)==35552906462 and int(prod.get('products_browser_proof_run') or 0)==35552906457 and int(prod.get('products_route_proof_run') or 0)==35552906453 and int(prod.get('build_specific_proof_run') or 0)==35552841726 and prod.get('state')=='PRODUCTION_GREEN','Build 216 exact Production closure drifted')
files=[x.get('file') for x in m.get('migrations',[]) if isinstance(x,dict)]
req(len(files)>=16 and files[15]=='0016_release467_customer_supplied_item_suitability_review.sql','retained canonical stream lost migration 0016')
for token in (
 'CREATE TABLE IF NOT EXISTS custom_request_supplied_items','CREATE TABLE IF NOT EXISTS custom_request_supplied_item_reviews',
 'CREATE TABLE IF NOT EXISTS custom_request_supplied_item_evidence','CREATE TABLE IF NOT EXISTS custom_request_supplied_item_acknowledgements',
 'REFERENCES custom_requests(custom_request_id)',"decision IN ('needs_review','accepted','accepted_with_limitations','declined')",
 "evidence_status IN ('active','void')","acknowledgement_status IN ('active','acknowledged','declined','superseded','expired')",'PRAGMA foreign_key_check'
):req(token in mig,f'Build 216 retained migration missing {token}')
for src,label in ((admin_api,'admin API'),(public_api,'public intake API'),(upload_api,'reference-upload API'),(ack_api,'acknowledgement API')):
 for ddl in ('CREATE TABLE','ALTER TABLE','DROP TABLE','CREATE INDEX'):
  req(ddl not in src.upper(),f'Build 216 retained {label} contains request-time DDL {ddl}')
for token in ('custom_request_supplied_items','custom_request_supplied_item_reviews','custom_request_supplied_item_evidence','custom_request_supplied_item_acknowledgements',"action==='record_review'","action==='void_evidence'",'automatic_production_start:false','inventory_mutation:false'):
 req(token in admin_api,f'Build 216 retained admin API missing {token}')
for forbidden in ('INSERT INTO payments','INSERT INTO orders','UPDATE site_item_inventory','bucket.put(','bucket.delete('):
 req(forbidden not in admin_api,f'Build 216 retained API crosses owner boundary: {forbidden}')
for token in ('Customer-supplied item intake & suitability','Condition evidence','Staff suitability review','Customer limitation acknowledgement'):
 req(token in admin_ui,f'Build 216 retained admin UI missing {token}')
req('customWorkSuppliedItem216Mount' in admin_page and '/public/js/admin-custom-work-supplied-item-build216.js?v=467b216' in admin_page,'Custom Work page lost Build 216 workspace')
req('/public/js/custom-request-intake.js?v=467b216' in public_page,'Public Custom Work page lost Build 216 intake client')
req('/public/js/custom-request-supplied-item-acknowledgement.js?v=467b216' in ack_page,'Private acknowledgement page lost Build 216 client')
for path in ('functions/api/admin/custom-work-supplied-item.js','functions/api/custom-request.js','functions/api/custom-request-reference-upload.js','functions/api/custom-request-supplied-item-acknowledgement.js','public/js/admin-custom-work-supplied-item-build216.js','public/js/custom-request-intake.js','public/js/custom-request-supplied-item-acknowledgement.js'):
 q=subprocess.run(['node','--check',str(ROOT/path)],text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);req(q.returncode==0,f'{path} syntax failed: {(q.stderr or q.stdout)[-1200:]}')
if FAIL:
 print('RELEASE 467 BUILD 216 CUSTOMER-SUPPLIED ITEM SUITABILITY REVIEW: FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('RELEASE 467 BUILD 216 CUSTOMER-SUPPLIED ITEM SUITABILITY REVIEW: PASS')
print('Build 216 Development closure: EXACT GREEN')
print('Build 216 Production closure: EXACT GREEN')
print('Build 216 authority: RETAINED BY SUCCESSOR')
