#!/usr/bin/env python3
from pathlib import Path
import json,re,subprocess,sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
DEV='7891a869d748072846a1ac9452782e119f01cd53';TREE='f972119d10f98ea566173868915463ce31cdf22c';MAIN='9ea6c728a4df978d653be910388ea7081b800de9'
PROOFS={'system_gate_run':35526209718,'current_application_quality_run':35526209719,'it_admin_runtime_proof_run':35526209723,'branch_hygiene_run':35526209630}
def req(ok,msg):
 if not ok:FAIL.append(msg)
def read(p):
 f=ROOT/p
 if not f.is_file():FAIL.append(f'missing {p}');return''
 return f.read_text(encoding='utf-8',errors='replace')
def load(p):return json.loads(read(p) or '{}')
p=load('current-development-authority.json');b=load('release467-build212-hybrid-creative-project-operations.json');m=load('migrations/canonical/manifest.json')
req(int(p.get('build') or 0)>=212,'current pointer regressed before Build 212')
req('release467-build212-hybrid-creative-project-operations.json' in (p.get('current_release_authorities') or []),'successor pointer lost Build 212 authority')
req(b.get('build')==212 and b.get('state')=='PRODUCTION_GREEN','Build 212 retained authority must be Production GREEN')
final=b.get('final_closure') or {};req(final.get('dev_sha')==DEV and final.get('tree_sha')==TREE and (final.get('proofs') or {})==PROOFS and int(final.get('build_specific_proof_run') or 0)==35526209730,'Build 212 exact Development closure drifted')
prod=b.get('production_checkpoint') or {};req(prod.get('main_sha')==MAIN and prod.get('tree_sha')==TREE and int(prod.get('production_pages_deploy_run') or 0)==35526432043 and int(prod.get('production_live_resource_integrity_run') or 0)==35526530121 and int(prod.get('build_specific_proof_run') or 0)==35526432021,'Build 212 Production closure drifted')
files=[x.get('file') for x in m.get('migrations',[]) if isinstance(x,dict)];req('0012_release467_hybrid_creative_project_operations.sql' in files,'Build 212 migration missing from canonical stream')
mig=read('migrations/canonical/0012_release467_hybrid_creative_project_operations.sql');api=read('functions/api/admin/creative-project-operations.js');page=read('admin/creative-process/index.html')
for token in ('creative_project_operations','creative_project_operation_dependencies','creative_project_operation_resources','REFERENCES creative_work_projects(creative_work_project_id)','REFERENCES inventory_processes(inventory_process_id)'):req(token in mig,f'Build 212 migration lost {token}')
for ddl in ('CREATE TABLE','ALTER TABLE','DROP TABLE','CREATE INDEX'):req(ddl not in api.upper(),f'Build 212 API contains request-time DDL {ddl}')
for forbidden in ('UPDATE site_item_inventory','INSERT INTO site_inventory_movements','INSERT INTO creative_work_events','INSERT INTO creative_projects','INSERT INTO creative_assets'):req(forbidden not in api,f'Build 212 owner boundary drifted: {forbidden}')
req('creativeOperations212Mount' in page,'Creative Process page lost Build 212 operation planner')
req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,'Creative Process page must retain exactly one H1')
for path in ('functions/api/admin/creative-project-operations.js','public/js/admin-creative-project-operations-build212.js'):
 q=subprocess.run(['node','--check',str(ROOT/path)],text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);req(q.returncode==0,f'{path} syntax failed')
if FAIL:print('RELEASE 467 BUILD 212 RETAINED HYBRID CREATIVE PROJECT CLOSURE: FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('RELEASE 467 BUILD 212 RETAINED HYBRID CREATIVE PROJECT CLOSURE: PASS')
