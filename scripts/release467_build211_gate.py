#!/usr/bin/env python3
from pathlib import Path
import json,re,subprocess,sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
DEV='228d50a0a71d8b99e24f888b8bcd25b9c839a396';TREE='f8e85d5e91a9eee5a9c64901865efe24be1ad34e';MAIN='6e81942e7fd54157698b640252eed256b0411752'
PROOFS={'system_gate_run':35519319569,'current_application_quality_run':35519319561,'it_admin_runtime_proof_run':35519319637,'branch_hygiene_run':35519319612}
def req(ok,msg):
 if not ok:FAIL.append(msg)
def read(p):
 f=ROOT/p
 if not f.is_file():FAIL.append(f'missing {p}');return''
 return f.read_text(encoding='utf-8',errors='replace')
def load(p):return json.loads(read(p) or '{}')
p=load('current-development-authority.json');b=load('release467-build211-manufacturing-triage-route.json');b210=load('release467-build210-custom-work-intake-2.json');m=load('migrations/canonical/manifest.json')
mig=read('migrations/canonical/0011_release467_manufacturing_triage_route.sql');api=read('functions/api/admin/custom-work-triage.js');client=read('public/js/admin-custom-work-triage-build211.js');page=read('admin/custom-request/index.html')
req(p.get('build')==211 and p.get('title')=='Manufacturing Triage & Route Proposal','Build 211 current pointer identity drifted')
req(p.get('accepted_dev_sha')==DEV and p.get('accepted_dev_tree_sha')==TREE and (p.get('acceptance') or {})==PROOFS,'Build 211 predecessor Development proof drifted')
prod=p.get('production_checkpoint') or {};req(prod.get('build')==210 and prod.get('main_sha')==MAIN and prod.get('tree_sha')==TREE and int(prod.get('production_pages_deploy_run') or 0)==35519559453 and int(prod.get('production_live_resource_integrity_run') or 0)==35519611667,'Build 210 Production predecessor drifted')
req(b.get('build')==211 and b.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE','Build 211 authority drifted')
req(b210.get('state')=='PRODUCTION_GREEN','Build 210 must remain Production GREEN')
files=[x.get('file') for x in m.get('migrations',[]) if isinstance(x,dict)];req(len(files)==11 and files[-1]=='0011_release467_manufacturing_triage_route.sql','canonical migration stream must end at 0011')
for token in ('CREATE TABLE IF NOT EXISTS custom_request_manufacturing_triage','CREATE TABLE IF NOT EXISTS custom_request_route_processes','REFERENCES custom_requests(custom_request_id)','REFERENCES inventory_processes(inventory_process_id)','UNIQUE(custom_request_id, inventory_process_id)','UNIQUE(custom_request_id, route_order)'):req(token in mig,f'Build 211 migration missing {token}')
req('INSERT INTO custom_request_route_processes' not in mig,'migration 0011 must not invent candidate routes')
for ddl in ('CREATE TABLE','ALTER TABLE','DROP TABLE','CREATE INDEX'):req(ddl not in api.upper(),f'Build 211 API contains request-time DDL {ddl}')
for token in ('getAdminUserFromRequest','auditAdminAction','custom_request_manufacturing_triage','custom_request_route_processes','inventory_processes','candidate_process_ids','next_clarification_question','automatic_feasibility_promise:false','automatic_quote:false','automatic_order:false','automatic_stock_reservation:false'):req(token in api,f'Build 211 API missing {token}')
for token in ('Manufacturing triage & candidate route','candidate_process_ids','specialist_review_required','proof_sample_required','material_unknowns','next_clarification_question','Save reviewed triage','No quote, order, stock reservation'):req(token in client,f'Build 211 client missing {token}')
req('customWorkTriage211Mount' in page and '/public/js/admin-custom-work-triage-build211.js?v=467b211' in page,'Custom Work page missing Build 211 triage surface')
req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,'Custom Work admin page must retain exactly one H1')
for path in ('functions/api/admin/custom-work-triage.js','public/js/admin-custom-work-triage-build211.js'):
 q=subprocess.run(['node','--check',str(ROOT/path)],text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);req(q.returncode==0,f'{path} syntax failed: {(q.stderr or q.stdout)[-500:]}')
if FAIL:print('RELEASE 467 BUILD 211 MANUFACTURING TRIAGE & ROUTE PROPOSAL: FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('RELEASE 467 BUILD 211 MANUFACTURING TRIAGE & ROUTE PROPOSAL: PASS')
print('Request authority: custom_requests')
print('Process authority: inventory_processes')
print('Automatic feasibility / quote / order / stock reservation: ZERO')
