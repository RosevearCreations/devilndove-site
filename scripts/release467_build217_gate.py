#!/usr/bin/env python3
from pathlib import Path
import json,re,subprocess,sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
DEV='17d606f63d91ec178668c215caf263b95e3bd580';TREE='cffc68c278b69f389372e4d43c022a9f0140a9d1';MAIN='94a977f0732cc649037423a415dfba60417d4a47'
PROOFS={'system_gate_run':35553944193,'current_application_quality_run':35553944303,'it_admin_runtime_proof_run':35553944241,'branch_hygiene_run':35553944239}
def req(ok,msg):
 if not ok:FAIL.append(msg)
def read(p):
 f=ROOT/p
 if not f.is_file():FAIL.append(f'missing {p}');return''
 return f.read_text(encoding='utf-8',errors='replace')
def load(p):return json.loads(read(p) or '{}')
p=load('current-development-authority.json');b=load('release467-build217-production-cost-evidence-v2.json');m=load('migrations/canonical/manifest.json')
mig=read('migrations/canonical/0017_release467_production_cost_evidence_v2.sql')
api=read('functions/api/admin/production-cost-evidence.js');ui=read('public/js/admin-production-cost-evidence-build217.js')
page=read('admin/creative-process/index.html');recon=read('functions/api/admin/project-profitability-reconciliation.js');recon_ui=read('public/js/admin-project-profitability-reconciliation.js')
req(int(p.get('build') or 0)>=217,'current successor must retain Build 217 or later')
req(b.get('build')==217 and b.get('state')=='PRODUCTION_GREEN','Build 217 retained authority must be Production GREEN')
final=b.get('final_closure') or {}
req(final.get('dev_sha')==DEV and final.get('tree_sha')==TREE and (final.get('proofs') or {})==PROOFS and int(final.get('build_specific_proof_run') or 0)==35553944296,'Build 217 exact Development closure drifted')
prod=b.get('production_checkpoint') or {}
req(prod.get('main_sha')==MAIN and prod.get('tree_sha')==TREE and int(prod.get('production_pages_deploy_run') or 0)==35554258043 and int(prod.get('production_live_resource_integrity_run') or 0)==35554327033 and int(prod.get('products_browser_proof_run') or 0)==35554326994 and int(prod.get('products_route_proof_run') or 0)==35554327019 and int(prod.get('build_specific_proof_run') or 0)==35554258012 and prod.get('state')=='PRODUCTION_GREEN','Build 217 exact Production closure drifted')
files=[x.get('file') for x in m.get('migrations',[]) if isinstance(x,dict)]
req(len(files)>=17 and files[16]=='0017_release467_production_cost_evidence_v2.sql','retained canonical stream lost migration 0017')
for token in (
 'CREATE TABLE IF NOT EXISTS creative_project_production_cost_evidence','REFERENCES creative_work_projects(creative_work_project_id)',
 'REFERENCES creative_project_operations(creative_project_operation_id)',"cost_evidence_state IN ('unknown','partial','reviewed')",
 "evidence_status IN ('active','void')",'design_setup_minutes','machine_minutes','hands_on_labour_minutes',
 'consumables_cost_cents','packaging_cost_cents','prototype_waste_cost_cents','rework_cost_cents','finishing_cost_cents',
 'outside_service_cost_cents','failed_prototype_count','quantity_produced','quantity_accepted','PRAGMA foreign_key_check'
):req(token in mig,f'Build 217 retained migration missing {token}')
for ddl in ('CREATE TABLE','ALTER TABLE','DROP TABLE','CREATE INDEX','DROP INDEX'):req(ddl not in api.upper(),f'Build 217 retained API contains request-time DDL {ddl}')
for token in ('creative_project_production_cost_evidence','creative_project_inventory_posts','known_direct_cost_cents','unknown_cost_is_zero:false',"profitability_owner:'Finance/Accounting'","inventory_material_usage_owner:'Inventory'"):
 req(token in api,f'Build 217 retained API missing {token}')
for token in ('Production Cost Evidence v2','Blank cost fields stay','Inventory-owned material usage','quantity_produced','quantity_accepted','failed_prototype_count'):
 req(token in ui,f'Build 217 retained UI missing {token}')
req('productionCostEvidence217Mount' in page and '/public/js/admin-production-cost-evidence-build217.js?v=467b217' in page,'Creative Process page lost Build 217 workspace')
req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,'Creative Process page must retain exactly one H1')
for token in ('creative_project_production_cost_evidence','production_cost_evidence_v2','known_direct_cost_cents','unknown_cost_is_zero'):
 req(token in recon,f'profitability reconciliation lost Build 217 evidence: {token}')
for token in ('Production cost source evidence','known_direct_cost_cents','cost_evidence_state'):
 req(token in recon_ui,f'profitability reconciliation UI lost Build 217 evidence: {token}')
for path in ('functions/api/admin/production-cost-evidence.js','public/js/admin-production-cost-evidence-build217.js','functions/api/admin/project-profitability-reconciliation.js','public/js/admin-project-profitability-reconciliation.js'):
 q=subprocess.run(['node','--check',str(ROOT/path)],text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
 req(q.returncode==0,f'{path} syntax failed: {(q.stderr or q.stdout)[-1200:]}')
if FAIL:
 print('RELEASE 467 BUILD 217 PRODUCTION COST EVIDENCE V2: FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('RELEASE 467 BUILD 217 PRODUCTION COST EVIDENCE V2: PASS')
print('Build 217 Development closure: EXACT GREEN')
print('Build 217 Production closure: EXACT GREEN')
print('Build 217 authority: RETAINED BY SUCCESSOR')
