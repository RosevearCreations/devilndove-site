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
p=load('current-development-authority.json');b=load('release467-build219-manufacturing-work-order-job-traveler.json');m=load('migrations/canonical/manifest.json')
api=read('functions/api/admin/manufacturing-job-traveler.js');ui=read('public/js/admin-manufacturing-job-traveler-build219.js');page=read('admin/custom-request/index.html')
req(int(p.get('build') or 0)>=219,'current successor must retain Build 219 or later')
req(b.get('build')==219 and b.get('state')=='PRODUCTION_GREEN','Build 219 retained authority must be Production GREEN')
final=b.get('final_closure') or {}
req(final.get('dev_sha')==DEV and final.get('tree_sha')==TREE and (final.get('proofs') or {})==PROOFS and int(final.get('build_specific_proof_run') or 0)==35559932358,'Build 219 exact Development closure drifted')
prod=b.get('production_checkpoint') or {}
req(prod.get('main_sha')==MAIN and prod.get('tree_sha')==TREE and int(prod.get('production_pages_deploy_run') or 0)==35560514490 and int(prod.get('production_live_resource_integrity_run') or 0)==35560585150 and int(prod.get('products_browser_proof_run') or 0)==35560585205 and int(prod.get('products_route_proof_run') or 0)==35560585179 and int(prod.get('build_specific_proof_run') or 0)==35560514532 and prod.get('state')=='PRODUCTION_GREEN','Build 219 exact Production closure drifted')
files=[x.get('file') for x in m.get('migrations',[]) if isinstance(x,dict)]
req(len(files)>=18 and files[17]=='0018_release467_manufacturing_work_order_job_traveler.sql','retained canonical stream lost migration 0018')
for ddl in ('CREATE TABLE','ALTER TABLE','DROP TABLE','CREATE INDEX','DROP INDEX'):req(ddl not in api.upper(),'Build 219 retained API contains request-time DDL '+ddl)
for token in ('creative_project_job_travelers','creative_project_job_traveler_events','snapshot_sha256','orchestration_only:true','inventory_mutation:false','finance_mutation:false'):req(token in api,'Build 219 retained API missing '+token)
for token in ('Manufacturing Work Order &amp; Job Traveler','Evidence-capture checklist','Review &amp; create traveler version'):req(token in ui,'Build 219 retained UI missing '+token)
req('customWorkJobTraveler219Mount' in page and '/public/js/admin-manufacturing-job-traveler-build219.js?v=467b219' in page,'Custom Work page lost Build 219 traveler workspace')
req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,'Custom Work page must retain exactly one H1')
for path in ('functions/api/admin/manufacturing-job-traveler.js','public/js/admin-manufacturing-job-traveler-build219.js'):
 q=subprocess.run(['node','--check',str(ROOT/path)],text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
 req(q.returncode==0,path+' syntax failed: '+(q.stderr or q.stdout)[-1200:])
if FAIL:
 print('RELEASE 467 BUILD 219 MANUFACTURING WORK ORDER JOB TRAVELER: FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('RELEASE 467 BUILD 219 MANUFACTURING WORK ORDER JOB TRAVELER: PASS')
print('Build 219 Development closure: EXACT GREEN')
print('Build 219 Production closure: EXACT GREEN')
print('Build 219 authority: RETAINED BY SUCCESSOR')
