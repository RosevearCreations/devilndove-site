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
p=load('current-development-authority.json');b=load('release467-build217-production-cost-evidence-v2.json');b216=load('release467-build216-customer-supplied-item-suitability-review.json');m=load('migrations/canonical/manifest.json')
mig=read('migrations/canonical/0017_release467_production_cost_evidence_v2.sql')
api=read('functions/api/admin/production-cost-evidence.js');ui=read('public/js/admin-production-cost-evidence-build217.js')
page=read('admin/creative-process/index.html');recon=read('functions/api/admin/project-profitability-reconciliation.js');recon_ui=read('public/js/admin-project-profitability-reconciliation.js')
req(p.get('build')==217 and p.get('title')=='Production Cost Evidence v2','Build 217 pointer identity drifted')
req(p.get('accepted_dev_sha')==DEV and p.get('accepted_dev_tree_sha')==TREE and (p.get('acceptance') or {})==PROOFS,'Build 217 predecessor Development proof drifted')
prod=p.get('production_checkpoint') or {}
req(prod.get('build')==216 and prod.get('main_sha')==MAIN and prod.get('tree_sha')==TREE and int(prod.get('production_pages_deploy_run') or 0)==35552841763 and int(prod.get('production_live_resource_integrity_run') or 0)==35552906462,'Build 216 Production predecessor drifted')
req(b.get('build')==217 and b.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE','Build 217 authority drifted')
req(b216.get('state')=='PRODUCTION_GREEN','Build 216 retained authority must be Production GREEN')
files=[x.get('file') for x in m.get('migrations',[]) if isinstance(x,dict)]
req(len(files)==17 and files[-1]=='0017_release467_production_cost_evidence_v2.sql','canonical migration stream must end at 0017')
for token in (
 'CREATE TABLE IF NOT EXISTS creative_project_production_cost_evidence','REFERENCES creative_work_projects(creative_work_project_id)',
 'REFERENCES creative_project_operations(creative_project_operation_id)',"cost_evidence_state IN ('unknown','partial','reviewed')",
 "evidence_status IN ('active','void')",'design_setup_minutes','machine_minutes','hands_on_labour_minutes','consumables_cost_cents',
 'packaging_cost_cents','prototype_waste_cost_cents','rework_cost_cents','finishing_cost_cents','outside_service_cost_cents',
 'failed_prototype_count','quantity_produced','quantity_accepted','PRAGMA foreign_key_check'
):req(token in mig,f'Build 217 migration missing {token}')
req('INSERT INTO creative_project_production_cost_evidence' not in mig,'migration 0017 must create no production-cost business rows')
for ddl in ('CREATE TABLE','ALTER TABLE','DROP TABLE','CREATE INDEX','DROP INDEX'):req(ddl not in api.upper(),f'Build 217 API contains request-time DDL {ddl}')
for token in (
 'creative_project_production_cost_evidence','creative_project_operations','creative_project_inventory_posts','creative_project_inventory_usage_details',
 'creative_work_events',"action==='record_evidence'","action==='void_evidence'",'known_direct_cost_cents','unknown_cost_is_zero:false',
 "profitability_owner:'Finance/Accounting'","inventory_material_usage_owner:'Inventory'"
):req(token in api,f'Build 217 API missing {token}')
for forbidden in ('UPDATE site_item_inventory','INSERT INTO site_inventory_movements','INSERT INTO creative_project_profitability','UPDATE creative_project_profitability','INSERT INTO accounting_','INSERT INTO payments','INSERT INTO orders','bucket.put(','bucket.delete('):
 req(forbidden not in api,f'Build 217 API crosses owner boundary: {forbidden}')
for token in ('Production Cost Evidence v2','Blank cost fields stay','Inventory-owned material usage','quantity_produced','quantity_accepted','failed_prototype_count'):
 req(token in ui,f'Build 217 UI missing {token}')
req('productionCostEvidence217Mount' in page and '/public/js/admin-production-cost-evidence-build217.js?v=467b217' in page,'Creative Process page missing Build 217 workspace')
req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,'Creative Process page must retain exactly one H1')
for token in ('creative_project_production_cost_evidence','production_cost_evidence_v2','known_direct_cost_cents','unknown_cost_is_zero'):
 req(token in recon,f'profitability reconciliation missing Build 217 source evidence: {token}')
for token in ('Production cost source evidence','known_direct_cost_cents','cost_evidence_state'):
 req(token in recon_ui,f'profitability reconciliation UI missing Build 217 evidence: {token}')
for path in ('functions/api/admin/production-cost-evidence.js','public/js/admin-production-cost-evidence-build217.js','functions/api/admin/project-profitability-reconciliation.js','public/js/admin-project-profitability-reconciliation.js'):
 q=subprocess.run(['node','--check',str(ROOT/path)],text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
 req(q.returncode==0,f'{path} syntax failed: {(q.stderr or q.stdout)[-1500:]}')
if FAIL:
 print('RELEASE 467 BUILD 217 PRODUCTION COST EVIDENCE V2: FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('RELEASE 467 BUILD 217 PRODUCTION COST EVIDENCE V2: PASS')
print('Inventory material usage/cost authority: REUSED')
print('Finance/Accounting profitability/posting authority: PRESERVED')
print('Unknown cost -> zero: FORBIDDEN')
print('Production cost source evidence: APPEND + VOID HISTORY')
print('Automatic Inventory / Finance / Accounting / provider execution: ZERO')
