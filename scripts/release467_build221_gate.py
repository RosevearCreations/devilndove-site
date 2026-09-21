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
p=load('current-development-authority.json');b=load('release467-build221-workshop-knowledge-library-foundation.json');m=load('migrations/canonical/manifest.json')
mig=read('migrations/canonical/0020_release467_workshop_knowledge_library_foundation.sql');api=read('functions/api/admin/workshop-knowledge-library.js');ui=read('public/js/admin-workshop-knowledge-build221.js');page=read('admin/workshop-knowledge/index.html')
req(int(p.get('build') or 0)>=221,'current successor must retain Build 221 or later')
req(b.get('state')=='PRODUCTION_GREEN','Build 221 retained authority must be Production GREEN')
final=b.get('final_closure') or {};prod=b.get('production_checkpoint') or {}
req(final.get('dev_sha')==DEV and final.get('tree_sha')==TREE and (final.get('proofs') or {})==PROOFS and int(final.get('build_specific_proof_run') or 0)==35619862180,'Build 221 exact Development closure drifted')
req(prod.get('main_sha')==MAIN and prod.get('tree_sha')==TREE and int(prod.get('production_pages_deploy_run') or 0)==35620308181 and int(prod.get('production_live_resource_integrity_run') or 0)==35620434376 and int(prod.get('products_browser_proof_run') or 0)==35620434354 and int(prod.get('products_route_proof_run') or 0)==35620434404 and int(prod.get('build_specific_proof_run') or 0)==35620308104 and prod.get('state')=='PRODUCTION_GREEN','Build 221 exact Production closure drifted')
files=[x.get('file') for x in m.get('migrations',[]) if isinstance(x,dict)]
req(len(files)>=20 and files[19]=='0020_release467_workshop_knowledge_library_foundation.sql','retained canonical stream lost migration 0020')
for token in ('CREATE TABLE IF NOT EXISTS workshop_knowledge_entries','CREATE TABLE IF NOT EXISTS workshop_knowledge_entry_settings','REFERENCES inventory_processes(inventory_process_id)','REFERENCES site_item_inventory(site_item_inventory_id)',"copy_mode='reference_only'"):req(token in mig,'Build 221 migration missing '+token)
for ddl in ('CREATE TABLE','ALTER TABLE','DROP TABLE','CREATE INDEX','DROP INDEX'):req(ddl not in api.upper(),'Build 221 retained API contains request-time DDL '+ddl)
for token in ('Workshop Knowledge Library','Reviewed observations only','Missing or untested settings stay unknown'):req(token in ui,'Build 221 retained UI missing '+token)
req('workshopKnowledge221Mount' in page and '/public/js/admin-workshop-knowledge-build221.js?v=467b221' in page,'Workshop Knowledge page lost Build 221 foundation workspace')
req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,'Workshop Knowledge page must retain exactly one H1')
for path in ('functions/api/admin/workshop-knowledge-library.js','public/js/admin-workshop-knowledge-build221.js'):
 q=subprocess.run(['node','--check',str(ROOT/path)],text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);req(q.returncode==0,path+' syntax failed: '+(q.stderr or q.stdout)[-1200:])
if FAIL:
 print('RELEASE 467 BUILD 221 WORKSHOP KNOWLEDGE LIBRARY FOUNDATION: FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('RELEASE 467 BUILD 221 WORKSHOP KNOWLEDGE LIBRARY FOUNDATION: PASS')
print('Build 221 Development closure: EXACT GREEN')
print('Build 221 Production closure: EXACT GREEN')
print('Build 221 authority: RETAINED BY SUCCESSOR')
