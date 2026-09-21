#!/usr/bin/env python3
from pathlib import Path
import json,re,subprocess,sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
DEV='825814b09a7c3f05c6fddc223ec8876ade0bbc35';TREE='f1facb7a27e22f3a129654713cc6dd109e3b6b16';MAIN='c8366bde7fb2e7c673be656ff85265058a407c4a'
PROOFS={'system_gate_run':35548513112,'current_application_quality_run':35548513093,'it_admin_runtime_proof_run':35548513139,'branch_hygiene_run':35548513160}
def req(ok,msg):
 if not ok:FAIL.append(msg)
def read(p):
 f=ROOT/p
 if not f.is_file():FAIL.append(f'missing {p}');return''
 return f.read_text(encoding='utf-8',errors='replace')
def load(p):return json.loads(read(p) or '{}')
p=load('current-development-authority.json');b=load('release467-build216-customer-supplied-item-suitability-review.json');b215=load('release467-build215-small-batch-corporate-event-quoting.json');m=load('migrations/canonical/manifest.json')
mig=read('migrations/canonical/0016_release467_customer_supplied_item_suitability_review.sql')
admin_api=read('functions/api/admin/custom-work-supplied-item.js')
public_api=read('functions/api/custom-request.js');upload_api=read('functions/api/custom-request-reference-upload.js')
ack_api=read('functions/api/custom-request-supplied-item-acknowledgement.js')
admin_ui=read('public/js/admin-custom-work-supplied-item-build216.js')
intake_ui=read('public/js/custom-request-intake.js');ack_ui=read('public/js/custom-request-supplied-item-acknowledgement.js')
admin_page=read('admin/custom-request/index.html');public_page=read('custom-request/index.html');ack_page=read('custom-request/supplied-item/index.html')
readiness=read('functions/api/_lib/publicRuntimeSchemaReadiness.js')
req(p.get('build')==216 and p.get('title')=='Customer-Supplied Item Intake & Suitability Review','Build 216 pointer identity drifted')
req(p.get('accepted_dev_sha')==DEV and p.get('accepted_dev_tree_sha')==TREE and (p.get('acceptance') or {})==PROOFS,'Build 216 predecessor Development proof drifted')
prod=p.get('production_checkpoint') or {};req(prod.get('build')==215 and prod.get('main_sha')==MAIN and prod.get('tree_sha')==TREE and int(prod.get('production_pages_deploy_run') or 0)==35548670491 and int(prod.get('production_live_resource_integrity_run') or 0)==35548742503,'Build 215 Production predecessor drifted')
req(b.get('build')==216 and b.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE','Build 216 authority drifted')
req(b215.get('state')=='PRODUCTION_GREEN','Build 215 must remain Production GREEN')
files=[x.get('file') for x in m.get('migrations',[]) if isinstance(x,dict)];req(len(files)==16 and files[-1]=='0016_release467_customer_supplied_item_suitability_review.sql','canonical migration stream must end at 0016')
for token in (
 'CREATE TABLE IF NOT EXISTS custom_request_supplied_items',
 'CREATE TABLE IF NOT EXISTS custom_request_supplied_item_reviews',
 'CREATE TABLE IF NOT EXISTS custom_request_supplied_item_evidence',
 'CREATE TABLE IF NOT EXISTS custom_request_supplied_item_acknowledgements',
 'REFERENCES custom_requests(custom_request_id)',
 'REFERENCES custom_request_manufacturing_triage(custom_request_manufacturing_triage_id)',
 'REFERENCES custom_request_reference_uploads(custom_request_reference_upload_id)',
 'REFERENCES custom_order_stage_photos(custom_order_stage_photo_id)',
 "decision IN ('needs_review','accepted','accepted_with_limitations','declined')",
 "evidence_role IN ('intake_condition','post_work_condition','other')",
 "evidence_status IN ('active','void')",
 "acknowledgement_status IN ('active','acknowledged','declined','superseded','expired')",
 'idx_custom_request_supplied_item_ack_active',
 'PRAGMA foreign_key_check'
):req(token in mig,f'Build 216 migration missing {token}')
for forbidden in (
 'INSERT INTO custom_request_supplied_items','INSERT INTO custom_request_supplied_item_reviews',
 'INSERT INTO custom_request_supplied_item_evidence','INSERT INTO custom_request_supplied_item_acknowledgements'
):req(forbidden not in mig,'migration 0016 must create no supplied-item business rows')
for src,label in ((admin_api,'admin API'),(public_api,'public intake API'),(upload_api,'reference-upload API'),(ack_api,'acknowledgement API')):
 for ddl in ('CREATE TABLE','ALTER TABLE','DROP TABLE','CREATE INDEX','DROP INDEX'):
  req(ddl not in src.upper(),f'Build 216 {label} contains request-time DDL {ddl}')
for token in (
 'custom_request_manufacturing_triage','custom_request_reference_uploads','custom_order_stage_photos',
 'custom_request_supplied_items','custom_request_supplied_item_reviews','custom_request_supplied_item_evidence',
 'custom_request_supplied_item_acknowledgements',
 "decision==='accepted'&&triageState!=='acceptable_for_assessment'",
 "decision==='accepted_with_limitations'&&triageState!=='limitations_required'",
 "decision==='declined'&&triageState!=='declined'",
 "action==='record_review'","action==='create_acknowledgement_link'","action==='void_evidence'",
 'automatic_feasibility_promise:false','automatic_production_start:false','inventory_mutation:false','provider_execution:false'
):req(token in admin_api,f'Build 216 admin API missing {token}')
for forbidden in ('INSERT INTO payments','INSERT INTO orders','UPDATE site_item_inventory','bucket.put(','bucket.delete('):
 req(forbidden not in admin_api,f'Build 216 admin API touches forbidden execution/media authority: {forbidden}')
for token in ('hasCustomRequestSuppliedItemSchema','INSERT INTO custom_request_supplied_items','supplied_item_intake_recorded'):
 req(token in public_api,f'Build 216 public intake missing {token}')
for token in ('evidence_role','intake_condition','custom_request_supplied_item_evidence','hasCustomRequestSuppliedItemSchema'):
 req(token in upload_api,f'Build 216 reference-upload integration missing {token}')
req('bucket.put(' in upload_api,'existing reference-upload media owner must retain upload authority')
for token in ('accepted_with_limitations','limitations_acknowledged','production_started:false','payment_executed:false','inventory_reserved:false'):
 req(token in ack_api,f'Build 216 customer acknowledgement API missing {token}')
for token in ('CUSTOM_SUPPLIED_ITEM_COLUMNS','CUSTOM_SUPPLIED_ITEM_EVIDENCE_COLUMNS','hasCustomRequestSuppliedItemSchema'):
 req(token in readiness,f'Build 216 public schema readiness missing {token}')
for token in ('Customer-supplied item intake & suitability','Condition evidence','Staff suitability review','Customer limitation acknowledgement'):
 req(token in admin_ui,f'Build 216 admin UI missing {token}')
for token in ('supplied_item_condition_images','customSuppliedItemDetails','same private Custom Work upload system'):
 req(token in public_page,f'Build 216 public Custom Work page missing {token}')
for token in ('supplied_item_condition_images','evidence_role','intake_condition','5 images total'):
 req(token in intake_ui,f'Build 216 intake client missing {token}')
for token in ('Acknowledge limitations','does not mean the work has started'):
 req(token in ack_ui,f'Build 216 acknowledgement client missing {token}')
req('customWorkSuppliedItem216Mount' in admin_page and '/public/js/admin-custom-work-supplied-item-build216.js?v=467b216' in admin_page,'Custom Work page missing Build 216 workspace')
req('/public/js/custom-request-intake.js?v=467b216' in public_page,'Public Custom Work page missing Build 216 intake client')
req('/public/js/custom-request-supplied-item-acknowledgement.js?v=467b216' in ack_page,'Private acknowledgement page missing Build 216 client')
req(len(re.findall(r'<h1(?:\s|>)',admin_page,re.I))==1,'Custom Work admin page must retain one H1')
req(len(re.findall(r'<h1(?:\s|>)',public_page,re.I))==1,'Custom Work public page must retain one H1')
req(len(re.findall(r'<h1(?:\s|>)',ack_page,re.I))==1,'Supplied-item acknowledgement page must contain one H1')
for path in (
 'functions/api/admin/custom-work-supplied-item.js','functions/api/custom-request.js','functions/api/custom-request-reference-upload.js',
 'functions/api/custom-request-supplied-item-acknowledgement.js','public/js/admin-custom-work-supplied-item-build216.js',
 'public/js/custom-request-intake.js','public/js/custom-request-supplied-item-acknowledgement.js'
):
 q=subprocess.run(['node','--check',str(ROOT/path)],text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);req(q.returncode==0,f'{path} syntax failed: {(q.stderr or q.stdout)[-1500:]}')
if FAIL:print('RELEASE 467 BUILD 216 CUSTOMER-SUPPLIED ITEM SUITABILITY REVIEW: FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('RELEASE 467 BUILD 216 CUSTOMER-SUPPLIED ITEM SUITABILITY REVIEW: PASS')
print('Existing Custom Work / Build 211 triage / media authorities: REUSED')
print('Suitability reviews: APPEND-ONLY')
print('Evidence correction: VOID, NOT DELETE')
print('Unknown compatibility / material / safety facts: REMAIN UNKNOWN')
print('Automatic production / Inventory / payment / provider execution: ZERO')
