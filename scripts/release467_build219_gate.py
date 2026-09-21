#!/usr/bin/env python3
from pathlib import Path
import json,re,subprocess,sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
DEV='068b99a9f4f5e32e4d3547a69a23549d9dcd1c1a';TREE='0bb22258a030eb529be3a7b5faf9ba12baa66f46';MAIN='24b59add984ea0be5acc3ebe3bf8ae558db747ee'
PROOFS={'system_gate_run':35556952902,'current_application_quality_run':35556952735,'it_admin_runtime_proof_run':35556952815,'branch_hygiene_run':35556952797}
def req(ok,msg):
 if not ok:FAIL.append(msg)
def read(p):
 f=ROOT/p
 if not f.is_file():FAIL.append('missing '+p);return''
 return f.read_text(encoding='utf-8',errors='replace')
def load(p):return json.loads(read(p) or '{}')
p=load('current-development-authority.json');b=load('release467-build219-manufacturing-work-order-job-traveler.json');b218=load('release467-build218-quote-production-cost-margin-guardrails.json');m=load('migrations/canonical/manifest.json')
mig=read('migrations/canonical/0018_release467_manufacturing_work_order_job_traveler.sql');api=read('functions/api/admin/manufacturing-job-traveler.js');ui=read('public/js/admin-manufacturing-job-traveler-build219.js');page=read('admin/custom-request/index.html')
req(p.get('build')==219 and p.get('title')=='Manufacturing Work Order & Job Traveler','Build 219 pointer identity drifted')
req(p.get('accepted_dev_sha')==DEV and p.get('accepted_dev_tree_sha')==TREE and (p.get('acceptance') or {})==PROOFS,'Build 219 predecessor Development proof drifted')
prod=p.get('production_checkpoint') or {}
req(prod.get('build')==218 and prod.get('main_sha')==MAIN and prod.get('tree_sha')==TREE and int(prod.get('production_pages_deploy_run') or 0)==35557094198 and int(prod.get('production_live_resource_integrity_run') or 0)==35557137931,'Build 218 Production predecessor drifted')
req(b.get('build')==219 and b.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE','Build 219 authority drifted')
req(b218.get('state')=='PRODUCTION_GREEN','Build 218 retained authority must be Production GREEN')
files=[x.get('file') for x in m.get('migrations',[]) if isinstance(x,dict)]
req(len(files)==18 and files[-1]=='0018_release467_manufacturing_work_order_job_traveler.sql','Build 219 canonical migration 0018 is not current tail')
for token in ('CREATE TABLE IF NOT EXISTS creative_project_job_travelers','CREATE TABLE IF NOT EXISTS creative_project_job_traveler_events','creative_project_manufacturing_lifecycle_id INTEGER NOT NULL','creative_work_project_id INTEGER NOT NULL',"traveler_status IN ('reviewed','superseded','void')",'snapshot_json TEXT NOT NULL','snapshot_sha256 TEXT NOT NULL','supersedes_job_traveler_id','PRAGMA foreign_key_check'):req(token in mig,'Build 219 migration missing '+token)
for ddl in ('CREATE TABLE','ALTER TABLE','DROP TABLE','CREATE INDEX','DROP INDEX','CREATE VIEW','DROP VIEW'):req(ddl not in api.upper(),'Build 219 API contains request-time DDL '+ddl)
for token in ('creative_project_manufacturing_lifecycles','custom_request_proof_versions','creative_project_operations','creative_project_operation_resources','site_item_inventory','custom_request_supplied_items','custom_request_supplied_item_reviews','custom_request_supplied_item_acknowledgements','custom_request_quote_batch_terms','creative_project_job_travelers','creative_project_job_traveler_events',"action==='review_traveler'","action==='void_traveler'",'snapshot_sha256','evidence_capture_checklist','orchestration_only:true','product_mutation:false','inventory_mutation:false','packaging_mutation:false','caip_mutation:false','finance_mutation:false'):req(token in api,'Build 219 API missing '+token)
for forbidden in ('UPDATE custom_requests','UPDATE creative_project_operations','UPDATE creative_project_operation_resources','UPDATE creative_project_manufacturing_lifecycles','UPDATE custom_request_proof_versions','UPDATE custom_request_supplied_items','UPDATE custom_request_quote_batch_terms','UPDATE products','UPDATE site_item_inventory','INSERT INTO accounting_','INSERT INTO payments','INSERT INTO orders','bucket.put(','bucket.delete('):req(forbidden not in api,'Build 219 crosses source authority boundary: '+forbidden)
for token in ('Manufacturing Work Order &amp; Job Traveler','Work order identity','Approved proof / sample','Ordered operations, materials/tools &amp; setup notes','Customer wording &amp; personalization','Checkpoints &amp; supplied-item limitations','Packaging &amp; handoff','Evidence-capture checklist','Review &amp; create traveler version','does not edit Product, Inventory, Packaging, CAIP or Finance'):req(token in ui,'Build 219 UI missing '+token)
req('customWorkJobTraveler219Mount' in page and '/public/js/admin-manufacturing-job-traveler-build219.js?v=467b219' in page,'Custom Work page missing Build 219 traveler workspace')
req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,'Custom Work page must retain exactly one H1')
for path in ('functions/api/admin/manufacturing-job-traveler.js','public/js/admin-manufacturing-job-traveler-build219.js'):
 q=subprocess.run(['node','--check',str(ROOT/path)],text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
 req(q.returncode==0,path+' syntax failed: '+(q.stderr or q.stdout)[-1500:])
if FAIL:
 print('RELEASE 467 BUILD 219 MANUFACTURING WORK ORDER JOB TRAVELER: FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('RELEASE 467 BUILD 219 MANUFACTURING WORK ORDER JOB TRAVELER: PASS')
print('Canonical migration: 0018')
print('Traveler authority: VERSIONED REVIEWED SNAPSHOT')
print('Source authority edits: ZERO')
print('Product / Inventory / Packaging / CAIP / Finance / provider mutation: ZERO')
