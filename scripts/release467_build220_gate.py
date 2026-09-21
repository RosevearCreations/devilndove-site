#!/usr/bin/env python3
from pathlib import Path
import json,re,subprocess,sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
DEV='d05924a6c395b9ff2d6cd667d335d690de995805';TREE='c41a2fd13e69a517d258a2b7e8a5c6af47706e1b';MAIN='6442fc479a61ff1083567a40a46a2987aba12844'
PROOFS={'system_gate_run':35559932353,'current_application_quality_run':35559932262,'it_admin_runtime_proof_run':35559932380,'branch_hygiene_run':35559932232}
def req(ok,msg):
 if not ok:FAIL.append(msg)
def read(p):
 f=ROOT/p
 if not f.is_file():FAIL.append('missing '+p);return''
 return f.read_text(encoding='utf-8',errors='replace')
def load(p):return json.loads(read(p) or '{}')
p=load('current-development-authority.json');b=load('release467-build220-production-run-qa-rework-scrap-evidence.json');b219=load('release467-build219-manufacturing-work-order-job-traveler.json');m=load('migrations/canonical/manifest.json')
mig=read('migrations/canonical/0019_release467_production_run_qa_rework_scrap_evidence.sql');api=read('functions/api/admin/production-run-evidence.js');ui=read('public/js/admin-production-run-evidence-build220.js');page=read('admin/custom-request/index.html')
req(p.get('build')==220 and p.get('title')=='Production Run, QA, Rework & Scrap Evidence','Build 220 pointer identity drifted')
req(p.get('accepted_dev_sha')==DEV and p.get('accepted_dev_tree_sha')==TREE and (p.get('acceptance') or {})==PROOFS,'Build 220 predecessor Development proof drifted')
prod=p.get('production_checkpoint') or {}
req(prod.get('build')==219 and prod.get('main_sha')==MAIN and prod.get('tree_sha')==TREE and int(prod.get('production_pages_deploy_run') or 0)==35560514490 and int(prod.get('production_live_resource_integrity_run') or 0)==35560585150,'Build 219 Production predecessor drifted')
req(b.get('build')==220 and b.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE','Build 220 authority drifted')
req(b219.get('state')=='PRODUCTION_GREEN','Build 219 retained authority must be Production GREEN')
files=[x.get('file') for x in m.get('migrations',[]) if isinstance(x,dict)]
req(len(files)==19 and files[-1]=='0019_release467_production_run_qa_rework_scrap_evidence.sql','Build 220 canonical migration 0019 is not current tail')
for token in ('CREATE TABLE IF NOT EXISTS creative_project_production_runs','CREATE TABLE IF NOT EXISTS creative_project_production_run_operations','CREATE TABLE IF NOT EXISTS creative_project_production_run_qa_checks','CREATE TABLE IF NOT EXISTS creative_project_production_run_material_evidence','CREATE TABLE IF NOT EXISTS creative_project_production_run_handoffs','CREATE TABLE IF NOT EXISTS creative_project_production_run_events',"run_status IN ('reviewed','void')",'creative_project_job_traveler_id INTEGER NOT NULL','creative_project_inventory_post_id INTEGER NOT NULL',"handoff_kind IN ('pending','inventory','custom_order_draft','order','other')",'accepted_quantity + rework_quantity + scrap_quantity <= actual_quantity','PRAGMA foreign_key_check'):req(token in mig,'Build 220 migration missing '+token)
for ddl in ('CREATE TABLE','ALTER TABLE','DROP TABLE','CREATE INDEX','DROP INDEX','CREATE VIEW','DROP VIEW'):req(ddl not in api.upper(),'Build 220 API contains request-time DDL '+ddl)
for token in ('creative_project_job_travelers','creative_project_production_runs','creative_project_production_run_operations','creative_project_production_run_qa_checks','creative_project_production_run_material_evidence','creative_project_production_run_handoffs','creative_project_inventory_posts','custom_request_order_drafts','orders',"action!=='record_run'","action==='void_run'",'material_reconciliation_note','accepted_quantity','rework_quantity','scrap_quantity','inventory_mutation:false','inventory_movement_creation:false','order_mutation:false','finance_mutation:false','accounting_posting:false'):req(token in api,'Build 220 API missing '+token)
for forbidden in ('UPDATE site_item_inventory','INSERT INTO site_inventory_movements','INSERT INTO site_inventory_usage_movements','UPDATE creative_project_inventory_posts','INSERT INTO creative_project_inventory_posts','UPDATE custom_requests','UPDATE custom_request_order_drafts','UPDATE orders','INSERT INTO accounting_','INSERT INTO payments','INSERT INTO payment_','bucket.put(','bucket.delete('):req(forbidden not in api,'Build 220 crosses source authority boundary: '+forbidden)
for token in ('Production Run, QA, Rework &amp; Scrap Evidence','Run identity &amp; quantity outcome','Operation timestamps, outcomes &amp; checkpoints','QA checkpoints','Actual material usage reconciliation','Finished inventory / order handoff evidence','Record reviewed production run','Corrections are void-and-replace'):req(token in ui,'Build 220 UI missing '+token)
req('customWorkProductionRun220Mount' in page and '/public/js/admin-production-run-evidence-build220.js?v=467b220' in page,'Custom Work page missing Build 220 production-run workspace')
req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,'Custom Work page must retain exactly one H1')
for path in ('functions/api/admin/production-run-evidence.js','public/js/admin-production-run-evidence-build220.js'):
 q=subprocess.run(['node','--check',str(ROOT/path)],text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
 req(q.returncode==0,path+' syntax failed: '+(q.stderr or q.stdout)[-1500:])
if FAIL:
 print('RELEASE 467 BUILD 220 PRODUCTION RUN QA REWORK SCRAP EVIDENCE: FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('RELEASE 467 BUILD 220 PRODUCTION RUN QA REWORK SCRAP EVIDENCE: PASS')
print('Canonical migration: 0019')
print('Run evidence authority: REVIEWED VOID-AND-REPLACE')
print('Inventory movement / order / Finance mutation: ZERO')
