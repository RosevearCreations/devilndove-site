#!/usr/bin/env python3
from pathlib import Path
import json,re,subprocess,sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
DEV='79abf5b94a7080a25b2feb38bb10cfdde9dcf4c2';TREE='b68b2c8efbf187da8c9414eb4a7e5b24405f5029';MAIN='4579e9b91c0676d775f32859a0169ec749bf2194'
PROOFS={'system_gate_run':35606184887,'current_application_quality_run':35606184822,'it_admin_runtime_proof_run':35606184538,'branch_hygiene_run':35606184707}
def req(ok,msg):
 if not ok:FAIL.append(msg)
def read(p):
 f=ROOT/p
 if not f.is_file():FAIL.append('missing '+p);return''
 return f.read_text(encoding='utf-8',errors='replace')
def load(p):return json.loads(read(p) or '{}')
p=load('current-development-authority.json');b=load('release467-build221-workshop-knowledge-library-foundation.json');b220=load('release467-build220-production-run-qa-rework-scrap-evidence.json');m=load('migrations/canonical/manifest.json')
mig=read('migrations/canonical/0020_release467_workshop_knowledge_library_foundation.sql');api=read('functions/api/admin/workshop-knowledge-library.js');ui=read('public/js/admin-workshop-knowledge-build221.js');page=read('admin/workshop-knowledge/index.html');creative=read('admin/creative-process/index.html')
req(p.get('build')==221 and p.get('title')=='Workshop Knowledge Library Foundation','Build 221 pointer identity drifted')
req(p.get('accepted_dev_sha')==DEV and p.get('accepted_dev_tree_sha')==TREE and (p.get('acceptance') or {})==PROOFS,'Build 221 predecessor Development proof drifted')
prod=p.get('production_checkpoint') or {}
req(prod.get('build')==220 and prod.get('main_sha')==MAIN and prod.get('tree_sha')==TREE and int(prod.get('production_pages_deploy_run') or 0)==35607469436 and int(prod.get('production_live_resource_integrity_run') or 0)==35607606049,'Build 220 Production predecessor drifted')
req(b.get('build')==221 and b.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE','Build 221 authority drifted')
req(b220.get('state')=='PRODUCTION_GREEN','Build 220 retained authority must be Production GREEN')
files=[x.get('file') for x in m.get('migrations',[]) if isinstance(x,dict)]
req(len(files)==20 and files[-1]=='0020_release467_workshop_knowledge_library_foundation.sql','Build 221 canonical migration 0020 is not current tail')
for token in ('CREATE TABLE IF NOT EXISTS workshop_knowledge_entries','CREATE TABLE IF NOT EXISTS workshop_knowledge_entry_processes','CREATE TABLE IF NOT EXISTS workshop_knowledge_entry_inventory_refs','CREATE TABLE IF NOT EXISTS workshop_knowledge_entry_settings','CREATE TABLE IF NOT EXISTS workshop_knowledge_entry_evidence_refs','CREATE TABLE IF NOT EXISTS workshop_knowledge_entry_events','REFERENCES inventory_processes(inventory_process_id)','REFERENCES site_item_inventory(site_item_inventory_id)','REFERENCES creative_work_projects(creative_work_project_id)',"copy_mode='reference_only'",'PRAGMA foreign_key_check'):req(token in mig,'Build 221 migration missing '+token)
for ddl in ('CREATE TABLE','ALTER TABLE','DROP TABLE','CREATE INDEX','DROP INDEX','CREATE VIEW','DROP VIEW'):req(ddl not in api.upper(),'Build 221 API contains request-time DDL '+ddl)
for token in ('workshop_knowledge_entries','inventory_processes','site_item_inventory','creative_work_projects','creative_project_operations','unknown_settings_remain_unknown:true','ai_generated_best_settings:false','media_copy:false','reference_only','review_entry','void_entry'):req(token in api,'Build 221 API missing '+token)
for forbidden in ('UPDATE site_item_inventory','INSERT INTO site_inventory_movements','UPDATE inventory_processes','UPDATE creative_work_projects','UPDATE creative_project_operations','INSERT INTO creative_assets','UPDATE creative_assets','INSERT INTO media_assets','UPDATE media_assets','bucket.put(','bucket.delete(','INSERT INTO accounting_','INSERT INTO payments'):req(forbidden not in api,'Build 221 crosses source authority boundary: '+forbidden)
for token in ('Workshop Knowledge Library','Reviewed observations only','Missing or untested settings stay unknown','Review &amp; lock entry','Safety / constraint evidence note','Evidence source note'):req(token in ui,'Build 221 UI missing '+token)
req('workshopKnowledge221Mount' in page and '/public/js/admin-workshop-knowledge-build221.js?v=467b221' in page,'Workshop Knowledge page missing Build 221 workspace')
req('/admin/workshop-knowledge/' in creative,'Creative Process page lost Workshop Knowledge navigation')
req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,'Workshop Knowledge page must contain exactly one H1')
for path in ('functions/api/admin/workshop-knowledge-library.js','public/js/admin-workshop-knowledge-build221.js'):
 q=subprocess.run(['node','--check',str(ROOT/path)],text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
 req(q.returncode==0,path+' syntax failed: '+(q.stderr or q.stdout)[-1500:])
if FAIL:
 print('RELEASE 467 BUILD 221 WORKSHOP KNOWLEDGE LIBRARY FOUNDATION: FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('RELEASE 467 BUILD 221 WORKSHOP KNOWLEDGE LIBRARY FOUNDATION: PASS')
print('Canonical migration: 0020')
print('Knowledge authority: REVIEWED SOURCE-BACKED INTERNAL REFERENCES')
print('AI best-setting generation / source media copy / Inventory mutation: ZERO')
