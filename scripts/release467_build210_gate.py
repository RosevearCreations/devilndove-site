#!/usr/bin/env python3
from pathlib import Path
import json,re,subprocess,sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
DEV='228d50a0a71d8b99e24f888b8bcd25b9c839a396';TREE='f8e85d5e91a9eee5a9c64901865efe24be1ad34e';MAIN='6e81942e7fd54157698b640252eed256b0411752'
PROOFS={'system_gate_run':35519319569,'current_application_quality_run':35519319561,'it_admin_runtime_proof_run':35519319637,'branch_hygiene_run':35519319612}
COLS=('quantity','project_intent','intended_use','organization_name','event_context_structured','supplied_item','desired_material','desired_finish','personalization_text','requested_capability_key','tolerance_size_notes','help_choose_method')
def req(ok,msg):
 if not ok:FAIL.append(msg)
def read(p):
 f=ROOT/p
 if not f.is_file():FAIL.append(f'missing {p}');return''
 return f.read_text(encoding='utf-8',errors='replace')
def load(p):return json.loads(read(p) or '{}')
p=load('current-development-authority.json');b=load('release467-build210-custom-work-intake-2.json');m=load('migrations/canonical/manifest.json')
req(int(p.get('build') or 0)>=210,'current pointer regressed before Build 210')
req('release467-build210-custom-work-intake-2.json' in (p.get('current_release_authorities') or []),'successor pointer lost Build 210 authority')
req(b.get('build')==210 and b.get('state')=='PRODUCTION_GREEN','Build 210 retained authority must be Production GREEN')
final=b.get('final_closure') or {};req(final.get('dev_sha')==DEV and final.get('tree_sha')==TREE and (final.get('proofs') or {})==PROOFS and int(final.get('build_specific_proof_run') or 0)==35519319562,'Build 210 exact Development closure drifted')
prod=b.get('production_checkpoint') or {};req(prod.get('main_sha')==MAIN and prod.get('tree_sha')==TREE and int(prod.get('production_pages_deploy_run') or 0)==35519559453 and int(prod.get('production_live_resource_integrity_run') or 0)==35519611667 and int(prod.get('build_specific_proof_run') or 0)==35519559362,'Build 210 Production closure drifted')
mig=read('migrations/canonical/0010_release467_custom_work_intake_2.sql')
for col in COLS:req(f'ADD COLUMN {col}' in mig,f'Build 210 migration lost {col}')
api=read('functions/api/custom-request.js');page=read('custom-request/index.html')
req('manufacturing_route_proposed: false' in api and 'automatic_quote_created: false' in api,'Build 210 automatic-action boundary drifted')
req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,'Custom Work public page must retain one H1')
for path in ('functions/api/custom-request.js','public/js/custom-request-intake.js'):
 q=subprocess.run(['node','--check',str(ROOT/path)],text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);req(q.returncode==0,f'{path} syntax failed')
if FAIL:print('RELEASE 467 BUILD 210 RETAINED CUSTOM WORK INTAKE CLOSURE: FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('RELEASE 467 BUILD 210 RETAINED CUSTOM WORK INTAKE CLOSURE: PASS')
