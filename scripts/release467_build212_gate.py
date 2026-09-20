#!/usr/bin/env python3
from pathlib import Path
import json,re,subprocess,sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
DEV='a7f07b18a4a3b24db1a148ec287cbf446041f573';TREE='b80ccbfb772ccc4384e6fc0a2c53a62341e4caf7';MAIN='41bf65727771c7c302c022d0944945a0802a909d'
PROOFS={'system_gate_run':35524455791,'current_application_quality_run':35524455693,'it_admin_runtime_proof_run':35524455845,'branch_hygiene_run':35524455852}
def req(ok,msg):
 if not ok:FAIL.append(msg)
def read(p):
 f=ROOT/p
 if not f.is_file():FAIL.append(f'missing {p}');return''
 return f.read_text(encoding='utf-8',errors='replace')
def load(p):return json.loads(read(p) or '{}')
p=load('current-development-authority.json');b=load('release467-build212-hybrid-creative-project-operations.json');b211=load('release467-build211-manufacturing-triage-route.json');m=load('migrations/canonical/manifest.json')
mig=read('migrations/canonical/0012_release467_hybrid_creative_project_operations.sql');api=read('functions/api/admin/creative-project-operations.js');client=read('public/js/admin-creative-project-operations-build212.js');page=read('admin/creative-process/index.html')
req(p.get('build')==212 and p.get('title')=='Hybrid Creative Project Operations','Build 212 current pointer identity drifted')
req(p.get('accepted_dev_sha')==DEV and p.get('accepted_dev_tree_sha')==TREE and (p.get('acceptance') or {})==PROOFS,'Build 212 predecessor Development proof drifted')
prod=p.get('production_checkpoint') or {};req(prod.get('build')==211 and prod.get('main_sha')==MAIN and prod.get('tree_sha')==TREE and int(prod.get('production_pages_deploy_run') or 0)==35524655164 and int(prod.get('production_live_resource_integrity_run') or 0)==35524741052,'Build 211 Production predecessor drifted')
req(b.get('build')==212 and b.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE','Build 212 authority drifted')
req(b211.get('state')=='PRODUCTION_GREEN','Build 211 must remain Production GREEN')
files=[x.get('file') for x in m.get('migrations',[]) if isinstance(x,dict)];req(len(files)==12 and files[-1]=='0012_release467_hybrid_creative_project_operations.sql','canonical migration stream must end at 0012')
for token in (
 'CREATE TABLE IF NOT EXISTS creative_project_operations',
 'CREATE TABLE IF NOT EXISTS creative_project_operation_dependencies',
 'CREATE TABLE IF NOT EXISTS creative_project_operation_resources',
 'REFERENCES creative_work_projects(creative_work_project_id)',
 'REFERENCES inventory_processes(inventory_process_id)',
 'REFERENCES site_item_inventory(site_item_inventory_id)',
 'UNIQUE(creative_work_project_id, operation_order)',
 'CHECK(creative_project_operation_id <> predecessor_operation_id)'
):req(token in mig,f'Build 212 migration missing {token}')
for forbidden in ('INSERT INTO creative_project_operations','INSERT INTO creative_project_operation_dependencies','INSERT INTO creative_project_operation_resources'):req(forbidden not in mig,'migration 0012 must create no planning rows')
for ddl in ('CREATE TABLE','ALTER TABLE','DROP TABLE','CREATE INDEX','DROP INDEX'):req(ddl not in api.upper(),f'Build 212 API contains request-time DDL {ddl}')
for forbidden in ('UPDATE site_item_inventory','INSERT INTO site_inventory_movements','INSERT INTO creative_work_events','INSERT INTO creative_projects','INSERT INTO creative_assets','INSERT INTO accounting_','bucket.put(','bucket.delete('):req(forbidden not in api,f'Build 212 API touches forbidden owner authority: {forbidden}')
for token in ('creative_work_projects','inventory_processes','site_item_inventory','creative_project_operations','creative_project_operation_dependencies','creative_project_operation_resources','planning_only:true','inventory_mutation:false','caip_media_mutation:false','actual_event_creation:false','finance_posting:false','save_sequence','save_dependency','save_resource'):req(token in api,f'Build 212 API missing {token}')
for token in ('Hybrid Creative Project operations','Canonical process','Add operation dependency','Plan material / tool reference','Inventory remains unchanged','actual usage/time/evidence is not written here'):req(token in client,f'Build 212 client missing {token}')
req('creativeOperations212Mount' in page and '/public/js/admin-creative-project-operations-build212.js?v=467b212' in page,'Creative Process page missing Build 212 operation planner')
req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,'Creative Process page must retain exactly one H1')
for path in ('functions/api/admin/creative-project-operations.js','public/js/admin-creative-project-operations-build212.js'):
 q=subprocess.run(['node','--check',str(ROOT/path)],text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);req(q.returncode==0,f'{path} syntax failed: {(q.stderr or q.stdout)[-1000:]}')
if FAIL:print('RELEASE 467 BUILD 212 HYBRID CREATIVE PROJECT OPERATIONS: FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('RELEASE 467 BUILD 212 HYBRID CREATIVE PROJECT OPERATIONS: PASS')
print('Project authority: creative_work_projects')
print('Process authority: inventory_processes')
print('Inventory/CAIP/actual-event/Finance mutation: ZERO')
