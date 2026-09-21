#!/usr/bin/env python3
from pathlib import Path
import json,re,subprocess,sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
DEV='a9fd2f4e10f8bf68d3fe9b40c82ced112cf91bb1';TREE='255d08bc787f7eb785119ceaffa61d6aa5eeefed';MAIN='e55cff067fda9a1c949e93db8ea2ea3e5f8d366f'
PROOFS={'system_gate_run':35624331277,'current_application_quality_run':35624331446,'it_admin_runtime_proof_run':35624331471,'branch_hygiene_run':35624331702}
def req(ok,msg):
 if not ok:FAIL.append(msg)
def read(p):
 f=ROOT/p
 if not f.is_file():FAIL.append('missing '+p);return''
 return f.read_text(encoding='utf-8',errors='replace')
def load(p):return json.loads(read(p) or '{}')
p=load('current-development-authority.json');b=load('release467-build222-project-knowledge-recipe-history.json');m=load('migrations/canonical/manifest.json')
mig=read('migrations/canonical/0021_release467_project_knowledge_recipe_history.sql');api=read('functions/api/admin/workshop-knowledge-promotion.js');ui=read('public/js/admin-workshop-knowledge-build222.js');page=read('admin/workshop-knowledge/index.html')
req(int(p.get('build') or 0)>=222,'current successor must retain Build 222 or later')
req(b.get('state')=='PRODUCTION_GREEN','Build 222 retained authority must be Production GREEN')
final=b.get('final_closure') or {};prod=b.get('production_checkpoint') or {}
req(final.get('dev_sha')==DEV and final.get('tree_sha')==TREE and (final.get('proofs') or {})==PROOFS and int(final.get('build_specific_proof_run') or 0)==35624331629,'Build 222 exact Development closure drifted')
req(int(final.get('canonical_migrations') or 0)==21 and int(final.get('foreign_key_violations',-1))==0,'Build 222 Development migration closure drifted')
req(prod.get('main_sha')==MAIN and prod.get('tree_sha')==TREE and int(prod.get('production_pages_deploy_run') or 0)==35624807963 and int(prod.get('production_live_resource_integrity_run') or 0)==35624977882 and int(prod.get('products_browser_proof_run') or 0)==35624977818 and int(prod.get('products_route_proof_run') or 0)==35624977830 and int(prod.get('build_specific_proof_run') or 0)==35624807852 and prod.get('state')=='PRODUCTION_GREEN','Build 222 exact Production closure drifted')
req(prod.get('business_counts')=={'users':2,'products':45,'site_item_inventory':1041,'orders':0} and int(prod.get('canonical_migrations') or 0)==21 and int(prod.get('foreign_key_violations',-1))==0,'Build 222 Production D1/business preservation drifted')
files=[x.get('file') for x in m.get('migrations',[]) if isinstance(x,dict)]
req(len(files)>=21 and files[20]=='0021_release467_project_knowledge_recipe_history.sql','retained canonical stream lost migration 0021')
for token in ('CREATE TABLE IF NOT EXISTS workshop_knowledge_recipe_versions','CREATE TABLE IF NOT EXISTS workshop_knowledge_recipe_settings',"generalization_status IN ('worked_once','repeated_observation','measured','owner_confirmed')",'REFERENCES creative_work_projects(creative_work_project_id)','REFERENCES inventory_processes(inventory_process_id)'):req(token in mig,'Build 222 migration missing '+token)
for ddl in ('CREATE TABLE','ALTER TABLE','DROP TABLE','CREATE INDEX','DROP INDEX','CREATE VIEW','DROP VIEW'):req(ddl not in api.upper(),'Build 222 retained API contains request-time DDL '+ddl)
for token in ('Project-to-Knowledge promotion &amp; recipe history','Worked once — do not generalize','Recipe version history'):req(token in ui,'Build 222 retained UI missing '+token)
req('workshopKnowledge222Mount' in page and len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,'Build 222 Workshop Knowledge surface drifted')
for path in ('functions/api/admin/workshop-knowledge-promotion.js','public/js/admin-workshop-knowledge-build222.js'):
 q=subprocess.run(['node','--check',str(ROOT/path)],text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);req(q.returncode==0,path+' syntax failed')
if FAIL:
 print('RELEASE 467 BUILD 222 PROJECT TO KNOWLEDGE PROMOTION RECIPE HISTORY: FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('RELEASE 467 BUILD 222 PROJECT TO KNOWLEDGE PROMOTION RECIPE HISTORY: PASS')
print('Build 222 Development closure: EXACT GREEN')
print('Build 222 Production closure: EXACT GREEN')
print('Build 222 authority: RETAINED BY SUCCESSOR')
