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
p=load('current-development-authority.json');b=load('release467-build220-production-run-qa-rework-scrap-evidence.json');m=load('migrations/canonical/manifest.json')
api=read('functions/api/admin/production-run-evidence.js');ui=read('public/js/admin-production-run-evidence-build220.js');page=read('admin/custom-request/index.html')
DEV='79abf5b94a7080a25b2feb38bb10cfdde9dcf4c2';TREE='b68b2c8efbf187da8c9414eb4a7e5b24405f5029';MAIN='4579e9b91c0676d775f32859a0169ec749bf2194'
PROOFS={'system_gate_run':35606184887,'current_application_quality_run':35606184822,'it_admin_runtime_proof_run':35606184538,'branch_hygiene_run':35606184707}
req(int(p.get('build') or 0)>=220,'current successor must retain Build 220 or later')
req(b.get('build')==220 and b.get('state')=='PRODUCTION_GREEN','Build 220 retained authority must be Production GREEN')
final=b.get('final_closure') or {}
req(final.get('dev_sha')==DEV and final.get('tree_sha')==TREE and (final.get('proofs') or {})==PROOFS and int(final.get('build_specific_proof_run') or 0)==35606184585,'Build 220 exact Development closure drifted')
prod=b.get('production_checkpoint') or {}
req(prod.get('main_sha')==MAIN and prod.get('tree_sha')==TREE and int(prod.get('production_pages_deploy_run') or 0)==35607469436 and int(prod.get('production_live_resource_integrity_run') or 0)==35607606049 and int(prod.get('products_browser_proof_run') or 0)==35607606000 and int(prod.get('products_route_proof_run') or 0)==35607605559 and int(prod.get('build_specific_proof_run') or 0)==35607469438 and prod.get('state')=='PRODUCTION_GREEN','Build 220 exact Production closure drifted')
files=[x.get('file') for x in m.get('migrations',[]) if isinstance(x,dict)]
req(len(files)>=19 and files[18]=='0019_release467_production_run_qa_rework_scrap_evidence.sql','retained canonical stream lost migration 0019')
for ddl in ('CREATE TABLE','ALTER TABLE','DROP TABLE','CREATE INDEX','DROP INDEX'):req(ddl not in api.upper(),'Build 220 retained API contains request-time DDL '+ddl)
for token in ('creative_project_production_runs','creative_project_production_run_qa_checks','creative_project_production_run_material_evidence','inventory_mutation:false','finance_mutation:false'):req(token in api,'Build 220 retained API missing '+token)
for token in ('Production Run, QA, Rework &amp; Scrap Evidence','Record reviewed production run','Corrections are void-and-replace'):req(token in ui,'Build 220 retained UI missing '+token)
req('customWorkProductionRun220Mount' in page and '/public/js/admin-production-run-evidence-build220.js?v=467b220' in page,'Custom Work page lost Build 220 production-run workspace')
req(len(re.findall(r'<h1(?:\\s|>)',page,re.I))==1,'Custom Work page must retain exactly one H1')
for path in ('functions/api/admin/production-run-evidence.js','public/js/admin-production-run-evidence-build220.js'):
 q=subprocess.run(['node','--check',str(ROOT/path)],text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
 req(q.returncode==0,path+' syntax failed: '+(q.stderr or q.stdout)[-1200:])
if FAIL:
 print('RELEASE 467 BUILD 220 PRODUCTION RUN QA REWORK SCRAP EVIDENCE: FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('RELEASE 467 BUILD 220 PRODUCTION RUN QA REWORK SCRAP EVIDENCE: PASS')
print('Build 220 Development closure: EXACT GREEN')
print('Build 220 Production closure: EXACT GREEN')
print('Build 220 authority: RETAINED BY SUCCESSOR')
