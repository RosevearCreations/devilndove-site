#!/usr/bin/env python3
from pathlib import Path
import json,re,subprocess,sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
DEV='eceee6897410295b029f08ac728b159cf7559823';TREE='321514649fa70ba2ccdc4961ca69eba08eef6962';MAIN='44cdd9aef639fc58343e0810a9a351986dd39052'
PROOFS={'system_gate_run':35619862172,'current_application_quality_run':35619862224,'it_admin_runtime_proof_run':35619862189,'branch_hygiene_run':35619862154}
def req(ok,msg):
 if not ok:FAIL.append(msg)
def read(p):
 f=ROOT/p
 if not f.is_file():FAIL.append('missing '+p);return''
 return f.read_text(encoding='utf-8',errors='replace')
def load(p):return json.loads(read(p) or '{}')
p=load('current-development-authority.json');b=load('release467-build222-project-knowledge-recipe-history.json');b221=load('release467-build221-workshop-knowledge-library-foundation.json');m=load('migrations/canonical/manifest.json')
mig=read('migrations/canonical/0021_release467_project_knowledge_recipe_history.sql');api=read('functions/api/admin/workshop-knowledge-promotion.js');ui=read('public/js/admin-workshop-knowledge-build222.js');page=read('admin/workshop-knowledge/index.html')
req(p.get('build')==222 and p.get('title')=='Project-to-Knowledge Promotion & Recipe History','Build 222 pointer identity drifted')
req(p.get('accepted_dev_sha')==DEV and p.get('accepted_dev_tree_sha')==TREE and (p.get('acceptance') or {})==PROOFS,'Build 222 predecessor Development proof drifted')
prod=p.get('production_checkpoint') or {}
req(prod.get('build')==221 and prod.get('main_sha')==MAIN and prod.get('tree_sha')==TREE and int(prod.get('production_pages_deploy_run') or 0)==35620308181 and int(prod.get('production_live_resource_integrity_run') or 0)==35620434376,'Build 221 Production predecessor drifted')
req(b.get('build')==222 and b.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE','Build 222 authority drifted')
req(b221.get('state')=='PRODUCTION_GREEN','Build 221 retained authority must be Production GREEN')
files=[x.get('file') for x in m.get('migrations',[]) if isinstance(x,dict)]
req(len(files)==21 and files[-1]=='0021_release467_project_knowledge_recipe_history.sql','Build 222 canonical migration 0021 is not current tail')
for token in ('CREATE TABLE IF NOT EXISTS workshop_knowledge_recipe_versions','CREATE TABLE IF NOT EXISTS workshop_knowledge_recipe_processes','CREATE TABLE IF NOT EXISTS workshop_knowledge_recipe_inventory_refs','CREATE TABLE IF NOT EXISTS workshop_knowledge_recipe_settings','CREATE TABLE IF NOT EXISTS workshop_knowledge_recipe_events',"recipe_state IN ('approved','superseded','void')","generalization_status IN ('worked_once','repeated_observation','measured','owner_confirmed')",'REFERENCES creative_work_projects(creative_work_project_id)','REFERENCES creative_project_operations(creative_project_operation_id)','REFERENCES inventory_processes(inventory_process_id)','REFERENCES site_item_inventory(site_item_inventory_id)','PRAGMA foreign_key_check'):req(token in mig,'Build 222 migration missing '+token)
for ddl in ('CREATE TABLE','ALTER TABLE','DROP TABLE','CREATE INDEX','DROP INDEX','CREATE VIEW','DROP VIEW'):req(ddl not in api.upper(),'Build 222 API contains request-time DDL '+ddl)
for token in ("summary_type='lessons_learned'","review_status='approved'",'promote_project_knowledge','worked_once_is_not_best:true','unknown_settings_remain_unknown:true','source_authority_mutation:false','inventory_mutation:false','media_copy:false','workshop_knowledge_recipe_versions'):req(token in api,'Build 222 API missing '+token)
for forbidden in ('UPDATE creative_work_projects','UPDATE creative_project_operations','UPDATE creative_project_knowledge_summaries','UPDATE site_item_inventory','INSERT INTO site_inventory_movements','INSERT INTO creative_assets','UPDATE creative_assets','bucket.put(','bucket.delete(','INSERT INTO accounting_','INSERT INTO payments'):req(forbidden not in api,'Build 222 crosses source authority boundary: '+forbidden)
for token in ('Project-to-Knowledge promotion &amp; recipe history','Approved Creative Project','Failure / rework notes','Worked once — do not generalize','Recipe version history','Superseded recipes remain evidence'):req(token in ui,'Build 222 UI missing '+token)
req('workshopKnowledge222Mount' in page and '/public/js/admin-workshop-knowledge-build222.js?v=467b222' in page,'Workshop Knowledge page missing Build 222 promotion/history workspace')
req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,'Workshop Knowledge page must contain exactly one H1')
for path in ('functions/api/admin/workshop-knowledge-promotion.js','public/js/admin-workshop-knowledge-build222.js','functions/api/admin/it-operations-control-tower.js'):
 q=subprocess.run(['node','--check',str(ROOT/path)],text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);req(q.returncode==0,path+' syntax failed: '+(q.stderr or q.stdout)[-1500:])
if FAIL:
 print('RELEASE 467 BUILD 222 PROJECT TO KNOWLEDGE PROMOTION RECIPE HISTORY: FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('RELEASE 467 BUILD 222 PROJECT TO KNOWLEDGE PROMOTION RECIPE HISTORY: PASS')
print('Canonical migration: 0021')
print('Promotion authority: APPROVED CREATIVE PROJECT LESSONS ONLY')
print('Worked-once => best setting / source authority / Inventory mutation: ZERO')
