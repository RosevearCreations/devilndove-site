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
p=load('current-development-authority.json');b=load('release467-build211-manufacturing-triage-route.json');m=load('migrations/canonical/manifest.json')
req(int(p.get('build') or 0)>=211,'current pointer regressed before Build 211')
req('release467-build211-manufacturing-triage-route.json' in (p.get('current_release_authorities') or []),'successor pointer lost Build 211 authority')
req(b.get('build')==211 and b.get('state')=='PRODUCTION_GREEN','Build 211 retained authority must be Production GREEN')
final=b.get('final_closure') or {};req(final.get('dev_sha')==DEV and final.get('tree_sha')==TREE and (final.get('proofs') or {})==PROOFS and int(final.get('build_specific_proof_run') or 0)==35524455858,'Build 211 exact Development closure drifted')
prod=b.get('production_checkpoint') or {};req(prod.get('main_sha')==MAIN and prod.get('tree_sha')==TREE and int(prod.get('production_pages_deploy_run') or 0)==35524655164 and int(prod.get('production_live_resource_integrity_run') or 0)==35524741052 and int(prod.get('build_specific_proof_run') or 0)==35524655209,'Build 211 Production closure drifted')
files=[x.get('file') for x in m.get('migrations',[]) if isinstance(x,dict)];req('0011_release467_manufacturing_triage_route.sql' in files,'Build 211 migration missing from canonical stream')
mig=read('migrations/canonical/0011_release467_manufacturing_triage_route.sql');api=read('functions/api/admin/custom-work-triage.js');client=read('public/js/admin-custom-work-triage-build211.js');page=read('admin/custom-request/index.html')
for token in ('custom_request_manufacturing_triage','custom_request_route_processes','REFERENCES custom_requests(custom_request_id)','REFERENCES inventory_processes(inventory_process_id)'):req(token in mig,f'Build 211 migration lost {token}')
for ddl in ('CREATE TABLE','ALTER TABLE','DROP TABLE','CREATE INDEX'):req(ddl not in api.upper(),f'Build 211 API contains request-time DDL {ddl}')
for token in ('automatic_feasibility_promise:false','automatic_quote:false','automatic_order:false','automatic_stock_reservation:false'):req(token in api,f'Build 211 safety boundary lost {token}')
req('customWorkTriage211Mount' in page and '/public/js/admin-custom-work-triage-build211.js?v=467b211' in page,'Custom Work page lost Build 211 triage surface')
req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,'Custom Work admin page must retain exactly one H1')
for path in ('functions/api/admin/custom-work-triage.js','public/js/admin-custom-work-triage-build211.js'):
 q=subprocess.run(['node','--check',str(ROOT/path)],text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);req(q.returncode==0,f'{path} syntax failed')
if FAIL:print('RELEASE 467 BUILD 211 RETAINED MANUFACTURING TRIAGE CLOSURE: FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('RELEASE 467 BUILD 211 RETAINED MANUFACTURING TRIAGE CLOSURE: PASS')
